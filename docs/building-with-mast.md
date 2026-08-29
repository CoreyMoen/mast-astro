# Building with Mast

How to build with this framework, and why it's shaped the way it is. If
you've used [Mast for Webflow](https://nocodesupply.co/mast/docs), the
thinking here is the same — only the mechanics change.

- [The mindset](#the-mindset)
- [Two APIs](#two-apis-classes-and-components)
- [Already styled](#already-styled)
- [The four class types](#the-four-class-types)
- [Utility or custom class?](#utility-or-custom-class)
- [Naming](#naming)
- [Layout](#layout)
- [Extending the framework](#extending-the-framework)

See also: [Class reference](class-reference.md) · [Theming](theming.md)

## The mindset

Mast is **developer-first**. It aims to make ~80% of a site fast to build
with shared classes and components, then get out of the way for the 20% that
is genuinely bespoke. It's not utility-first like Tailwind, and it's not a
component library that hides its markup. Knowing which of those it _isn't_
prevents most mistakes.

Everything else follows from one goal: **reduce cognitive load**. The same
mental model — sections, rows, columns, tokens, `cc-` variants — should hold
whether you're writing a page, reading one a year later, or extending the
framework. Where you have a choice, pick the option that keeps that model
intact, even when a one-off hack would be shorter.

**About rules.** For almost every rule there's an exception. Follow the rule,
except where there's an exception — and then follow a new rule based on that
exception. The point isn't that the rules are soft; it's that deviations
should be _systematic_, so the next person meets a pattern rather than a
surprise. If you're breaking a convention once, ask whether you've actually
found a variant worth naming.

## Two APIs: classes and components

**Classes are the styling API. Components carry structure and behavior.**

Text is plain HTML with Mast classes:

```html
<h2 class="h1">A heading</h2>
<div class="eyebrow cc-rule">Section label</div>
<div class="rich-text"><p>Body copy.</p></div>
```

There are deliberately **no** wrapper components for headings, rich text, or
eyebrows. A component that emits one styled tag is a layer with no payload —
it adds indirection without adding meaning. Don't create them.

Components exist where there's real markup or real JavaScript to encapsulate:

- **Structure** — `Section`, `Row`, `Col`, `ContentWrap`, `Spacer`, `Divider`
- **Behavior** — `Accordion`, `Modal`, `Tabs`/`TabPane`, `Slider`/`Slide`,
  `Marquee`, `InlineVideo`, `ThemeToggle`, `Nav`, `Form`/`Field`/`Choice`,
  `Button`, `Card`, `Icon`, `Img`, `Logo`

Their props are small and enumerated, so `astro check` catches drift.

## Already styled

Mast ships opinionated defaults so the common case needs no classes at all.
Two you'll meet constantly:

- **Headings have a bottom margin**, set in `em` so it scales with font size
  and never needs a per-breakpoint override. When a heading shouldn't have
  one, add `u-mb-0` — don't zero it in a new rule.
- **Columns have a default gap.** It's a floor, not a layout. Adjust spacing
  with row justification (`row-justify-between`) or a gap modifier
  (`row-gap-md`, `row-gap-sm`, `row-gap-button`, `row-gap-0`).

If something looks over-spaced, the fix is almost always an existing utility
or modifier, not a new declaration.

## The four class types

| Type    | Prefix | For                                                                                                                         |
| ------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Base    | none   | Foundational structures: `section`, `container`, `row`, `col`, `button`, `input`, `card`, `h1`–`h6`, `rich-text`, `eyebrow` |
| Utility | `u-`   | One small, global adjustment: `u-mb-0`, `u-text-center`, `u-img-cover`                                                      |
| Custom  | none   | Project-specific classes for genuinely unique UI: `blog-card`, `footer-social_link`                                         |
| Combo   | `cc-`  | Variants of a base or custom class: `cc-alt`, `cc-rule`, `cc-narrow`                                                        |

`styles__*` is reserved for style-guide chrome and never appears in real site
markup — it lives in `styleguide.css`, which `global.css` deliberately does
not import.

## Utility or custom class?

The judgment call you'll make most often.

- **Stack at most ~4 utilities on an element.** Past that the markup stops
  being readable and the intent gets lost — write a custom class.
- **Don't add more than one extra utility to fix a lower breakpoint.**
  Several responsive utilities on one element usually means the layout wants
  a different structure.
- **Never mix a custom class and a utility for the same concern.** If an
  element already has a custom class and needs `margin-bottom: 0`, put that
  declaration _in the custom class_. A utility should mean one thing
  everywhere, and an element carrying its own class should own its own
  styles.
- If you want to keep using utilities but you're breaking the rules above, an
  extra wrapping `<div>` that groups one kind of utility is a legitimate out.

**Leave no dead CSS.** Webflow's "clear unused classes" becomes: when you
remove markup, remove the rules that served it. A class kept "just in case"
is a class the next person has to reason about.

## Naming

Mast follows a **modified BEM**. What matters day to day:

- Lowercase only, and only characters valid in CSS — what you write is what
  ships.
- `-` between words _within_ one name: `u-bg-primary`, `nav-link`.
- `_` between **levels of context**: `footer-social_link`,
  `blog_header-title`. The underscore is the meaningful boundary; don't use
  it decoratively.
- Breakpoint **infix**: `-lg-`, `-md-`, `-sm-`, `-xs-` (`col-lg-8`).
- Size **postfix**: `-sm`, `-md`, `-lg`, `-xl` (`paragraph-xl`). T-shirt sizes
  are deliberately abstract so the same class name survives a rebrand where
  the values change.

Short, meaningful names beat exhaustive ones; abbreviate long words.

## Layout

Page shape is consistent so pages stay interchangeable:

```
page-wrapper → Nav → <main id="main"> → sections → Footer
```

The grid is a 12-column flex system: any number of `col` inside a `row`.
Column widths **cascade upward** — set the smallest breakpoint that differs
and larger ones inherit, so `col-sm-6 col-lg-4` is complete. Columns
exceeding 12 in a row wrap.

Breakpoints are rem-based (`61.9375rem` / `47.9375rem` / `29.9375rem`), so
they track the visitor's font size rather than device pixels. A large-font
user gets the stacked layout with no JavaScript. Use these exact values; a px
equivalent silently opts out of that behavior.

Full class lists are in the [class reference](class-reference.md).

## Extending the framework

Mast expects to be extended — the 20% that isn't stock is where the value is.

### Custom classes

Put rules in the `components` layer (`src/styles/components.css`) so
utilities can still override them. Give variants `cc-` combo classes rather
than sibling classes: `blog-card` + `cc-featured` beats `blog-card-featured`.

### Components

Only create one when there's real markup or behavior to encapsulate. Type the
props and keep them enumerated. If the component has behavior, it carries its
own script import:

```astro
<script>
  import "@/scripts/thing.ts";
</script>
```

Astro dedupes the module per page, so a page ships only the behaviors it
renders. **The script rides the component that needs it** — a page that
hand-rolls the markup instead of using the component won't get the behavior.
That's why `TabPane` carries `tabs.ts` even though `Tabs` also imports it.

### Scripts

Scripts live in `src/scripts/` as self-initializing vanilla TS modules.

**Exit early when the elements aren't on the page** — every module queries
for its own hook and returns if nothing matches. That's what makes it safe to
import a module anywhere without paying for it.

**Target attributes and IDs, not classes.** Styling and behavior should be
separable, so renaming a class for clarity can never silently break
functionality. The attribute APIs here — `data-accordion`, `data-tabs-*`,
`data-slider`, `data-video`, `data-theme-toggle`, `data-marquee-*` —
deliberately match the upstream Webflow Mast scripts, so knowledge transfers
both ways.

**Prefer the platform.** `<details>` for accordions, `<dialog>` for modals,
CSS scroll-snap for the slider, `light-dark()` for theming, rem media queries
instead of font-size-detection JS. The marquee is CSS-only. Before writing
behavior, check whether the platform already does it.

### Animation

Animation is attribute-driven: `data-animate` with a value naming the
animation (`stagger-children` is built in). `Section`, `Row`, `Col`, and
`ContentWrap` accept an `animate` prop that emits it. Keeping animation on an
attribute rather than a class means it can be added and removed without
touching styling, and extended by adding values rather than mechanisms.

Every animation must respect `prefers-reduced-motion`.

### CSS practices

- **Keep it DRY.** Group selectors that share a declaration. The same three
  properties in four places is either a utility or a custom class.
- **Never `transition: all`.** Transition the properties you mean; `all` can
  force browsers to repaint far more than intended.
- **Respect the layers:** `tokens → base → layout → typography → components →
styleguide → utilities`. Utilities come last so they win _without_
  `!important`. Reaching for `!important` usually means a rule is in the
  wrong layer.

### Accessibility and performance

- **Heading level is semantics, size is a class.** Use `<h3 class="h2">` when
  the outline needs an h3 but the design wants h2's size. Never pick a
  heading level for its appearance.
- **Inline SVGs:** drop fixed `width`/`height` (keep `viewBox`), use
  `currentColor`, and add a `<title>` when the SVG is a link's only content.
- **Icons** are build-time SVGs via `<Icon name="…" />`. There is no icon
  font — don't add one.
- **Images:** real `sizes`/`srcset` for anything large, `fetchpriority="high"`
  and eager on the LCP image, lazy-load the rest.
- **Zero framework JS by default** is worth protecting. Before adding a
  dependency, check whether a few lines of vanilla TS and a native element do
  the job — that's how the slider ended up ~7KB with no library.
