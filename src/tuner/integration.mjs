// @ts-check
/**
 * The Mast tuner: a dev-only canvas at /tuner for tuning a site in three
 * phases — Details (tokens), Expression (dials), Training (layout taste).
 *
 * In `astro dev` this integration injects the tuner routes and a few
 * small endpoints. Nothing here runs in, or ships with, a production
 * build.
 *
 * Routes:
 *   /tuner             the canvas and panel
 *   /tuner/specimen    the Details phase's design-system sheet
 *   /training/<name>   every page in src/training/pages/
 *
 * Endpoints (POST, JSON):
 *   /__mast/dials/preview    { choiceName: stop, … }
 *     Unsaved choice positions, read by getChoices() in dev. `{}` clears.
 *   /__mast/dials/save       { dialName: value, … }
 *     Rewrites each dial's `value:` line in src/dials.ts.
 *   /__mast/tokens/save      { "--token": "value", … }
 *     Rewrites each token's line in the top half of tokens.css.
 *   /__mast/training/comment { page, section, recipe, variant, heading,
 *                              verdict, note }
 *   /__mast/training/delete  { id }
 *     Add or remove a comment in src/training/feedback.json; both reply
 *     with the full comment list.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
import { TOKENS_FILE, writeTokens } from "./tokens.mjs";

const DIALS_FILE = "src/dials.ts";
// Keep in sync with PREVIEW_FILE in src/dials.ts.
const PREVIEW_FILE = ".astro/dials-preview.json";
export const TRAINING_DIR = "src/training/pages";
export const FEEDBACK_FILE = "src/training/feedback.json";

/** @returns {import("astro").AstroIntegration} */
export default function mastTuner() {
  return {
    name: "mast-tuner",
    hooks: {
      "astro:config:setup": ({ command, injectRoute }) => {
        if (command !== "dev") return;
        injectRoute({
          pattern: "/tuner",
          entrypoint: new URL("./Tuner.astro", import.meta.url),
        });
        injectRoute({
          pattern: "/tuner/specimen",
          entrypoint: new URL("./Specimen.astro", import.meta.url),
        });
        for (const name of trainingPages()) {
          injectRoute({
            pattern: `/training/${name}`,
            entrypoint: `${TRAINING_DIR}/${name}.astro`,
          });
        }
      },
      "astro:server:setup": ({ server }) => {
        rmSync(PREVIEW_FILE, { force: true });
        server.middlewares.use("/__mast", async (req, res) => {
          try {
            if (req.method !== "POST") throw new Error("POST only");
            const input = JSON.parse(await body(req));
            /** @type {unknown} */
            let result = { ok: true };
            switch (req.url) {
              case "/dials/preview":
                mkdirSync(dirname(PREVIEW_FILE), { recursive: true });
                writeFileSync(
                  PREVIEW_FILE,
                  JSON.stringify(sanitize(input), null, 2),
                );
                break;
              case "/dials/save":
                writeFileSync(
                  DIALS_FILE,
                  writeValues(
                    readFileSync(DIALS_FILE, "utf8"),
                    sanitize(input),
                  ),
                );
                rmSync(PREVIEW_FILE, { force: true });
                break;
              case "/tokens/save":
                writeFileSync(
                  TOKENS_FILE,
                  writeTokens(readFileSync(TOKENS_FILE, "utf8"), input),
                );
                break;
              case "/training/comment":
                result = addComment(input);
                break;
              case "/training/delete":
                result = deleteComment(input);
                break;
              default:
                throw new Error(`Unknown action ${req.url}`);
            }
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify(result));
          } catch (error) {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: String(error) }));
          }
        });
      },
    },
  };
}

/** Page names (file names without .astro) in src/training/pages/. */
export function trainingPages() {
  if (!existsSync(TRAINING_DIR)) return [];
  return readdirSync(TRAINING_DIR)
    .filter((file) => file.endsWith(".astro"))
    .map((file) => file.slice(0, -".astro".length))
    .sort();
}

/**
 * @typedef {{ id: string, page: string, section: number, recipe?: string,
 *   variant?: string, heading?: string, verdict: "keep" | "refine" | "avoid",
 *   note: string, created: string }} Comment
 */

/** @returns {{ comments: Comment[] }} */
export function readFeedback() {
  try {
    return JSON.parse(readFileSync(FEEDBACK_FILE, "utf8"));
  } catch {
    return { comments: [] };
  }
}

/** @param {{ comments: Comment[] }} feedback */
function writeFeedback(feedback) {
  mkdirSync(dirname(FEEDBACK_FILE), { recursive: true });
  writeFileSync(FEEDBACK_FILE, JSON.stringify(feedback, null, 2) + "\n");
  return feedback;
}

/** @param {string} text @param {number} max */
const clip = (text, max) => String(text ?? "").slice(0, max);

/** @param {any} input */
function addComment(input) {
  const verdict = ["keep", "refine", "avoid"].includes(input.verdict)
    ? input.verdict
    : "refine";
  const page = clip(input.page, 80);
  if (!/^[\w-]+$/.test(page)) throw new Error("Bad page name");
  const feedback = readFeedback();
  feedback.comments.push({
    id: Date.now().toString(36),
    page,
    section: Number.isInteger(input.section) ? input.section : -1,
    recipe: clip(input.recipe, 40) || undefined,
    variant: clip(input.variant, 40) || undefined,
    heading: clip(input.heading, 160) || undefined,
    verdict,
    note: clip(input.note, 2000),
    created: new Date().toISOString(),
  });
  return writeFeedback(feedback);
}

/** @param {any} input */
function deleteComment(input) {
  const feedback = readFeedback();
  feedback.comments = feedback.comments.filter((c) => c.id !== input.id);
  return writeFeedback(feedback);
}

/** @param {import("node:http").IncomingMessage} req */
function body(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

/**
 * Only dial-shaped keys and plain values get through; anything else
 * would be written into a source file.
 * @param {unknown} input
 * @returns {Record<string, string | number>}
 */
function sanitize(input) {
  /** @type {Record<string, string | number>} */
  const out = {};
  for (const [key, value] of Object.entries(input ?? {})) {
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(key)) continue;
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "string" && /^[\w-]{1,40}$/.test(value))
      out[key] = value;
  }
  return out;
}

/**
 * Replace the `value:` line inside each named dial's entry. A layout
 * stop keeps the type its stops are written in (`6` vs `"mixed"`).
 * @param {string} source
 * @param {Record<string, string | number>} values
 */
export function writeValues(source, values) {
  for (const [name, value] of Object.entries(values)) {
    const start = source.indexOf(`\n  ${name}: {\n`);
    if (start === -1) throw new Error(`No dial named ${name}`);
    const end = source.indexOf("\n  },", start);
    const entry = source.slice(start, end);
    const numeric =
      /\n {4}stops: \[\d/.test(entry) || /\n {4}min: /.test(entry);
    const literal = numeric
      ? String(Number(value))
      : JSON.stringify(String(value));
    const updated = entry.replace(
      /\n {4}value: [^\n]*,/,
      `\n    value: ${literal},`,
    );
    if (updated === entry && !entry.includes(`value: ${literal},`))
      throw new Error(`No value line in ${name}`);
    source = source.slice(0, start) + updated + source.slice(end);
  }
  return source;
}
