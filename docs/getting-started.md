# Getting started

Mast for Astro ships on npm as `mast-astro`: the framework CSS, the typed
components, and their scripts. Install it into any Astro 7 project and you
get updates with a normal `npm update`, while your theme stays yours.

## Install

```sh
npm install mast-astro
npx mast-astro init
```

Starting from nothing? Create the project first with
`npm create astro@latest`, then run the two commands above.

`init` does two things:

- **Writes `src/styles/theme.css`**: every customizable token (colors, fonts,
  type scale, grid, spacing, container, component settings) at Mast's
  defaults, ready to edit. It never overwrites an existing file unless you
  pass `--force`.
- **Installs the `mast-build` agent skill** in `.agents/skills/mast-build/`
  and links it into `.claude/skills/`, so Claude Code and the other agents
  that read `.agents/skills/` know Mast's conventions before they write
  markup. Skip it with `--no-skills`.

## Use it

Make a layout that wraps Mast's `BaseLayout` and imports your theme:

```astro
---
// src/layouts/Layout.astro
import { BaseLayout } from "mast-astro";
import "../styles/theme.css";

interface Props {
  title: string;
  description?: string;
}
---

<BaseLayout {...Astro.props} siteName="Acme">
  <Fragment slot="head">
    <link rel="icon" href="/favicon.ico" />
  </Fragment>
  <slot name="nav" slot="nav" />
  <slot />
  <slot name="footer" slot="footer" />
</BaseLayout>
```

`BaseLayout` loads Mast's stylesheet, sets the page shell
(`page-wrapper` → nav → `<main id="main">` → footer), applies the saved
light/dark mode before first paint, and loads the scroll-animation and
accessibility helpers. Its `head` slot is where your favicons, font preloads
and `theme-color` go.

Then build pages with the components and classes:

```astro
---
import Layout from "../layouts/Layout.astro";
import { Section, Row, Col, Button, Nav, Footer } from "mast-astro";
---

<Layout title="Home">
  <Nav slot="nav">
    <img slot="logo" src="/logo.svg" alt="Acme" />
    <a href="/about" class="nav-link">About</a>
  </Nav>
  <Section>
    <Row>
      <Col size={6}>
        <h1>Hello</h1>
        <Button href="/start">Get started</Button>
      </Col>
    </Row>
  </Section>
  <Footer
    slot="footer"
    companyName="Acme"
    linkColumns={[[{ label: "About", href: "/about" }]]}
  >
    <img slot="logo" src="/logo.svg" alt="Acme" />
  </Footer>
</Layout>
```

Importing a component ships no JavaScript until you render it: the tabs
script loads only on pages that render `<Tabs>`.

### Without BaseLayout

If you already have a layout, import the stylesheet and theme yourself:

```astro
---
import "mast-astro/styles";
import "../styles/theme.css";
---
```

For the rest of what `BaseLayout` does, render `<BaseHead title="…" />`
(from `mast-astro`) inside `<head>` for the meta tags and the pre-paint theme
script, and import `mast-astro/scripts/stagger.ts` and
`mast-astro/scripts/a11y.ts` in a `<script>` for scroll animations and the
accessibility helpers.

## Theme it

Edit `src/styles/theme.css`. Its rules are unlayered, so they win over
Mast's defaults whatever order the files load in.

```css
:root {
  --color-orange: #5b3cff; /* the accent */
  --font-primary: "Inter", sans-serif;
  --h1-size-min: 3; /* rem at a 320px viewport */
  --h1-size-max: 6; /* rem at 1440px */
  --grid-columns: 16; /* site-wide, up to 16 */
  --container-max-width: 80rem;
}
```

Delete any line you don't change and Mast's default applies. See
[theming](theming.md) for how the tokens fit together.

**Fonts are yours to load.** Mast defaults to `system-ui`. Add `@font-face`
rules in your own CSS (serving the files from `public/fonts/`), then set
`--font-primary`.

## Add your own CSS

Put custom component styles in the `components` layer so Mast's utility
classes can still override them:

```css
@layer components {
  .pricing-card {
    padding: var(--card-padding);
  }
}
```

`theme.css` declares Mast's layer order up front, so this works whichever
file the browser sees first. Custom breakpoint rules use Mast's desktop-first
`max-width` queries (see [desktop-first](building-with-mast.md#desktop-first)).

## What the package exports

| Import                                | What                                   |
| ------------------------------------- | -------------------------------------- |
| `mast-astro`                          | Every component, plus `BaseLayout`     |
| `mast-astro/components/Section.astro` | One component, by file                 |
| `mast-astro/layouts/BaseLayout.astro` | The page shell                         |
| `mast-astro/styles`                   | All framework CSS (the layered bundle) |
| `mast-astro/styles/tokens.css`, …     | Individual layers, if you need one     |
| `mast-astro/scripts/tabs.ts`, …       | Behaviors, for hand-written markup     |

The docs travel with the package in `node_modules/mast-astro/docs/`, matched
to the version you have installed.

## Updating

```sh
npm update mast-astro
npx mast-astro init   # refreshes the agent skill; leaves theme.css alone
```

Mast is `0.x`: a minor version may change class names or component props,
and its release notes say what moved. New tokens take
their defaults from the package, so an older `theme.css` keeps working.

## Or start from the whole repo

To get the full style-guide site as a starting point (every demo page, the
blog collection, the fonts) rather than a package dependency:

```sh
npm create astro@latest -- --template CoreyMoen/mast-astro
```

You then own all of it, and updates are manual.
