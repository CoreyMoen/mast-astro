# Mast for Astro

Mast is a minimal, component-first CSS framework. This repo is its Astro
edition plus the style-guide site that documents it. Guiding principle:
**as little abstraction as possible** — prefer deleting a layer over
adding one.

## Commands

- `npm run dev` / `build` / `preview`
- `npm run check` — typecheck .astro files (must stay at 0 errors)
- `npm run format` — prettier

## Architecture

- `src/styles/` — the framework CSS in cascade layers
  (tokens → base → layout → typography → components → utilities).
  `tokens.css` is the theme: colors, fonts, and fluid min/max pairs at
  the top are the editable surface; the generated clamp() formulas at the
  bottom are never edited by hand. `styleguide.css` is doc-site chrome,
  imported only by the style-guide pages (never from global.css).
- `src/components/` — typed .astro components. Interactive components
  carry their own `<script>` import (Astro dedupes per page and only
  ships JS for components actually used). `components/styleguide/` is
  doc-site chrome, not framework.
- `src/scripts/` — self-initializing vanilla TS modules. Each exits
  early when its elements aren't on the page. Attribute APIs
  (`data-accordion`, `data-tabs-*`, `data-slider`, `data-video`,
  `data-marquee-*`, `data-theme-toggle`) match the upstream Webflow Mast
  scripts in `nocodesupplyco/mast`.
- `src/content/blog/` — the demo blog as an Astro content collection:
  one Markdown file per post, schema-validated by `src/content.config.ts`
  (this repo's stand-in for Webflow's CMS collections). Image frontmatter
  stores a base name (`post1`); `src/lib/blog.ts` derives srcsets.
  Detail pages render at `/blog/[slug]`.
- `reference/mast-framework.webflow/` — the original Webflow export;
  source of truth for visual parity. Never part of the build.

## Conventions

- **Classes are the styling API; components exist for structure and
  behavior.** Structural components (`Section`, `Row`, `Col`,
  `ContentWrap`, `Spacer`, `Divider`) emit minimal DOM with the Mast
  classes; text is plain HTML (`<h2 class="h1">`, `<div class="rich-text">`,
  `<div class="eyebrow cc-rule">`). There are intentionally NO wrapper
  components for headings, rich text, or eyebrows.
- Variant classes are `cc-*`; utilities are `u-*` and always win (last
  layer). No `!important` outside of documented exceptions.
- Theming is `light-dark()` + `color-scheme`. Never branch on a theme
  class in CSS — add a token in tokens.css instead.
- Icons are Phosphor SVGs inlined at build time via `<Icon name="…">`
  (`@phosphor-icons/core`); there is no icon font.
- Keep visual parity with the reference export when changing framework
  CSS: build, screenshot, compare (light, dark, and 390px mobile).
