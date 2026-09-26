---
name: mast-build
description: Build and extend pages, sections, components, and styles in this Mast for Astro project the way Mast intends. Use this whenever you are writing markup or CSS here — adding a page or section, styling anything, choosing between a utility class and a custom class, naming a new class, adding a token or color, changing type or spacing, adding a breakpoint rule, writing a component script, or adding an animation. Trigger even when the request sounds like plain web work ("build a hero section", "make this two columns on desktop", "add a dark variant", "why is there a gap under this heading") — in a Mast project several of those decisions go against ordinary web instincts, and guessing produces markup that renders fine but drifts out of the system.
---

# Building with Mast

Full documentation lives in the package's `docs/` — at the repo root when
working in mast-astro itself, or `node_modules/mast-astro/docs/` in a project
that installs the package. Read the relevant file when you need depth:

- **`docs/building-with-mast.md`** — the mindset, the four class types,
  naming, and extension patterns. Read this before any substantial styling
  work.
- **`docs/class-reference.md`** — every grid, layout, and utility class that
  exists. Read it before inventing a class name; what you want usually
  already exists.
- **`docs/theming.md`** — tokens, fluid pairs, `light-dark()`.
- **`docs/getting-started.md`** — installing the package, `theme.css`, where
  a project's own CSS goes.

Components are imported from the package: `import { Section, Row, Col }
from "mast-astro"`. Never edit files inside `node_modules/mast-astro`;
theme changes go in the project's `theme.css`, new styles in the
project's own CSS inside `@layer components { … }`.

What follows is only the handful of rules where **Mast disagrees with
ordinary web practice**. These are the ones worth holding in mind up front,
because doing the normal thing here produces something that works but is
wrong for this codebase.

## Seven places Mast diverges

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

**7. The grid is desktop-first — Bootstrap names, opposite direction.** The
base (`col-N` / `col-lg-N`) is the desktop layout and applies everywhere;
`md` / `sm` / `xs` override **at that breakpoint and below** (`col-md-6` =
half at ≤991px). Bootstrap's `col-12 col-md-6 col-lg-4` becomes
`col-lg-4 col-md-6 col-sm-12` here, or just the smart `col-4`, which already
stacks. Custom CSS is the same: desktop base rule, `max-width` overrides
below it, never `min-width`.

## Two mechanical details worth knowing

**Breakpoints are rem, and widths cascade down.** Use `61.9375rem` /
`47.9375rem` / `29.9375rem` exactly — a px equivalent opts out of tracking
the visitor's font size. A width holds at its breakpoint and every smaller
one until overridden, so set only the breakpoints that change:
`col-lg-4 col-sm-6` is a third on desktop and tablet, half below 767px.
Spans are out of `--grid-columns` (12 by default, site-wide, up to 16).

**Scripts ride components.** A behavioral component carries its own
`<script>` import and Astro dedupes it per page. A page that hand-rolls the
markup instead of using the component gets no behavior — which is why
`TabPane` imports `tabs.ts` even though `Tabs` does too.

## Finishing

- `npx astro check` — 0 errors (`npm run check` in the mast-astro repo).
- `npx astro build` — bad image refs and frontmatter fail here.
- Format with the project's formatter (`npm run format` in the mast-astro
  repo, where Prettier is enforced in CI).
- Look at the result in **both color modes** and at **390px**. Mast is fluid
  and themed; a change verified only in light mode at desktop isn't verified.
  Drive the preview server with Playwright if the project has it
  (`playwright-core` is a devDependency in the mast-astro repo) — and if no
  browser is available in your environment, say so and fall back to checking
  the built HTML and CSS in `dist/` rather than skipping verification
  silently.
