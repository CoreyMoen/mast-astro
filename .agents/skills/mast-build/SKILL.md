---
name: mast-build
description: Build and extend pages, sections, components, and styles in this Mast for Astro project the way Mast intends. Use this whenever you are writing markup or CSS here — adding a page or section, styling anything, choosing between a utility class and a custom class, naming a new class, adding a token or color, changing type or spacing, adding a breakpoint rule, writing a component script, or adding an animation. Trigger even when the request sounds like plain web work ("build a hero section", "make this two columns on desktop", "add a dark variant", "why is there a gap under this heading") — in a Mast project several of those decisions go against ordinary web instincts, and guessing produces markup that renders fine but drifts out of the system.
---

# Building with Mast

Full documentation lives in `docs/` — read the relevant file when you need
depth:

- **`docs/building-with-mast.md`** — the mindset, the four class types,
  naming, and extension patterns. Read this before any substantial styling
  work.
- **`docs/class-reference.md`** — every grid, layout, and utility class that
  exists. Read it before inventing a class name; what you want usually
  already exists.
- **`docs/theming.md`** — tokens, fluid pairs, `light-dark()`.

What follows is only the handful of rules where **Mast disagrees with
ordinary web practice**. These are the ones worth holding in mind up front,
because doing the normal thing here produces something that works but is
wrong for this codebase.

## Six places Mast diverges

**1. Don't create a component for styled text.** Headings, rich text, and
eyebrows are plain HTML with classes — `<h2 class="h1">`,
`<div class="rich-text">`, `<div class="eyebrow cc-rule">`. The absence of a
`Heading` or `RichText` component is deliberate, not an oversight: a
component emitting one styled tag is a layer with no payload. If asked for
one, say so and show the class instead. Components are for real markup or
real behavior.

**2. Never branch on a theme class in CSS.** No `[data-theme="dark"] .card`,
no `.dark &`. A color that differs between modes is a **token** using
`light-dark()`. Class branching means every new component needs its own
override and they drift; tokens make a new mode work everywhere at once. To
force a scheme on a subtree, use `u-mode-light` / `u-mode-dark` rather than
hardcoding values.

**3. Past ~4 utilities, write a custom class.** And never mix a custom class
with utilities for the same concern — if an element has its own class and
needs `margin-bottom: 0`, that declaration belongs *in the class*. A utility
should mean one thing everywhere; an element with its own class owns its own
styles.

**4. Heading level is semantics; size is a class.** `<h3 class="h2">` is the
correct answer when the outline needs an h3 and the design wants h2's size.
Never pick a heading level because of how big it looks.

**5. Expect defaults, don't fight them.** Headings already have a bottom
margin (in `em`, so it scales — remove it with `u-mb-0`, don't zero it in a
new rule). Columns already have a gap; adjust it with `row-gap-*` or row
justification. Over-spacing is nearly always solved by an existing modifier.

**6. Utilities are the last cascade layer, so they already win.** If you're
reaching for `!important`, the rule is in the wrong layer. Layer order is
`tokens → base → layout → typography → components → styleguide → utilities`.

## Two mechanical details worth knowing

**Breakpoints are rem, and widths cascade upward.** Use `61.9375rem` /
`47.9375rem` / `29.9375rem` exactly — a px equivalent opts out of tracking
the visitor's font size. Set only the breakpoints that differ; `col-sm-6
col-lg-4` is a complete definition.

**Scripts ride components.** A behavioral component carries its own
`<script>` import and Astro dedupes it per page. A page that hand-rolls the
markup instead of using the component gets no behavior — which is why
`TabPane` imports `tabs.ts` even though `Tabs` does too.

## Finishing

- `npm run check` — 0 errors.
- `npm run build` — bad image refs and frontmatter fail here.
- `npm run format` — Prettier is enforced in CI.
- Look at the result in **both color modes** and at **390px**. Mast is fluid
  and themed; a change verified only in light mode at desktop isn't verified.
  `playwright-core` is in devDependencies for driving the preview server —
  and if no browser binary is available in your environment, say so and fall
  back to checking the built HTML and CSS in `dist/` rather than skipping
  verification silently.
