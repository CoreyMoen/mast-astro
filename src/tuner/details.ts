/**
 * The Details phase of the tuner: which tokens get a visual control.
 *
 * Unlike dials, these controls edit tokens.css directly. Save rewrites
 * each changed `--token: value;` line in its editable top half. Keep
 * this list to the essentials — anything richer (gradients, shadows,
 * animated states, new webfonts, new variants) is quicker for a person
 * or an agent to write in the CSS itself, and each group's `beyond`
 * line says so in the panel.
 *
 * Adding a control: append it to a group. `token` must be a custom
 * property defined in the top half of tokens.css.
 */

/** Theme roles offered wherever a control picks a color by reference. */
export const THEME_REFS = [
  "--theme-accent",
  "--theme-accent-dark",
  "--theme-text",
  "--theme-background",
  "--theme-border",
] as const;

export type DetailControl =
  /** Every --color-* swatch in the raw palette, editable, plus "Add". */
  | { type: "palette"; label: string }
  /** `var(--x)`: a palette color, or a theme role if `theme`. */
  | { type: "ref"; token: string; label: string; theme?: boolean }
  /**
   * One palette color for light mode and one for dark:
   * `light-dark(var(--a), var(--b))`, or `var(--a)` when they match.
   */
  | { type: "pair"; token: string; label: string }
  /** A font stack. */
  | { type: "font"; token: string; label: string }
  /** A length with a unit; several tokens move together if listed. */
  | {
      type: "length";
      token: string | string[];
      label: string;
      unit: "px" | "rem" | "em";
      min: number;
      max: number;
      step: number;
    }
  /** A unitless number, e.g. a font weight. */
  | {
      type: "number";
      token: string | string[];
      label: string;
      min: number;
      max: number;
      step: number;
    }
  /**
   * A radius that either follows the Softness dial
   * (`calc(<full> * var(--dial-softness))`) or is fixed.
   */
  | { type: "radius"; token: string; label: string; full: string }
  /** A choice dial from src/dials.ts that belongs to this phase. */
  | { type: "dial"; name: string };

export interface DetailGroup {
  group: string;
  controls: DetailControl[];
  /** What to do for anything past these controls. */
  beyond: string;
}

/** Font stacks offered in the font menus. Any stack can be typed in. */
export const FONT_STACKS = [
  { label: "General Sans", value: '"General Sans", Arial, sans-serif' },
  { label: "System sans", value: "system-ui, sans-serif" },
  {
    label: "Helvetica",
    value: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  { label: "Georgia", value: 'Georgia, "Times New Roman", serif' },
  { label: "System serif", value: "ui-serif, Georgia, serif" },
  { label: "Monospace", value: "ui-monospace, Menlo, Consolas, monospace" },
];

export const details: DetailGroup[] = [
  {
    group: "Palette",
    controls: [{ type: "palette", label: "Palette" }],
    beyond:
      "Gradients, tints, or a color that only some sections use are better as tokens your agent adds to tokens.css.",
  },
  {
    group: "Theme colors",
    controls: [
      { type: "pair", token: "--theme-background", label: "Background" },
      { type: "pair", token: "--theme-text", label: "Text" },
      { type: "pair", token: "--theme-border", label: "Border" },
      { type: "pair", token: "--theme-accent", label: "Accent" },
      { type: "pair", token: "--theme-accent-dark", label: "Accent, darker" },
    ],
    beyond:
      "Components color themselves from these roles, so a palette change shows up everywhere. A new role (a success color, a second accent) is a token for your agent to add.",
  },
  {
    group: "Typography",
    controls: [
      { type: "font", token: "--font-heading", label: "Heading font" },
      { type: "font", token: "--font-body", label: "Body font" },
      {
        type: "number",
        token: [
          "--h1-weight",
          "--h2-weight",
          "--h3-weight",
          "--h4-weight",
          "--h5-weight",
          "--h6-weight",
        ],
        label: "Heading weight",
        min: 300,
        max: 800,
        step: 100,
      },
      {
        type: "number",
        token: "--paragraph-weight",
        label: "Body weight",
        min: 300,
        max: 700,
        step: 100,
      },
    ],
    beyond:
      "Sizes and levels live in Expression. A new webfont, or weights the font files don't include yet, means adding the files: ask your agent.",
  },
  {
    group: "Buttons",
    controls: [
      {
        type: "radius",
        token: "--button-border-radius",
        label: "Radius",
        full: "1.25rem",
      },
      {
        type: "length",
        token: "--button-padding-vertical",
        label: "Padding, vertical",
        unit: "em",
        min: 0.3,
        max: 1.5,
        step: 0.05,
      },
      {
        type: "length",
        token: "--button-padding-horizontal",
        label: "Padding, horizontal",
        unit: "em",
        min: 0.5,
        max: 3,
        step: 0.1,
      },
      {
        type: "number",
        token: "--button-weight",
        label: "Weight",
        min: 300,
        max: 700,
        step: 100,
      },
      { type: "ref", token: "--button-bg", label: "Fill", theme: true },
      { type: "ref", token: "--button-text", label: "Label", theme: true },
      {
        type: "ref",
        token: "--button-bg-hover",
        label: "Fill on hover",
        theme: true,
      },
      {
        type: "ref",
        token: "--button-secondary-border",
        label: "Secondary outline",
        theme: true,
      },
    ],
    beyond:
      "Shadows, gradients, icon animations, or a new variant (cc-ghost, cc-large…) are better written in components.css. Ask your agent.",
  },
  {
    group: "Focus",
    controls: [
      { type: "ref", token: "--focus-color", label: "Color", theme: true },
      {
        type: "length",
        token: "--focus-width",
        label: "Width",
        unit: "px",
        min: 1,
        max: 4,
        step: 1,
      },
      {
        type: "length",
        token: "--focus-offset",
        label: "Offset",
        unit: "px",
        min: 0,
        max: 6,
        step: 1,
      },
    ],
    beyond:
      "The ring is shared by every focusable component. Per-component focus styles belong in components.css.",
  },
  {
    group: "Inputs",
    controls: [
      {
        type: "radius",
        token: "--input-border-radius",
        label: "Radius",
        full: "1.25rem",
      },
      {
        type: "ref",
        token: "--input-border-color",
        label: "Border",
        theme: true,
      },
      {
        type: "ref",
        token: "--input-border-focus",
        label: "Border on focus",
        theme: true,
      },
      {
        type: "number",
        token: "--input-label-weight",
        label: "Label weight",
        min: 300,
        max: 700,
        step: 100,
      },
    ],
    beyond:
      "Floating-label behavior, validation states, and custom selects are component work. Ask your agent.",
  },
  {
    group: "Cards",
    controls: [
      {
        type: "radius",
        token: "--card-border-radius",
        label: "Radius",
        full: "1.25rem",
      },
    ],
    beyond: "Card padding follows Density in Expression.",
  },
  {
    group: "Icons",
    controls: [{ type: "dial", name: "iconWeight" }],
    beyond:
      "Icons are Phosphor, inlined at build time. A custom icon set is a change to Icon.astro: ask your agent.",
  },
];
