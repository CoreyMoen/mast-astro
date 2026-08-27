# Verifying a migrated page

Migration parity is checkable, so check it — don't eyeball a diff of
markup and call it done.

## Every page, every time

```sh
npm run check    # must stay at 0 errors (and ideally 0 hints)
npm run build    # schema validation + all pages render
```

## Visual parity

`playwright-core` is in devDependencies for exactly this. Drive the
preview server headlessly and compare against the original (the Webflow
export opened from disk, or the live .webflow.io site):

```js
import { chromium } from "playwright-core";
// launch({ executablePath: <system chromium> }); newContext per case
```

Compare at minimum: **1440px and 390px**, in **light and dark**
(`colorScheme` on the context). Cheap and effective signals, in order:

1. `document.body.scrollHeight` per page — a few px of drift is noise;
   tens of px means a section changed.
2. Section offsets (`getBoundingClientRect().top` of each
   `section/.section/footer`) — binary-search which section drifted.
3. Screenshots of the drifted section side by side.

Also exercise behavior once per page: open each dropdown/modal/
accordion, advance each slider and tab set, toggle the theme.

## Gotchas that have actually bitten this migration

- **Cascade-layer order**: any extra stylesheet imported by a page must
  declare the full canonical `@layer tokens, base, layout, typography,
  components, styleguide, utilities;` line at its top. If the bundler
  loads that file before `global.css`, whichever `@layer` statement
  comes first wins — without the line, your file's layer registers
  first and lowest and rules silently lose.
- **Scripts ride components**: a page only gets `tabs.ts`, `slider.ts`
  etc. if a component that imports them renders on the page. Hand-rolled
  interactive markup (no Astro component) must render at least one
  related component (e.g. `TabPane`) or the behavior never initializes —
  symptom: all panes/slides visible, stacked.
- **Breakpoints are rem** (61.9375/47.9375/29.9375 max-widths). If you
  add JS that checks viewport width, use
  `matchMedia("(max-width: 61.9375rem)")`, never `innerWidth <= 991`.
- **`sizes` must match the rendered slot.** Copying a card's
  `33vw`-style `sizes` onto a full-width hero makes the browser fetch a
  tiny variant — a blurry hero that looks like a compression problem
  but isn't.
- **Slide widths are CSS-driven** (`--lg/--md/--sm/--xs` vars). If
  slides collapse or overflow oddly, the vars/props are wrong — don't
  patch widths with utilities.
- **Fonts flash**: keep the `BaseHead` preloads in sync with any font
  files you add.
