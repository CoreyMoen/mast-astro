/**
 * Mast dials — the expression layer.
 *
 * tokens.css holds the theme's *values*. Dials hold its *intent*: a few
 * named, bounded inputs that tokens and layouts derive from, each with
 * words for what its ends mean. Turn them in the /tuner canvas (`npm run
 * dev`), or set them here directly; the tuner saves back to this file.
 *
 * Two kinds:
 *  - token:  a number, emitted as `--dial-<name>` on :root (see
 *            BaseHead). Tokens in tokens.css derive from it with calc(),
 *            so it previews instantly.
 *  - choice: one of a few authored stops, read at render time with
 *            `getChoices()`. Section recipes (components/recipes/) use
 *            the layout ones to pick their Row/Col props and variants.
 *
 * Each dial belongs to a tuner phase: most are "expression"; a few
 * build-time settings that can't be a CSS token (the icon weight) sit in
 * "details" beside the token controls of src/tuner/details.ts.
 *
 * Adding a dial: add an entry below, then reference `var(--dial-<name>)`
 * in CSS (token) or read `getChoices()` where it applies (choice). The
 * tuner builds its controls from this file, so nothing else needs
 * wiring. The `mast-tune` skill has the full walkthrough.
 *
 * Keep each entry's `value:` on its own line — the tuner rewrites it in
 * place when you save.
 */

import { readFileSync } from "node:fs";

type Phase = "details" | "expression";

export interface TokenDial {
  kind: "token";
  phase?: Phase;
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

export interface ChoiceDial {
  kind: "choice";
  phase?: Phase;
  group: string;
  label: string;
  description: string;
  stops: readonly (string | number)[];
  /** Why you'd pick each stop. */
  rationale: Readonly<Record<string, string>>;
  value: string | number;
}

export type Dial = TokenDial | ChoiceDial;

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
      "How far every type style steps away from body size, headings and paragraph sizes alike. 1 is the authored scale.",
    ends: ["Flat, quiet, documentary", "Dramatic, expressive, poster-like"],
    min: 0.5,
    max: 1.6,
    step: 0.05,
    value: 1,
    affects: ["--h1-size … --h6-size", "--paragraph-xl/lg/sm-size"],
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
    kind: "choice",
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
    kind: "choice",
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
    kind: "choice",
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
    kind: "token",
    group: "Typography",
    label: "Heading levels",
    description:
      "How many heading sizes exist. Levels past the count take the size of the last one (h5 looks like h4).",
    ends: ["Few, decisive, efficient", "Many, nuanced, content-heavy"],
    min: 3,
    max: 6,
    step: 1,
    value: 6,
    affects: ["--h4-size", "--h5-size", "--h6-size"],
  },
  bodyLevels: {
    kind: "token",
    group: "Typography",
    label: "Body sizes",
    description:
      "How many paragraph sizes exist: base and small, then large, then extra large.",
    ends: ["Uniform, plain", "Layered, varied"],
    min: 2,
    max: 4,
    step: 1,
    value: 4,
    affects: ["--paragraph-lg-size", "--paragraph-xl-size"],
  },
  iconWeight: {
    kind: "choice",
    phase: "details",
    group: "Icons",
    label: "Icon weight",
    description: "The Phosphor weight every <Icon> renders in.",
    stops: ["thin", "light", "regular", "bold", "fill", "duotone"],
    rationale: {
      thin: "Delicate; pairs with light type and lots of space.",
      light: "Quiet and refined.",
      regular: "Balanced with most body text.",
      bold: "Sturdy; pairs with heavier type.",
      fill: "Solid shapes; reads as UI, playful at large sizes.",
      duotone: "Two-tone depth; illustrative.",
    },
    value: "regular",
  },
});

export type DialName = keyof typeof dials;

type ChoiceNames = {
  [K in DialName]: (typeof dials)[K]["kind"] extends "choice" ? K : never;
}[DialName];

/** Current choice dial values, typed to their stops. */
export type Choices = {
  [K in ChoiceNames]: (typeof dials)[K] extends { stops: readonly (infer S)[] }
    ? S
    : never;
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
 * Where the tuner keeps unsaved choice positions while you preview them
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
 * Current choice dial values, read at render time. In dev, unsaved
 * positions from the tuner take precedence; a production build always
 * uses the saved values above.
 */
export function getChoices(): Choices {
  const preview = readPreview();
  const choices: Record<string, string | number> = {};
  for (const [name, d] of Object.entries(dials)) {
    if (d.kind !== "choice") continue;
    const match = d.stops.find((s) => String(s) === String(preview[name]));
    choices[name] = match ?? d.value;
  }
  return choices as Choices;
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
      bodyLevels: 4,
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
      bodyLevels: 3,
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
      bodyLevels: 3,
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
      bodyLevels: 4,
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
      bodyLevels: 2,
    },
  },
};
