# Dials and the tuner

`tokens.css` holds the theme's **values**. Dials hold its **intent**: a
handful of named, bounded inputs that tokens and layouts derive from, each
with words for what its ends mean. They exist to land an overall
_expression_ (soft or serious, airy or condensed, conventional or
editorial) quickly, by turning knobs instead of editing forty values.

- [The two kinds of dial](#the-two-kinds-of-dial)
- [The registry](#the-registry-srcdialsts)
- [Recipes](#recipes)
- [The tuner](#the-tuner)
- [Adding a dial](#adding-a-dial)
- [Dial or token?](#dial-or-token)

## The two kinds of dial

Tokens interpolate; layouts don't. So there are two kinds:

| Kind       | What it is                                                                                    | How it previews                         |
| ---------- | --------------------------------------------------------------------------------------------- | --------------------------------------- |
| **token**  | A unitless number emitted as `--dial-<name>` on `:root`. Tokens derive from it with `calc()`. | Instantly: only a custom property moves |
| **layout** | One of a few authored stops. Section recipes read it at render time to pick Row/Col props.    | Re-renders the page                     |

The built-in dials:

| Dial            | Kind   | Drives                                                                     |
| --------------- | ------ | -------------------------------------------------------------------------- |
| `softness`      | token  | Button, card, input, and media radii                                       |
| `density`       | token  | Section padding, grid gaps, card padding                                   |
| `typeContrast`  | token  | How far h1–h6 step up from body size (1 = the authored scale)              |
| `typeScale`     | token  | Every type size, body included                                             |
| `alignment`     | layout | `left` / `mixed` / `center`: which content leans on a center axis          |
| `composition`   | layout | `standard` / `offset` / `editorial`: how conventional the arrangement is   |
| `whitespace`    | layout | `condensed` / `balanced` / `generous`: text measure, spacers, gaps         |
| `headingLevels` | layout | `4` / `5` / `6`: deeper headings reuse the smallest size the system allows |

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
headings:  (body + (heading - body) × typeContrast) × typeScale
body text: size × typeScale
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

The file also holds `presets` (named combinations to start from), and the
helpers recipes use: `getLayout()` for the current layout values and
`headingClass(level, layout)` for heading sizes under `headingLevels`.

Keep each entry's `value:` on its own line; the tuner rewrites that line
when it saves.

## Recipes

`src/components/recipes/` holds the sections the example pages are made
from: `Hero`, `PageHeader`, `Features`, `Split`, `Statement`, `Team`,
`Contact`, `Faq`, `Cta`, plus the shared `Intro` and `Actions` parts.

Each recipe is ordinary Section/Row/Col markup with **two or three
authored stops** for `composition`, chosen by reading `getLayout()`. The
stops are where the range of the row/column primitives shows: the same
pieces produce an even split, an offset split anchored at the foot, or an
oversized headline with copy pinned to the far corner (`u-mt-auto`,
spacers, `justify="between"`, `align="end"`).

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

- The example pages render side by side as full-length desktop frames
  (and 390px frames) on a canvas. Scroll to pan, ⌘/Ctrl-scroll to zoom,
  drag the background or hold Space to pan over a frame, `0` to fit.
- The panel is generated from `src/dials.ts`, and it's built from Mast's
  own classes and tokens, so it takes on the expression as you tune.
- Token dials move instantly. Layout dials post their positions to
  `/__mast/dials/preview` (an untracked `.astro/dials-preview.json` that
  `getLayout()` reads in dev) and reload the frames.
- **Save** rewrites the `value:` lines in `src/dials.ts`. **Copy** puts
  the current positions, with what they mean, on the clipboard for your
  agent.
- Add pages to the canvas in the `pages` list at the top of
  `src/tuner/Tuner.astro`.

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
   `--stagger-distance: calc(2rem * var(--dial-motion));`. A layout dial:
   read `getLayout().yourDial` in the recipes it affects.
3. **Check it in the tuner.** The control appears on its own. Confirm the
   default position renders exactly what you had before.

Write `ends` (or `rationale`, for a layout dial) as expression, not
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
