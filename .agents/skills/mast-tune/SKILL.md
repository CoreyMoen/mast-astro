---
name: mast-tune
description: Tune the overall look and feel of a Mast for Astro project with its dials — softness, density, type contrast and size, heading and body levels, alignment, composition, whitespace — and add new dials. Use this whenever the request is about a site's overall expression rather than one value ("make it feel more editorial", "softer and friendlier", "too cramped", "more like a Swiss poster", "fewer heading sizes", "center everything"), whenever someone pastes dial positions copied from the /tuner, and whenever someone wants a new adjustable knob (motion, illustration, any project-specific system). Trigger even when the request names specific tokens, if what they describe is a feel that spans several of them.
---

# Tuning Mast with dials

Read **`docs/dials.md`** for the full model. The short version:

- **`src/dials.ts`** is the registry: each dial's range or stops, its
  current `value`, and the words for what its ends mean (`ends` for token
  dials, `rationale` for choice dials).
- **Token dials** (`softness`, `density`, `typeContrast`, `typeScale`,
  `headingLevels`, `bodyLevels`) are `--dial-*` custom properties that
  tokens in `tokens.css` derive from.
- **Choice dials** (`alignment`, `composition`, `whitespace`, and
  `iconWeight`) are read at render time through `getChoices()`, mostly by
  the section recipes in `src/components/recipes/`.
- **`/tuner`** (dev only) shows the example pages reacting live in its
  Expression phase and saves back to `src/dials.ts`. Its Details phase
  edits single tokens (colors, fonts, buttons) in `tokens.css`; its
  Training phase belongs to the `mast-train` skill.

## Turning a brief into positions

1. Read every dial's `ends` / `rationale` in `src/dials.ts`. They are the
   vocabulary; match the brief's adjectives against them.
2. Move the fewest dials that capture the brief. Start from the nearest
   preset in `presets` if one is close.
3. Set the `value:` lines in `src/dials.ts` directly (one value per line,
   which keeps the tuner's save working).
4. Say what you set and why, in the brief's own words: "softness 0.1
   because you said serious; composition editorial for the asymmetric,
   poster-like layouts."
5. Point them at `/tuner` to refine by eye, and remind them that **Copy**
   there hands the positions back to you.

When someone pastes copied positions, apply them as given. They came from
the tuner, so they're already in range.

## Dial or token?

A **dial** is for a feel that spans several tokens or sections. A **token**
is for one value: a brand color, a font, a specific radius. Most direct
theming ("use Inter", "make the accent green") is a token edit in
`tokens.css`, not a dial. To pin one token while leaving its dial in place
for everything else, replace that token's `calc()` with a literal.

Don't invent a dial for a single token. A dial with one `affects` entry is
an extra layer with no payload.

## Adding a dial

Follow "Adding a dial" in `docs/dials.md`:

1. Declare it in `src/dials.ts` with `ends` or `rationale` written as
   expression ("Lively, kinetic"), not mechanics ("2rem").
2. Wire it: `var(--dial-<name>)` in `tokens.css` where each affected token
   is defined (token dial), or `getChoices().<name>` in the recipes it
   changes (choice dial). Put shared layout translations in
   `src/components/recipes/rhythm.ts` so the dial means the same thing in
   every recipe.
3. Choose the default so it reproduces the current design exactly, then
   confirm in `/tuner` that the control appears and behaves.

## Rules that still apply

The `mast-build` rules hold inside recipes too: structure through
`Section`/`Row`/`Col`, text as plain HTML with classes, heading level for
semantics and a size class (`h3`) for size, and no theme-class branching.
Finish with `npm run check`, `npm run build`, and `npm run format`.
