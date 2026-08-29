# Mast class reference

Every class listed here exists in this repo. If something you want isn't
here, that's the signal to write a custom class — not to guess at a name.

- [Layout: page structure](#layout-page-structure)
- [Grid: rows and columns](#grid-rows-and-columns)
- [Typography](#typography)
- [Utilities](#utilities)
- [Breakpoints](#breakpoints)

## Layout: page structure

| Class | Role |
|---|---|
| `page-wrapper` | Single outermost wrapper on every page |
| `section` | Wraps each band of content; owns consistent top/bottom padding |
| `container` | Centers content and sets left/right spacing; `cc-nav`, `cc-footer` variants |
| `content-wrap` | Groups related elements; `cc-center`, `cc-left` alignment variants |
| `spacer-component` | Explicit vertical space; `cc-sm`, `cc-md`, `cc-lg` |
| `rich-text` | Body copy container; styles nested `h*`, `p`, `ul`, `blockquote` |
| `eyebrow` | Small label above a heading; `cc-rule` adds the leading rule |

`section` takes `u-pt-0` / `u-pb-0` to tighten vertical rhythm, and `cc-alt`
for the offset background.

## Grid: rows and columns

Any number of `col` inside a `row`. Bare `col` gives equal widths.

**Widths** — `col-1` … `col-12` (all breakpoints), plus per-breakpoint
`col-lg-1`…`col-lg-12`, `col-md-*`, `col-sm-*`, `col-xs-*`, and `col-auto`.

Widths **cascade upward**: a value set at a smaller breakpoint applies to
larger ones until overridden. Set only the breakpoints that change.

**Row modifiers**

| Class | Effect |
|---|---|
| `row-align-center` / `row-align-end` | Vertical alignment of columns |
| `row-content-center` / `row-content-end` / `row-content-between` | Vertical alignment of wrapped full-width rows |
| `row-justify-center` / `row-justify-end` / `row-justify-around` / `row-justify-between` | Horizontal distribution |
| `row-gap-md` / `row-gap-sm` / `row-gap-button` / `row-gap-0` | Gap override for that row and its columns |

`row-gap-button` exists specifically for rows of buttons in shrunk columns.

**Column modifiers**

| Class | Effect |
|---|---|
| `col-shrink` | Shrink to content width |
| `col-{bp}-offset-0` … `col-{bp}-offset-6` | Offset by N columns |
| `col-{bp}-first` / `col-{bp}-last` | Reorder at that breakpoint |
| `col-lg-contain-left` / `col-lg-contain-right` | Extend one side to the viewport edge while the other stays contained |

The `contain-left`/`contain-right` pair is the supported way to build a
half-bleed section — don't reach for negative margins.

## Typography

Heading **class** and heading **element** are independent on purpose: pick the
element for document semantics, then the class for visual size. An `<h3>` that
should look like an h2 is `<h3 class="h2">`. This is how you keep a correct
heading outline without visual compromise — use it rather than choosing a
heading level by how big it looks.

| Class | Role |
|---|---|
| `h1` … `h6` | Visual heading sizes |
| `paragraph-xl` / `paragraph-lg` / `paragraph-sm` | Body size variants (base needs no class) |
| `eyebrow` | Small caps-ish label |
| `rich-text` | Container that styles its nested elements |

Bottom margins are set in `em`, so they scale with font size and don't need
per-breakpoint overrides. Remove with `u-mb-0`.

## Utilities

Utilities are last in the cascade, so they win without `!important`.

**Spacing** — `u-mt-0`, `u-mt-xs`, `u-mt-sm`, `u-mt-md`, `u-mt-lg`,
`u-mt-auto` and the `u-mb-*` equivalents; `u-m-0`, `u-mlr-auto` (centers),
`u-pt-0`, `u-pb-0`, `u-p-0`.

Spacing utilities use `em`, so they stay proportional to the element's type
size. This is why Mast needs far fewer responsive spacing classes than a
px-based system.

**Text** — `u-text-left`, `u-text-center`, `u-text-right`;
`u-text-balance`, `u-text-pretty`; `u-text-clamp-1|2|3`.

**Color** — `u-bg-primary`, `u-bg-white`, `u-bg-black`, `u-bg-lightgray`,
`u-bg-midgray-1`, `u-bg-midgray-2`, `u-bg-darkgray`, `u-bg-yellow`,
`u-bg-blue`; `u-text-primary`, `u-text-white`, `u-text-black`,
`u-text-midgray-1`.

Color is a utility by design so it can be layered onto anything, and the
underlying values stay adjustable in one place.

**Display and position** — `u-d-none`, `u-d-block`, `u-d-flex`,
`u-d-inline-flex`, `u-d-contents`, `u-position-relative`, `u-position-sticky`.

Responsive display: `u-md-d-none`, `u-sm-d-none`, `u-xs-d-none` and the
`-d-block` equivalents.

**Size and ratio** — `u-w-100`, `u-h-100`, `u-minh-100vh`;
`u-aspect-1x1`, `u-aspect-16x9`, `u-aspect-4x3`.

**Overflow** — `u-overflow-hidden`, `u-overflow-visible`.

**Helpers** (multiple properties, brand-agnostic patterns)

| Class | Effect |
|---|---|
| `u-img-cover` | Absolutely fill a relative parent with `object-fit: cover` |
| `u-link-cover` | Absolutely fill a relative parent with a link (card cover links) |
| `u-sr-only` | Visually hidden, still read by screen readers |
| `u-z-index-1` | Lift above a sibling |
| `u-border` | Full-width 1px modular rule |
| `u-list-unstyled` | Strip list markers and padding |
| `u-full-height-center` | Center content in a full-height area |
| `u-mode-light` / `u-mode-dark` | Force a color scheme on a subtree |

## Breakpoints

| Name | Infix | Applies |
|---|---|---|
| Desktop | `-lg-` | above 61.9375rem (~991px) |
| Tablet | `-md-` | max-width 61.9375rem |
| Mobile landscape | `-sm-` | max-width 47.9375rem |
| Mobile portrait | `-xs-` | max-width 29.9375rem |

These are **rem** based so breakpoints track the visitor's default font size —
a large-font user gets the stacked layout without any JavaScript. Use these
exact values in new media queries; a px equivalent silently opts out of that
behavior.

> Note: the published Webflow docs' breakpoint table lists the dimensions
> column shifted by one row (it shows Desktop as `<992px`). The values above
> are what this repo's CSS actually implements.
