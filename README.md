# Mastro

**[Mast](https://nocodesupply.co/mast) — a lightweight, component-first CSS framework — rebuilt for [Astro](https://astro.build).**

Mastro ports the entire Mast framework for Webflow to a modern Astro codebase: the fluid design-token system, the 12-column flex grid, light/dark theming, and every interactive component (accordion, modal, tabs, slider, marquee, inline video, theme toggle, nav) — with no Webflow runtime, no jQuery, and no GSAP.

## Getting started

```sh
npm install
npm run dev      # dev server at localhost:4321
npm run build    # static build to dist/
npm run check    # typecheck .astro files
npm run format   # prettier
```

Requires Node 22.12+.

## What's inside

```
src/
├── styles/            The framework CSS, split into cascade layers
│   ├── global.css     Layer order + imports (tokens → base → layout →
│   │                  typography → components → styleguide → utilities)
│   ├── tokens.css     Every themable value as a custom property
│   ├── base.css       Fonts, reset, semantic element styles
│   ├── layout.css     Section / container / row / col grid, slots, spacers
│   ├── typography.css Eyebrow, paragraph sizes, rich text
│   ├── components.css Buttons, cards, forms, nav, footer, accordion, modal,
│   │                  tabs, slider, marquee, inline video, tables, icons
│   ├── styleguide.css Presentation styles for the docs pages (styles__*)
│   └── utilities.css  u-* utility classes (loaded last, so they always win)
├── scripts/           Small vanilla-TS runtime (one bundle, ~20KB;
│                      Swiper is code-split and loads only on slider pages)
├── components/        30+ typed .astro components
├── layouts/           BaseLayout (page shell, head, theme bootstrapping)
└── pages/             The Mast style guide rebuilt as Astro pages
```

## How the port modernizes the Webflow export

| Webflow export                                 | Mastro                                                                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `--lightningcss-light/dark` polyfill hack      | native [`light-dark()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) + `color-scheme` |
| `w-variant-<hash>` component variant classes   | semantic `cc-*` classes + typed component props                                                                   |
| `--_typography---h1--font-size` variable names | clean tokens (`--h1-size`, `--theme-accent`, `--grid-gap-main`, …)                                                |
| Webflow runtime + jQuery + GSAP + IX3 (~250KB) | ~20KB of vanilla TypeScript                                                                                       |
| `div.button` + cover-link hack                 | real `<a>` / `<button>` elements                                                                                  |
| Hidden-input custom checkboxes/radios          | native inputs styled with `appearance: none` + `:checked`                                                         |
| Webflow nav/dropdown/tabs runtime              | small accessible ports (ARIA states, keyboard nav, reduced-motion)                                                |
| CDN-hosted Swiper + Phosphor                   | npm packages, bundled and code-split by Astro                                                                     |
| IX3 scroll-stagger interaction                 | IntersectionObserver + CSS transitions (`data-animate="stagger-children"`)                                        |

The visual language, class names (`.section`, `.container`, `.row`, `.col-*`, `.u-*`), fluid type scale, and component behavior match the Webflow original — pages built against Mast's class API port over nearly unchanged.

## Theming

All theme decisions live in `src/styles/tokens.css`. The five `--theme-*` properties resolve through `light-dark()`, so both modes are defined in one place:

```css
--theme-background: light-dark(var(--color-white), var(--color-black));
```

- The saved mode is applied to `<html>` before first paint (no flash).
- `.u-mode-light` / `.u-mode-dark` force a scheme on any subtree.
- `<Section theme="alt">` swaps in the offset background per section.
- `<ThemeToggle />` renders the switch; preference persists in localStorage.

## Components

Layout: `Section`, `Container`, `Row`, `Col`, `ContentWrap`, `Spacer`, `Divider`
Content: `Heading`, `Eyebrow`, `RichText`, `Button`, `Card`, `CardBody`, `Icon`, `Img`
Interactive: `Accordion`, `Modal`, `Tabs`/`TabPane`, `Slider`/`Slide`, `Marquee`, `InlineVideo`, `ThemeToggle`
Chrome: `Nav`, `NavDropdown`, `NavBanner`, `Footer`, `SkipLink` (built into Nav), `StyleGuideNav`
Forms: `Form`, `Field`, `Choice`

Example:

```astro
<Section theme="alt" animate>
  <Row justify="center">
    <Col size={8}>
      <ContentWrap align="center">
        <Eyebrow>Lorem ipsum</Eyebrow>
        <Heading tag="h1">A simple header</Heading>
        <RichText><p>Fluid, themable, component-first.</p></RichText>
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

## Pages

- `/` — style guide cover
- `/styles` — typography, color, utilities, layout reference
- `/components` — every component demo
- `/basic-layouts` and `/inspired-layouts` — layout patterns
- `/401`, `/404` — utility pages

## Reference

The original Webflow export lives in `reference/mast-framework.webflow/` and is the source of truth for visual parity. It is not part of the build.
