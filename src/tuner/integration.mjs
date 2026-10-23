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
 *   /tuner/base-styles the Details phase's design-system sheet
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
 *   /__mast/training/feedback {}
 *     Add or remove a comment in src/training/feedback.json, or just read
 *     it; each replies with the full list and whether an agent is
 *     listening (see ./feedback.mjs).
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
import {
  addComment,
  deleteComment,
  isListening,
  readFeedback,
} from "./feedback.mjs";

export { readFeedback };

const DIALS_FILE = "src/dials.ts";
// Keep in sync with PREVIEW_FILE in src/dials.ts.
const PREVIEW_FILE = ".astro/dials-preview.json";
export const TRAINING_DIR = "src/training/pages";

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
          pattern: "/tuner/base-styles",
          entrypoint: new URL("./BaseStyles.astro", import.meta.url),
        });
        injectRoute({
          pattern: "/training/[page]",
          entrypoint: new URL("./TrainingPage.astro", import.meta.url),
        });
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
              case "/training/feedback":
                result = { ...readFeedback(), listening: isListening() };
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
