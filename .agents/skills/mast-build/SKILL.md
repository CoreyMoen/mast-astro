---
name: mast-build
description: Build and extend pages, sections, components, and styles in this Mast for Astro project the way Mast intends. Use this whenever you are writing markup or CSS here — adding a page or section, styling anything, choosing between a utility class and a custom class, naming a new class, adding a token or color, changing type or spacing, adding a breakpoint rule, writing a component script, or adding an animation. Trigger even when the request sounds like plain web work ("build a hero section", "make this two columns on desktop", "add a dark variant", "why is there a gap under this heading") — in a Mast project those decisions have house rules, and guessing produces markup that technically renders but drifts out of the system.
---

# Building with Mast

Mast is a **developer-first** framework: it aims to make ~80% of a site fast to
build with shared classes and components, and then get out of the way for the
20% that is genuinely bespoke. It is not a utility-first framework like
Tailwind, and it is not a component library that hides its markup. Knowing
which of those it *isn't* prevents most mistakes.

The whole system optimizes for one thing: **reducing cognitive load**. The same
mental model — sections, rows, columns, tokens, `cc-` variants — should apply
whether someone is writing a page by hand, reading one a year later, or
extending the framework itself. When you have a choice, pick the option that
keeps that model intact, even if a one-off hack would be shorter.

## The rule about rules

Mast's own docs put it well: *for almost every rule there is an exception.
Follow the rule, except where there is an exception — and then follow a new
rule based on that exception.* The point is not that the rules are soft; it's
that when you deviate you should deviate **systematically**, so the next
person meets a pattern rather than a surprise. If you find yourself breaking a
convention once, ask whether you're actually discovering a variant worth
naming.

## Two APIs, and which one to reach for

**Classes are the styling API. Components carry structure and behavior.**

Text is plain HTML with Mast classes — `<h2 class="h1">`,
`<div class="rich-text">`, `<div class="eyebrow cc-rule">`. There are
deliberately **no** wrapper components for headings, rich text, or eyebrows,
because a component that only emits one styled tag adds a layer without adding
meaning. Don't create them.

Components exist where there is real markup or real JavaScript to encapsulate:
structure (`Section`, `Row`, `Col`, `ContentWrap`, `Spacer`, `Divider`) and
behavior (`Accordion`, `Modal`, `Tabs`/`TabPane`, `Slider`/`Slide`, `Marquee`,
`InlineVideo`, `ThemeToggle`, `Nav`, `Form`/`Field`/`Choice`, `Button`, `Card`,
`Icon`, `Img`, `Logo`). Their props are small and enumerated so `astro check`
catches drift.

When you need a structural wrapper the components already cover, use the
component; when you need styled text, write the HTML.

## Already styled — expect defaults, don't fight them

Mast ships opinionated defaults so the common case needs no classes at all.
Two you will meet constantly:

- **Headings have a bottom margin**, set in `em` so it scales with the font
  size and never needs a per-breakpoint override. When a heading shouldn't have
  it, add `u-mb-0` — don't zero it in a new rule.
- **Columns have a default gap.** It's a floor, not a layout; adjust spacing
  with row-level justification classes (`row-justify-between`) or a gap
  modifier (`row-gap-md`, `row-gap-sm`, `row-gap-button`, `row-gap-0`).

If something looks over-spaced, the fix is almost always an existing utility or
modifier, not a new declaration.

## The four class types

| Type | Prefix | What it's for |
|---|---|---|
| Base | none | Foundational structures: `section`, `container`, `row`, `col`, `button`, `input`, `card`, `h1`–`h6`, `rich-text`, `eyebrow` |
| Utility | `u-` | One small, global styling adjustment: `u-mb-0`, `u-text-center`, `u-img-cover` |
| Custom | none | Project-specific classes for genuinely unique UI: `blog-card`, `footer-social_link` |
| Combo | `cc-` | Variants of a base or custom class: `cc-alt`, `cc-rule`, `cc-narrow` |

`styles__*` is reserved for style-guide chrome and must never appear in real
site markup. In this repo it lives in `styleguide.css`, which the framework's
`global.css` deliberately does not import.

## Deciding between a utility and a custom class

This is the judgment call you'll make most often, and the docs give clear
guardrails:

- **Stack at most ~4 utilities on an element.** Past that, the markup stops
  being readable and the intent gets lost — make a custom class instead.
- **Don't add more than one extra utility to fix a lower breakpoint.** Several
  responsive utilities on one element is a sign the layout wants a different
  structure.
- **Never mix a custom class and a utility for the same concern.** If an
  element already has a custom class and needs `margin-bottom: 0`, put that
  declaration *in the custom class* rather than adding `u-mb-0`. In Webflow
  this protected the utility's global meaning; here the reason is the same in
  spirit — a utility should mean one thing everywhere, and elements that carry
  their own class should own their own styles.
- If you want to keep using utilities but you're breaking the rules above,
  an extra wrapping `<div>` that groups one kind of utility is a legitimate
  out.

**Leave no dead CSS.** Webflow's "clear unused classes" becomes: when you
remove markup, remove the rules that served it. A class kept "just in case" is
a class the next person has to reason about.

## Naming

Mast follows a **modified BEM**. The details that actually matter day to day:

- Lowercase only, and only characters valid in CSS — what you write is what
  ships.
- `-` between words *within* one name: `u-bg-primary`, `nav-link`.
- `_` between **levels of context**: `footer-social_link`, `blog_header-title`.
  The underscore is the meaningful boundary; don't use it decoratively.
- Breakpoint **infix**: `-lg-`, `-md-`, `-sm-`, `-xs-` (`col-lg-8`).
- Size **postfix**: `-sm`, `-md`, `-lg`, `-xl` (`paragraph-xl`). T-shirt sizes
  are deliberately abstract so the same class name survives a rebrand where the
  actual values change.

Short, meaningful names beat exhaustive ones; abbreviate long words.

## Tokens are the theme

`src/styles/tokens.css` is where design decisions live — it replaces Webflow's
Variables panel, and it's organized the same way (color palette, theme, fonts,
type styles grouped per style, layout, components).

Three rules keep it coherent:

1. **Fluid sizes are min/max pairs.** Edit the `*-min` / `*-max` values; the
   `clamp()` formulas generated at the bottom of the file are never hand-edited.
2. **Never branch on a theme class in CSS.** Theming is `light-dark()` plus
   `color-scheme`, resolved in one place. If a color needs to differ between
   modes, that's a new token — not an `.dark &` selector.
3. **Only add colors you'll actually use.** A palette mirroring a full brand
   guide when six colors ship is noise.

Details, including the full token map and how to force a scheme on a subtree:
`references/tokens-and-theming.md`.

## Layout

Page shape is consistent so pages stay interchangeable:
`page-wrapper` → `<Nav>` → `<main id="main">` → sections → `<Footer>`.

The grid is a 12-column flex system: any number of `col` inside a `row`.
Column widths **cascade upward** — set the smallest breakpoint that differs and
larger ones inherit, so `col-sm-6 col-lg-4` is complete. Columns exceeding 12 in
a row wrap.

Breakpoints are rem-based (`61.9375rem` / `47.9375rem` / `29.9375rem`), so they
track the visitor's font size rather than device pixels. Use these exact values;
don't invent px equivalents.

The full class reference — every grid, alignment, offset, order, gap, and
utility class actually present in this repo — is in
`references/class-system.md`. Read it before inventing a class; the thing you
want usually exists.

## Extending the framework

Adding behavior, a component, a utility, or custom CSS has house patterns worth
following — early-exit scripts, attribute-based targeting, animation via
`data-animate`, and the accessibility and performance rules Mast has settled on.
See `references/extending.md`.

The one principle to carry into all of it: **target attributes and IDs from
JavaScript, not classes.** Styling and behavior should be separable, so
renaming a class for clarity can never silently break functionality.

## Before you call it done

- `npm run check` — 0 errors. Props and content schemas are typed for a reason.
- `npm run build` — a broken image reference or bad frontmatter fails here.
- `npm run format` — Prettier is enforced in CI.
- Look at it in **both** color modes and at **390px**. Mast is fluid and
  themed; a change that only holds in light mode at desktop isn't finished.
  `playwright-core` is in devDependencies for driving the preview server.
