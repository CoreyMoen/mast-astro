# Mast CSS and Component Framework for Astro

Bring the entire [Mast](https://nocodesupply.co/mast) framework to a modern Astro codebase: the fluid design-token system, the 12-column flex grid, light/dark theming, and every interactive component (accordion, modal, tabs, slider, marquee, inline video, theme toggle, nav) — with no Webflow runtime, no jQuery, no GSAP, and no icon font.

Mast's philosophy carries over unchanged: **as minimal and easy to learn as possible**, while following practices that scale naturally to bigger sites.

## Getting started

```sh
npm install
npm run dev      # dev server at localhost:4321
npm run build    # static build to dist/
npm run check    # typecheck .astro files
npm run format   # prettier
```

Requires Node 22.12+.

## The mental model

Two rules cover almost everything:

1. **Classes style structure.** Layout and text use plain HTML with Mast classes — `.section`, `.container`, `.row`, `.col-4`, `.eyebrow`, `.rich-text`, `.paragraph-lg`, `.u-*` utilities. What you write is what ships; there are no hidden wrapper divs.
2. **Components carry structure and behavior.** Typed Astro components exist where they encode real markup or JavaScript: the structural set (`Section`, `Row`, `Col`, `ContentWrap`, `Spacer`, `Divider`) and the behavioral set (`Button`, `Card`/`CardBody`, `Icon`, `Img`, `Logo`, `Accordion`, `Modal`, `Tabs`/`TabPane`, `Slider`/`Slide`, `Marquee`, `InlineVideo`, `ThemeToggle`, `Nav`/`NavDropdown`/`NavBanner`, `Footer`, `Form`/`Field`/`Choice`, plus `BaseHead` for the document head). Their props are intentionally small and enumerated, so both a beginner and an AI agent get autocomplete, validation from `astro check`, and no way to drift out of the system.

```astro
<Section theme="alt" animate>
  <Row justify="center">
    <Col size={8}>
      <ContentWrap align="center">
        <div class="eyebrow cc-rule">Lorem ipsum</div>
        <h1>A simple header</h1>
        <div class="rich-text"><p>Fluid, themable, component-first.</p></div>
        <Row gap="button" justify="center">
          <Col size="shrink"><Button href="#">Button</Button></Col>
          <Col size="shrink"
            ><Button href="#" variant="secondary">Button</Button></Col
          >
        </Row>
      </ContentWrap>
    </Col>
  </Row>
</Section>
```

## What's inside

```
src/
├── styles/              The framework CSS, in cascade layers
│   ├── global.css       Layer order + imports (tokens → base → layout →
│   │                    typography → components → utilities)
│   ├── tokens.css       The theme: every editable value up top, generated
│   │                    fluid clamp() formulas quarantined at the bottom
│   ├── base.css         Fonts, reset, semantic element styles
│   ├── layout.css       Section / container / row / col grid, content wrap
│   ├── typography.css   Eyebrow, paragraph sizes, rich text
│   ├── components.css   Buttons, cards, forms, nav, footer, accordion,
│   │                    modal, tabs, slider, marquee, video, tables, icons
│   ├── styleguide.css   Doc-site chrome (styles__*) — loaded ONLY by the
│   │                    style-guide pages, never part of a real site
│   └── utilities.css    u-* utilities (last layer, so they always win)
├── scripts/             Self-initializing vanilla-TS behaviors; each one
│                        ships only on pages that use its component
├── components/          Typed .astro components (styleguide/ = doc chrome)
├── layouts/             BaseLayout (page shell, head, theme bootstrapping)
├── content/             The blog content collection (one .md per post)
├── content.config.ts    Collection schema — bad frontmatter fails the build
├── lib/                 blog.ts: srcset/sizes/date helpers for post images
├── consts.ts            Site title, description, framework version
└── pages/               The Mast style guide built with the framework
```

## Theming

`src/styles/tokens.css` is the theme. The five `--theme-*` properties resolve through native [`light-dark()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark), so both modes are defined in one place:

```css
--theme-background: light-dark(var(--color-white), var(--color-black));
```

- The saved mode is applied to `<html>` before first paint (no flash), and the OS preference is tracked live until the visitor picks a mode.
- `.u-mode-light` / `.u-mode-dark` force a scheme on any subtree.
- `<Section theme="alt">` swaps in the offset background per section.
- `<ThemeToggle />` renders the switch; the preference persists in localStorage.

Fluid sizes (the type scale, section and card padding) are min/max pairs in rem — the value at a 320px viewport and at 1440px. Adjust the pairs; the interpolation formulas at the bottom of the file are generated and never hand-edited.

## Performance

- **Zero framework JavaScript by default.** Interactive components carry their own script imports; Astro dedupes them per page, so a page ships only the behaviors it renders.
- **Zero runtime dependencies.** The slider is a ~7KB dependency-free engine: native scroll + CSS scroll snap does the movement (touch, momentum — it even works without JavaScript), and a small script adds arrows, pagination, autoplay, loop, fade, keyboard support, and carousel ARIA.
- **No icon font.** `<Icon name="arrow-right" />` inlines the Phosphor SVG at build time.
- **Native platform features** wherever they exist: `<details>` accordions, `<dialog>` modals, `light-dark()` theming, rem-based media queries (breakpoints track the visitor's default font size, so layouts stack for large-font users with no JS), IntersectionObserver scroll animations that respect `prefers-reduced-motion`.
- Link prefetching is enabled for instant-feeling navigation.

## Content collections (the CMS)

Where the Webflow edition used CMS collections, Mastro uses [Astro content collections](https://docs.astro.build/en/guides/content-collections/): one Markdown file per entry, stored in the repo — no database.

```
src/content/blog/the-steady-center.md   ← frontmatter + body = one post
src/content.config.ts                   ← schema; bad frontmatter fails the build
src/pages/blog/[slug].astro             ← one template renders every post
```

Query anywhere with `getCollection("blog")` — the components page feeds posts straight into a `<Slider>`, and each detail page renders its Markdown body inside `.rich-text`. Content is versioned in git, edited in any editor, and type-checked like code; swapping in a headless CMS later is just a different loader in `content.config.ts`, with no page changes.

## Pages

- `/` — style guide cover
- `/styles` — typography, color, utilities, layout reference
- `/components` — every component demo
- `/basic-layouts` and `/inspired-layouts` — layout patterns
- `/blog/[slug]` — post template driven by the blog content collection
- `/401`, `/404` — utility pages

## Reference

The original Webflow export lives in `reference/mast-framework.webflow/` and is the source of truth for visual parity. It is not part of the build. The interactive behaviors keep the same `data-*` attribute APIs as the upstream [Mast scripts](https://github.com/nocodesupplyco/mast), so knowledge transfers both ways.
