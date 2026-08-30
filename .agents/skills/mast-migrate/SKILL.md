---
name: mast-migrate
description: >
  Migrate a site built with Mast for Webflow into this Mast for Astro
  project. Use this whenever the user wants to convert, port, migrate, or
  rebuild a Webflow site or Webflow export (HTML/CSS/JS from "Export
  Code") into Astro — including migrating a single exported page or
  section, converting Webflow CMS collections into Astro content
  collections, or translating Webflow components (sliders, tabs,
  accordions, modals, forms, navs) into the framework's Astro components.
  Trigger even if the user just pastes exported Webflow HTML and asks to
  "make this a page here", "convert this section", or "bring my Webflow
  site over" — any Webflow-to-Astro work in a Mast project belongs to
  this skill.
---

# Migrating Mast for Webflow → Mast for Astro

Mast for Astro is a 1:1 rebuild of the Mast Webflow framework: the same
class names (`.section`, `.container`, `.row`, `.col-*`, `cc-*`
variants, `u-*` utilities), the same `data-*` behavior APIs, and the
same design tokens. That makes migration mostly a *translation*, not a
redesign: strip what Webflow's runtime added, keep the Mast markup, and
swap repeated/interactive structures for the typed Astro components.

Work section by section and verify as you go. The repo's own pages are
the living style guide — when unsure how something should look in Astro
form, find the equivalent pattern in `src/pages/basic-layouts.astro`,
`src/pages/inspired-layouts.astro`, or `src/pages/components.astro` and
copy its shape.

## The five-step workflow

### 1. Inventory the export

Read the exported page(s) top to bottom before writing anything. Note:

- Pages and their `<title>`/meta (carry these to `BaseLayout` props).
- Which interactive components appear (`data-slider`, `data-tabs-*`,
  `data-accordion`, `data-video*`, `data-marquee-*`, `dialog`,
  `data-theme-toggle`) — each becomes an Astro component.
- CMS-bound regions (`w-dyn-list` / `w-dyn-item`) — these become
  content collections (step 4).
- Custom-code embeds (`w-embed`) — decide per embed: framework CSS mods
  usually already exist in this repo's styles; genuine custom code moves
  into the page or a component.
- Theme customizations: if the site changed Mast variables in Webflow,
  collect the changed values for `src/styles/tokens.css`.

### 2. Strip the Webflow layer

Everything Webflow's runtime needed disappears; the Mast markup stays.
Delete on sight:

| Remove | Why |
| --- | --- |
| `webflow.js` / `jQuery` / `swiper-bundle` script tags, `normalize.css` + per-page CSS links | The Astro framework ships its own CSS layers and dependency-free scripts |
| `data-wf-page`, `data-wf-site`, `data-w-id`, `data-wf-component-id`, `w-node-…` ids | Webflow runtime bookkeeping |
| `w-mod-js` touch-detection snippet in `<head>` | `BaseHead` has its own pre-paint script |
| Classes starting `w-` (`w-embed`, `w-form`, `w-dyn-*`, `w-checkbox`, `w-slider`…) | Runtime hooks; the Mast classes beside them are the real styling |
| Wrapper divs that only carried a `w-*` class or a slot | The Astro components emit minimal DOM |
| `<meta name="robots" content="noindex, nofollow">` | Export artifact — do not ship it |

Never copy `css/mast-framework.css` or `js/mast-framework.js` from the
export — the framework already lives in `src/styles/` and
`src/scripts/`. Only site-specific custom CSS (from embeds or a
site-specific stylesheet) migrates, into the page or a new file.

### 3. Translate structure to the Astro API

Two rules cover almost everything (they're the framework's mental
model, see `README.md`):

1. **Text stays plain HTML with Mast classes.** `<h2 class="h1">`,
   `<div class="eyebrow cc-rule">`, `<div class="rich-text">…</div>`,
   `<p class="paragraph-lg">` — copy these through unchanged. There are
   intentionally no wrapper components for headings/rich text/eyebrows.
2. **Structure and behavior become typed components.** Sections, grids,
   cards, and everything interactive map to the components in
   `src/components/` — the full element-by-element mapping, with props
   and before/after markup, is in
   [references/component-map.md](references/component-map.md). Read it
   before translating your first section; skim the relevant entry for
   each component after that.

Pages get this shell:

```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
import Section from "@/components/Section.astro";
// …only what the page uses
---

<BaseLayout title="About" description="…from the export's meta…">
  <Fragment slot="nav"><!-- Nav/NavBanner, per component-map --></Fragment>
  <Section tag="header">…</Section>
  …
  <Footer slot="footer" />
</BaseLayout>
```

Semantics upgrades to make while translating (the export is div soup;
the Astro edition is not): exactly one `<h1>` per page, heading levels
that step down without skips (visual size comes from the class, so
`<h3 class="h1">` is normal), `<article>`/`<time>` on CMS detail pages,
real `<th scope="col">` in table headers, `rel="noopener"` on
`target="_blank"` links.

### 4. CMS collections → content collections

Each Webflow CMS collection becomes an Astro content collection: one
Markdown file per item under `src/content/<collection>/`, a zod schema
in `src/content.config.ts` (so bad frontmatter fails the build), and
pages that query with `getCollection()`. Collection lists and
collection-fed sliders on migrated pages become `getCollection().map()`
over `Card`/`Slide` markup; detail pages become a `[slug].astro` route.
The full recipe — field-type mapping, image conventions, the existing
blog collection as a template — is in
[references/cms-to-collections.md](references/cms-to-collections.md).

### 5. Assets, tokens, verification

- **Images**: download from the Webflow CDN
  (`cdn.prod.website-files.com`) into `public/images/`. Keep Webflow's
  responsive variants under the `-p-500/-p-800/-p-1080/-p-1600`
  naming (plus the full-size original) so `srcset` helpers work; write
  `sizes` for the real rendered width, not a copy-paste. Give every
  content image its alt text from the CMS/export.
- **Fonts**: WOFF2 files into `public/fonts/`, `@font-face` in
  `src/styles/base.css`, preloads in `BaseHead` — only if the site uses
  fonts the repo doesn't already ship.
- **Tokens**: apply the site's variable overrides in
  `src/styles/tokens.css`. Adjust only the editable values (palette,
  per-style min/max pairs and settings); never touch the generated
  `clamp()` section at the bottom.
- **Verify**: after each page, `npm run check` (must stay at 0 errors)
  and `npm run build`. For visual parity, open the original export
  next to the Astro build and compare at desktop and 390px, light and
  dark — the Playwright workflow and the classic gotchas (cascade-layer
  order, scroll-padding, missing scripts) are in
  [references/verification.md](references/verification.md).

## Judgment calls worth knowing about

- **Don't invent abstraction.** If the export repeats a card six times,
  a `.map()` over a data array in the page frontmatter is the Mast way —
  not a new wrapper component. New components are only justified by real
  markup+behavior (and this repo probably already has one).
- **Forms lose Webflow's submission handling.** Migrate the markup to
  `Form`/`Field`/`Choice`, point `action`/`method` at whatever will
  handle submissions, and tell the user Webflow's endpoint no longer
  applies. The hidden `.form-success`/`.form-error` blocks are shown by
  the site's own handler.
- **Interactions (IX2) don't migrate mechanically.** The framework
  covers the common ones: scroll-in staggers are `animate` on
  `Section`/`Row`/`ContentWrap` (i.e. `data-animate="stagger-children"`),
  and component transitions come built in. Bespoke Webflow interactions
  need a judgment call: reproduce with CSS, or drop and note it.
- **Leftover `w-dyn-empty`, pagination controls, filter UIs** from CMS
  lists have no static-equivalent runtime — implement with a build-time
  `.filter()`/`.slice()` or note them as follow-ups. Don't ship dead
  controls.
