// @ts-check
/**
 * Read and write the editable top half of src/styles/tokens.css — every
 * `--name: value;` declaration above the generated "Computed" section.
 * Used by the tuner's Details phase (read at render, write on save).
 */

export const TOKENS_FILE = "src/styles/tokens.css";
const COMPUTED_MARKER = "Computed fluid values";

/** @param {string} source */
function editableEnd(source) {
  const marker = source.indexOf(COMPUTED_MARKER);
  return marker === -1 ? source.length : marker;
}

/**
 * The editable region with comments blanked to spaces (same length, so
 * indexes still line up with the source). The header comment quotes
 * example declarations that must never be read or rewritten.
 * @param {string} source
 */
function region(source) {
  return source
    .slice(0, editableEnd(source))
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
}

/**
 * @param {string} source
 * @returns {Record<string, string>}
 */
export function readTokens(source) {
  /** @type {Record<string, string>} */
  const tokens = {};
  for (const match of region(source).matchAll(/(--[\w-]+):\s*([^;{}]+);/g)) {
    tokens[match[1]] ??= match[2]
      .replace(/\s+/g, " ")
      .replace(/\( /g, "(")
      .replace(/ \)/g, ")")
      .trim();
  }
  return tokens;
}

/** Values are written into a stylesheet, so keep them to plain CSS. */
export function isSafeValue(/** @type {unknown} */ value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length < 200 &&
    /^[\w\s#().,%"'+*/-]+$/.test(value)
  );
}

/**
 * @param {string} source
 * @param {Record<string, string>} values
 */
export function writeTokens(source, values) {
  for (const [name, value] of Object.entries(values)) {
    if (!/^--[\w-]+$/.test(name) || !isSafeValue(value))
      throw new Error(`Refusing to write ${name}`);
    const match = new RegExp(`(?<![\\w-])${name}:\\s*[^;{}]+;`).exec(
      region(source),
    );
    if (!match) {
      // A new palette color goes after the last one; nothing else is new.
      const last = [
        ...region(source).matchAll(/\n(\s*)--color-[\w-]+:[^;]*;/g),
      ].at(-1);
      if (!name.startsWith("--color-") || !last)
        throw new Error(`No token named ${name}`);
      const at = (last.index ?? 0) + last[0].length;
      source = `${source.slice(0, at)}\n${last[1]}${name}: ${value};${source.slice(at)}`;
      continue;
    }
    source =
      source.slice(0, match.index) +
      `${name}: ${value};` +
      source.slice(match.index + match[0].length);
  }
  return source;
}
