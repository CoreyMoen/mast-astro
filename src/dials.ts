/**
 * Mast dials — the expression layer.
 *
 * tokens.css holds the theme's *values*. Dials hold its *intent*: a few
 * named, bounded inputs that tokens and layouts derive from, each with
 * words for what its ends mean. Turn them in the /tuner canvas (`npm run
 * dev`), or set them here directly; the tuner saves back to this file.
 *
 * Two kinds:
 *  - token:  a continuous number, emitted as `--dial-<name>` on :root
 *            (see BaseHead). Tokens in tokens.css derive from it with
 *            calc(), so it previews instantly.
 *  - layout: one of a few authored stops. Section recipes
 *            (components/recipes/) read it at build time to choose their
 *            Row/Col props and variants.
 *
 * Adding a dial: add an entry below, then reference `var(--dial-<name>)`
 * in CSS (token) or read `getLayout()` in a recipe (layout). The tuner
 * builds its controls from this file, so nothing else needs wiring. The
 * `mast-tune` skill has the full walkthrough.
 *
 * Keep each entry's `value:` on its own line — the tuner rewrites it in
 * place when you save.
 */

import { readFileSync } from "node:fs";

export interface TokenDial {
  kind: "token";
  group: string;
  label: string;
  /** What the dial controls, in one line. */
  description: string;
  /** What the low and high ends mean as expression, for people and agents. */
  ends: readonly [string, string];
  min: number;
  max: number;
  step: number;
  value: number;
  /** Tokens derived from this dial (documentation; see tokens.css). */
  affects: readonly string[];
}

export interface LayoutDial {
  kind: "layout";
  group: string;
  label: string;
  description: string;
  stops: readonly (string | number)[];
  /** Why you'd pick each stop. */
  rationale: Readonly<Record<string, string>>;
  value: string | number;
}

export type Dial = TokenDial | LayoutDial;

function defineDials<const T extends Record<string, Dial>>(dials: T): T {
  return dials;
}

export const dials = defineDials({
  softness: {
    kind: "token",
    group: "Expression",
    label: "Softness",
    description: "Corner radius of buttons, cards, inputs, and media.",
    ends: ["Sharp, serious, precise", "Rounded, friendly, approachable"],
    min: 0,
    max: 1,
    step: 0.05,
    value: 0.4,
    affects: [
      "--button-border-radius",
      "--card-border-radius",
      "--input-border-radius",
    ],
  },
  density: {
    kind: "token",
    group: "Expression",
    label: "Density",
    description: "Section padding, grid gaps, and card padding together.",
    ends: ["Condensed, efficient, busy", "Airy, calm, deliberate"],
    min: 0.5,
    max: 1.75,
    step: 0.05,
    value: 1,
    affects: ["--section-padding-min/max", "--grid-gap-*", "--card-padding-*"],
  },
  typeContrast: {
    kind: "token",
    group: "Typography",
    label: "Type contrast",
    description:
      "How far headings step up from body copy. 1 is the authored scale.",
    ends: ["Flat, quiet, documentary", "Dramatic, expressive, poster-like"],
    min: 0.5,
    max: 1.6,
    step: 0.05,
    value: 1,
    affects: ["--h1-size … --h6-size"],
  },
  typeScale: {
    kind: "token",
    group: "Typography",
    label: "Type size",
    description: "Scales every type style, body included.",
    ends: ["Small, dense, technical", "Large, open, generous"],
    min: 0.85,
    max: 1.25,
    step: 0.01,
    value: 1,
    affects: ["every --*-size"],
  },
  alignment: {
    kind: "layout",
    group: "Layout",
    label: "Alignment",
    description: "Whether sections lean on a left edge or a center axis.",
    stops: ["left", "mixed", "center"],
    rationale: {
      left: "A strong left edge reads editorial, confident, and scannable.",
      mixed: "Centered intros and calls to action, left-aligned body content.",
      center: "Symmetry reads calm and ceremonial; best with short copy.",
    },
    value: "mixed",
  },
  composition: {
    kind: "layout",
    group: "Layout",
    label: "Composition",
    description:
      "How conventional the arrangement of the same rows and columns is.",
    stops: ["standard", "offset", "editorial"],
    rationale: {
      standard: "Predictable, even splits. Product and utility brands.",
      offset: "Asymmetric spans and offsets add rhythm without losing clarity.",
      editorial:
        "Anchored corners, oversized type, and white space as a statement.",
    },
    value: "standard",
  },
  whitespace: {
    kind: "layout",
    group: "Layout",
    label: "Whitespace",
    description:
      "How much room content is given: text measure, spacers, and offsets.",
    stops: ["condensed", "balanced", "generous"],
    rationale: {
      condensed: "Wide measures, tight gaps. Information first.",
      balanced: "Comfortable measures and the default rhythm.",
      generous: "Narrow measures and extra space. Every element is placed.",
    },
    value: "balanced",
  },
  headingLevels: {
    kind: "layout",
    group: "Typography",
    label: "Heading levels",
    description:
      "How many heading sizes the system uses. Deeper levels reuse the smallest.",
    stops: [4, 5, 6],
    rationale: {
      4: "Fewer options, cleaner hierarchy, faster decisions.",
      5: "One extra level for subheads.",
      6: "The full range for content-heavy brands.",
    },
    value: 6,
  },
});

export type DialName = keyof typeof dials;

type LayoutNames = {
  [K in DialName]: (typeof dials)[K]["kind"] extends "layout" ? K : never;
}[DialName];

/** Current layout dial values, typed to their stops. */
export type Layout = {
  [K in LayoutNames]: (typeof dials)[K]["stops"][number];
};

/** `typeContrast` → `--dial-type-contrast`. */
export function dialVar(name: string): string {
  return `--dial-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}

/** The token dials as a :root declaration block (emitted by BaseHead). */
export function tokenDialCss(): string {
  const decls = Object.entries(dials)
    .filter(([, d]) => d.kind === "token")
    .map(([name, d]) => `${dialVar(name)}:${d.value};`)
    .join("");
  return `@layer tokens{:root{${decls}}}`;
}

/**
 * Where the tuner keeps unsaved layout positions while you preview them
 * in dev. Gitignored, and ignored entirely by production builds.
 */
export const PREVIEW_FILE = ".astro/dials-preview.json";

function readPreview(): Record<string, unknown> {
  if (!import.meta.env.DEV) return {};
  try {
    return JSON.parse(readFileSync(PREVIEW_FILE, "utf8"));
  } catch {
    return {};
  }
}

/**
 * Current layout dial values, for recipes to read at render time. In
 * dev, unsaved positions from the tuner take precedence; a production
 * build always uses the saved values above.
 */
export function getLayout(): Layout {
  const preview = readPreview();
  const layout: Record<string, string | number> = {};
  for (const [name, d] of Object.entries(dials)) {
    if (d.kind !== "layout") continue;
    const match = d.stops.find((s) => String(s) === String(preview[name]));
    layout[name] = match ?? d.value;
  }
  return layout as Layout;
}

/**
 * The heading class for a semantic level under the `headingLevels` dial:
 * levels deeper than the system allows take the smallest size it has.
 * The tag stays semantic; only the size class is clamped.
 */
export function headingClass(level: number, layout: Layout): string {
  return `h${Math.min(level, Number(layout.headingLevels))}`;
}

/** Named starting points. Applying one sets every dial it lists. */
export const presets: Record<
  string,
  { description: string; values: Partial<Record<DialName, string | number>> }
> = {
  mast: {
    description: "The framework defaults.",
    values: {
      softness: 0.4,
      density: 1,
      typeContrast: 1,
      typeScale: 1,
      alignment: "mixed",
      composition: "standard",
      whitespace: "balanced",
      headingLevels: 6,
    },
  },
  swiss: {
    description: "Sharp, left-aligned, strong type contrast, few levels.",
    values: {
      softness: 0,
      density: 1.1,
      typeContrast: 1.35,
      typeScale: 1,
      alignment: "left",
      composition: "offset",
      whitespace: "generous",
      headingLevels: 4,
    },
  },
  friendly: {
    description: "Soft, centered, compact, and approachable.",
    values: {
      softness: 1,
      density: 0.85,
      typeContrast: 0.8,
      typeScale: 1.05,
      alignment: "center",
      composition: "standard",
      whitespace: "balanced",
      headingLevels: 5,
    },
  },
  editorial: {
    description: "Big type, anchored corners, and lots of room.",
    values: {
      softness: 0.1,
      density: 1.4,
      typeContrast: 1.5,
      typeScale: 1,
      alignment: "left",
      composition: "editorial",
      whitespace: "generous",
      headingLevels: 6,
    },
  },
  dense: {
    description: "Information-first: tight spacing and a flat scale.",
    values: {
      softness: 0.25,
      density: 0.6,
      typeContrast: 0.7,
      typeScale: 0.92,
      alignment: "left",
      composition: "standard",
      whitespace: "condensed",
      headingLevels: 4,
    },
  },
};
