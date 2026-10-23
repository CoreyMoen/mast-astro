# Dials and the tuner

The tuner (`/tuner`, dev only) works in three phases:

1. **Details**: the design system's essentials (colors, fonts, buttons,
   inputs, focus, icons), edited visually and saved to `tokens.css`.
2. **Expression**: the dials described below, saved to `src/dials.ts`.
3. **Training**: an agent generates pages from the recipes, you comment
   on their sections, and the comments are distilled into the
   `mast-design` skill that every agent reads before building a page.

In every phase the panel covers only the quick, visual choices. Anything
richer (a new webfont, gradients, motion, a new variant, a new dial) is
code, written by you or your agent, and the panel says so.

`tokens.css` holds the theme's **values**. Dials hold its **intent**: a
handful of named, bounded inputs that tokens and layouts derive from, each
with words for what its ends mean. They exist to land an overall
_expression_ (soft or serious, airy or condensed, conventional or
editorial) quickly, by turning knobs instead of editing forty values.

- [The two kinds of dial](#the-two-kinds-of-dial)
- [The registry](#the-registry-srcdialsts)
- [Recipes](#recipes)
- [The tuner](#the-tuner)
- [Details](#details)
- [Training](#training)
- [Adding a dial](#adding-a-dial)
- [Dial or token?](#dial-or-token)

## The two kinds of dial

Tokens interpolate; arrangements don't. So there are two kinds:

| Kind       | What it is                                                                                    | How it previews                         |
| ---------- | --------------------------------------------------------------------------------------------- | --------------------------------------- |
| **token**  | A unitless number emitted as `--dial-<name>` on `:root`. Tokens derive from it with `calc()`. | Instantly: only a custom property moves |
| **choice** | One of a few authored stops, read at render time with `getChoices()`.                         | Re-renders the page                     |

The built-in dials:

| Dial            | Kind   | Drives                                                                               |
| --------------- | ------ | ------------------------------------------------------------------------------------ |
| `softness`      | token  | Button, card, input, and media radii (unless a radius is fixed in Details)           |
| `density`       | token  | Section padding, grid gaps, card padding                                             |
| `typeContrast`  | token  | How far every type style steps from body size: h1–h6 and paragraph xl/lg/sm          |
| `typeScale`     | token  | Every type size, body included                                                       |
| `headingLevels` | token  | 3–6 heading sizes; levels past the count take the size of the last one               |
| `bodyLevels`    | token  | 2–4 paragraph sizes: base and sm, then lg, then xl; a level switched off takes base  |
| `alignment`     | choice | `left` / `mixed` / `center`: which content leans on a center axis                    |
| `composition`   | choice | `standard` / `offset` / `editorial`: how conventional the arrangement is             |
| `whitespace`    | choice | `condensed` / `balanced` / `generous`: text measure, spacers, gaps                   |
| `iconWeight`    | choice | The Phosphor weight every `<Icon>` renders in (shown in Details: `phase: "details"`) |

Heading and body levels are separate dials because they answer different
questions: how many steps of hierarchy the headings have, and how many
voices the running text has. Both are token dials: the generated section
of `tokens.css` multiplies each optional level's step by a 0/1 factor
(`clamp(0, levels - n, 1)`), so a level that's switched off collapses
onto its neighbor with no markup change.

### How token dials reach the CSS

`BaseHead` writes the token dials into the `tokens` layer:

```css
@layer tokens {
  :root {
    --dial-softness: 0.4;
    --dial-density: 1;
    /* … */
  }
}
```

`tokens.css` uses them visibly, right where each token is defined:

```css
--button-border-radius: calc(1.25rem * var(--dial-softness));
--grid-gap-main: calc(2.5rem * var(--dial-density));
```

Fluid min/max pairs stay plain numbers (they're still the thing you edit).
Their dials are applied in the generated section at the bottom of
`tokens.css`, which turns each pair into a `-lo`/`-hi` pair before the
`clamp()`:

```
type:      (body + (size - body) × typeContrast) × typeScale
           (headings and paragraph xl/lg/sm; body size is the anchor)
padding:   size × density
```

At their default positions every dial reproduces the authored values
exactly, so a project that never touches a dial renders the same as one
without them.

**Detaching** a token from its dial is replacing the `calc()` with a
literal. That's the escape hatch for "the cards should be 2px regardless".

## The registry: `src/dials.ts`

Every dial is declared once, with its range or stops, a description, and
the language for its ends. That language is the point: it's what lets a
person or an agent map a brief ("serious, editorial, lots of air") onto
positions.

```ts
softness: {
  kind: "token",
  group: "Expression",
  label: "Softness",
  description: "Corner radius of buttons, cards, inputs, and media.",
  ends: ["Sharp, serious, precise", "Rounded, friendly, approachable"],
  min: 0, max: 1, step: 0.05,
  value: 0.4,
  affects: ["--button-border-radius", "--card-border-radius", "--input-border-radius"],
},
```

The file also holds `presets` (named combinations to start from) and
`getChoices()`, which returns the current choice values. Each dial has an
optional `phase` (`"details"` or `"expression"`, the default) that says
which tuner phase shows it.

Keep each entry's `value:` on its own line; the tuner rewrites that line
when it saves.

## Recipes

`src/components/recipes/` holds the sections the example pages are made
from: `Hero`, `PageHeader`, `Features`, `Split`, `Statement`, `Team`,
`Contact`, `Faq`, `Cta`, plus the shared `Intro` and `Actions` parts.

Each recipe is ordinary Section/Row/Col markup with **two or three
authored stops** for `composition`, chosen by reading `getChoices()`. The
stops are where the range of the row/column primitives shows: the same
pieces produce an even split, an offset split anchored at the foot, or an
oversized headline with copy pinned to the far corner (`u-mt-auto`,
spacers, `justify="between"`, `align="end"`).

Every recipe also takes a `choices` prop that overrides the dials for
that one section (`<Features choices={{ composition: "offset" }} …>`),
and marks its `<Section>` with `data-recipe` and `data-variant` so
training comments can name what they're about.

`rhythm.ts` holds the translations every recipe shares, so a dial means
the same thing everywhere:

- `isCentered(layout, role)`: `mixed` centers intros and calls to action,
  never body copy.
- `measure(layout)`: the text column span (10 / 8 / 6).
- `breath(layout)`: the spacer between a header and its body.
- `gap(layout)`: the column gap.

The example pages (`/examples/home`, `/examples/about`,
`/examples/contact`) are composed only of recipes, which is what lets the
dials reshape them. On a real project they're a starting point: keep the
recipes that fit, and freeze or delete them as pages become bespoke.

## The tuner

`npm run dev`, then open **`/tuner`**. It's injected by
`src/tuner/integration.mjs` in dev only; nothing ships in a build.

- Each phase has its own canvas of full-length desktop frames (and 390px
  frames). Scroll to pan, ⌘/Ctrl-scroll to zoom, drag the background or
  hold Space to pan over a frame, `0` to fit.
- The panel is generated from `src/dials.ts` and `src/tuner/details.ts`,
  and it's built from Mast's own classes and tokens, so it takes on the
  system as you tune.
- Token controls and token dials move instantly. Choice dials post their
  positions to `/__mast/dials/preview` (an untracked
  `.astro/dials-preview.json` that `getChoices()` reads in dev) and
  reload the frames.
- **Save** rewrites the changed token lines in `tokens.css` and the
  `value:` lines in `src/dials.ts`. **Copy** puts the current positions,
  with what they mean, on the clipboard for your agent.
- The pages on each canvas are listed in `phases` at the top of
  `src/tuner/Tuner.astro`.

## Details

The Details phase shows `/tuner/specimen` (palette, type ladder, buttons
in their hover and focus states, inputs, icons, cards) next to the home
page. Its controls are listed in `src/tuner/details.ts`, a short list on
purpose: palette colors, theme roles, heading and body fonts and weights,
button radius, padding, and colors (fill, label, hover, secondary
outline), the focus ring, input borders, card radius, and icon weight.

Each control edits one or more tokens in the top half of `tokens.css`,
which gained a few for the purpose: `--font-heading`, `--font-body`,
`--button-bg`, `--button-text`, `--button-bg-hover`,
`--button-secondary-border`, `--input-border-color`,
`--input-border-focus`, and `--focus-color` / `--focus-width` /
`--focus-offset`. A radius can follow the Softness dial or be fixed.

To add a control, append it to a group in `details.ts`. Each group ends
with a `beyond` line: what to ask an agent for instead of adding a
control (shadows, gradients, a new variant, a new webfont).

## Training

Training teaches agents the project's layout taste, so anyone can ask for
a page and get one that fits the system. It's a loop, run with the
`mast-train` skill:

1. **Generate.** An agent writes a batch of pages in
   `src/training/pages/` (`batch-01-product.astro`, …), built only from
   recipes, `choices` overrides, and bespoke Section/Row/Col sections.
   They're injected at `/training/<name>` in dev and never built.
2. **Review.** In the Training phase, turn on commenting and click a
   section: mark it keep, refine, or avoid, with a note. Comments land in
   `src/training/feedback.json` with the page, section index, recipe,
   variant, and heading.
3. **Distill.** An agent folds the comments into
   `.agents/skills/mast-design/SKILL.md` as general rules with reasons,
   then moves those comments to the file's `distilled` list, so the
   panel starts the next round empty.

`mast-design` is what agents read before building any page. It ships with
default principles, and training replaces them with yours.

## Adding a dial

A project often grows a system Mast doesn't ship with, like motion or
illustration, and wants a knob for it. Adding one takes three steps:

1. **Declare it** in `src/dials.ts`, in the group it belongs to:

   ```ts
   motion: {
     kind: "token",
     group: "Motion",
     label: "Motion",
     description: "Distance and duration of scroll-in animation.",
     ends: ["Still, composed", "Lively, kinetic"],
     min: 0, max: 1, step: 0.05,
     value: 0.5,
     affects: ["--stagger-distance", "--stagger-duration"],
   },
   ```

2. **Use it.** A token dial: derive tokens from `var(--dial-motion)` in
   `tokens.css`, defined where the token lives, e.g.
   `--stagger-distance: calc(2rem * var(--dial-motion));`. A choice dial:
   read `getChoices().yourDial` in the recipes it affects.
3. **Check it in the tuner.** The control appears on its own. Confirm the
   default position renders exactly what you had before.

Write `ends` (or `rationale`, for a choice dial) as expression, not
mechanics: "Lively, kinetic" tells a person or agent when to turn it up;
"2rem" doesn't.

## Dial or token?

- **Use a dial** for intent that touches several tokens or several
  sections at once, and that someone will want to adjust by feel.
- **Edit the token** for one specific value: a brand color, a font, a
  single radius. Most theming is still this.
- **Don't add a dial** for a single token. A dial with one `affects`
  entry is a layer with no payload, which is the same reason Mast has no
  `Heading` component.
