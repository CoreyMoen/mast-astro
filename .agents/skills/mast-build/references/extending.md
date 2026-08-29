# Extending Mast

Mast expects to be extended — the 20% of a site that isn't stock is where the
value is. These are the patterns that keep extensions feeling like part of the
framework rather than bolted onto it.

- [Adding a custom class](#adding-a-custom-class)
- [Adding a component](#adding-a-component)
- [Writing component scripts](#writing-component-scripts)
- [Animation](#animation)
- [CSS practices](#css-practices)
- [Accessibility and performance](#accessibility-and-performance)

## Adding a custom class

Reach for one when the thing is genuinely specific to this project and no
existing base class fits — a `blog-card`, a `pricing-table_row`.

- Put its rules in the `components` layer (`src/styles/components.css`) so
  utilities can still override it.
- Give it variants with `cc-` combo classes, not with new sibling classes:
  `blog-card` + `cc-featured` beats `blog-card-featured`.
- Put **all** of its styling in the class, including things a utility could
  do. An element with a custom class owns its own styles; mixing in utilities
  splits the definition across two places and makes the utility mean something
  different here than elsewhere.

## Adding a component

Only create one when there is real markup or behavior to encapsulate. A
component that emits a single styled tag is a layer with no payload — that's
why there is no `Heading` or `RichText` component here.

- Type the props and keep them small and enumerated. `astro check` must stay
  at zero errors; typed props are what stop a component drifting out of the
  system.
- Emit Mast classes, not bespoke ones, so the output is readable to anyone who
  knows the framework.
- If the component has behavior, it carries its own script import:

  ```astro
  <script>
    import "@/scripts/thing.ts";
  </script>
  ```

  Astro dedupes the module per page, so a page ships only the behaviors it
  actually renders. **The script rides the component that needs it** — if a
  page hand-rolls the markup instead of using the component, it won't get the
  behavior. That's why `TabPane` carries `tabs.ts` even though `Tabs` also
  imports it.

## Writing component scripts

Scripts live in `src/scripts/` as self-initializing vanilla TS modules.

**Exit early when the elements aren't on the page.** Every module starts by
querying for its own hook and returning if nothing matches. This is what makes
it safe to import a module anywhere without paying for it.

```ts
const els = document.querySelectorAll("[data-thing]");
if (els.length) {
  // …initialize
}
```

**Target attributes and IDs, not classes.** This is the single most useful
rule in the whole custom-code section of the Mast docs: styling and behavior
should be separable, so that renaming a class for better nomenclature can
never silently break functionality. The attribute APIs here —
`data-accordion`, `data-tabs-*`, `data-slider`, `data-video`,
`data-theme-toggle`, `data-marquee-*` — deliberately match the upstream
Webflow Mast scripts, so knowledge transfers in both directions.

**Prefer the platform.** Mast reaches for native features before JavaScript:
`<details>` for accordions, `<dialog>` for modals, CSS scroll-snap for the
slider, `light-dark()` for theming, rem media queries instead of
font-size-detection JS. The marquee is CSS-only and needs no script at all.
Before writing behavior, check whether the platform already does it.

## Animation

Animation is attribute-driven: put `data-animate` on the element and give it a
value naming the animation (`stagger-children` is the built-in). `Section`,
`Row`, `Col`, and `ContentWrap` accept an `animate` prop that emits it.

Keeping animation on an attribute rather than a class means it can be added
and removed without touching styling, and extended by adding values (varied
delays or durations) rather than new mechanisms.

Every animation must respect `prefers-reduced-motion`. Avoid flashing, fast,
or jarring motion; where art direction demands it, pause or hide it for users
who've asked for reduced motion.

## CSS practices

**Keep it DRY.** Group selectors that share a declaration rather than
repeating it. If you're writing the same three properties in four places,
that's either a utility or a custom class.

**Never `transition: all`.** Transition the specific properties you mean
(`color`, `background-color`, `transform`). `all` can force browsers to
re-evaluate and repaint far more than intended, for no benefit.

**Respect the cascade layers.** Order is
`tokens → base → layout → typography → components → styleguide → utilities`.
Utilities come last so they win *without* `!important`. If you find yourself
reaching for `!important`, you're almost certainly putting a rule in the wrong
layer.

**No `!important` outside documented exceptions.** The layer order exists so
you don't need it.

## Accessibility and performance

- **Heading level is semantics, size is a class.** Use `<h3 class="h2">` when
  the outline needs an h3 but the design wants h2's size. Never pick a heading
  level for its appearance.
- **Inline SVGs**: drop fixed `width`/`height` (keep `viewBox`) so size is
  controlled by CSS, use `currentColor` for fills/strokes so they inherit, and
  add a `<title>` when the SVG is the only content of a link.
- **Icons are build-time SVGs** via `<Icon name="…" />` (Phosphor). There is no
  icon font — don't add one.
- **Images**: give real `sizes`/`srcset` for anything large, mark the LCP image
  `fetchpriority="high"` and eager, and lazy-load the rest.
- **Zero framework JS by default** is a property worth protecting. Before
  adding a dependency, check whether a few lines of vanilla TS and a native
  element do the job — that's how the slider ended up ~7KB with no library.
