// @ts-check
/**
 * The Mast tuner: a dev-only canvas at /tuner for turning the dials in
 * src/dials.ts while watching the example pages respond.
 *
 * In `astro dev` this integration injects the /tuner route and two small
 * endpoints. Nothing here runs in, or ships with, a production build.
 *
 *   POST /__mast/dials/preview  { layoutName: stop, … }
 *     Writes unsaved layout positions to the preview file, which
 *     getLayout() reads in dev. `{}` clears it.
 *   POST /__mast/dials/save     { dialName: value, … }
 *     Rewrites each dial's `value:` line in src/dials.ts and clears the
 *     preview.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const DIALS_FILE = "src/dials.ts";
// Keep in sync with PREVIEW_FILE in src/dials.ts.
const PREVIEW_FILE = ".astro/dials-preview.json";

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
      },
      "astro:server:setup": ({ server }) => {
        rmSync(PREVIEW_FILE, { force: true });
        server.middlewares.use("/__mast/dials", async (req, res) => {
          try {
            if (req.method !== "POST") throw new Error("POST only");
            const values = sanitize(JSON.parse(await body(req)));
            if (req.url === "/preview") {
              mkdirSync(dirname(PREVIEW_FILE), { recursive: true });
              writeFileSync(PREVIEW_FILE, JSON.stringify(values, null, 2));
            } else if (req.url === "/save") {
              writeFileSync(
                DIALS_FILE,
                writeValues(readFileSync(DIALS_FILE, "utf8"), values),
              );
              rmSync(PREVIEW_FILE, { force: true });
            } else {
              throw new Error(`Unknown action ${req.url}`);
            }
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ ok: true }));
          } catch (error) {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: String(error) }));
          }
        });
      },
    },
  };
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
