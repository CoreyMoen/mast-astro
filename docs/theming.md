# Theming and tokens

`src/styles/tokens.css` is the design system. It is the Astro equivalent of
Webflow's Variables panel, and it keeps the same organizing idea: the values
you actually change on every project sit at the top, grouped by the thing they
describe, and derived machinery sits at the bottom where nobody edits it.

## How the file is organized

1. **Color: raw palette** — the brand swatches (`--color-white`,
   `--color-black`, `--color-orange`, `--color-red`, …). Add only colors the
   project actually ships. A palette that mirrors a full brand guide when six
   colors get used is noise that every future reader has to filter.
2. **Color: theme** — the five properties everything else resolves through:

   ```css
   --theme-background: light-dark(var(--color-white), var(--color-black));
   --theme-text: light-dark(var(--color-black), var(--color-white));
   --theme-accent: var(--color-orange);
   --theme-accent-dark: var(--color-dark-orange);
   --theme-border: light-dark(var(--color-mid-gray-1), var(--color-mid-gray-2));
   ```

3. **Fonts**
4. **Fluid range** — the viewport bounds every fluid value interpolates
   between.
5. **Type styles** — one group per style (H1…H6, Paragraph XL/LG/base/SM,
   Eyebrow). Each group keeps its size-min, size-max, weight, line-height,
   letter-spacing, and margin together, so changing "what H2 looks like" is one
   contiguous edit rather than a hunt across the file.
6. **Layout** — grid gaps (`--grid-gap-main: 40px`, `--grid-gap-md: 24px`,
   `--grid-gap-sm: 8px`, `--grid-gap-button: 16px`), container widths, margins.
7. **Components** — min/max pairs for section and card padding, radii, and the
   fixed component settings.
8. **Generated clamps** — never hand-edited.

## Fluid values: edit the pair, not the formula

Every fluid size is expressed as a min and a max — the value at the small end
of the viewport range and at the large end. The `clamp()` expression that
interpolates between them is generated.

```css
/* H2 */
--h2-size-min: 2rem;     /* edit these */
--h2-size-max: 3.8rem;
...
--h2-size: clamp(...);   /* never edit this */
```

Two consequences worth internalizing:

- To make type bigger on mobile, change `-min`. To change desktop, change
  `-max`. You almost never need a media query for type size.
- Because sizes are in `rem` and margins in `em`, the whole system already
  responds to the user's browser font size. Adding px-based overrides opts
  out of that.

## Theming rules

**Theming is `light-dark()` plus `color-scheme`, and it resolves in one
place.** The page sets a scheme; every `--theme-*` token resolves against it
automatically.

**Never branch on a theme class in CSS.** No `.dark .card { … }`. If a color
must differ between modes, that difference belongs in a token:

```css
/* wrong */
.callout {
  background: #fff;
}
:root[data-theme="dark"] .callout {
  background: #1d1c1a;
}

/* right */
--callout-bg: light-dark(var(--color-white), var(--color-black));
.callout {
  background: var(--callout-bg);
}
```

The reason is maintainability: with the token approach, a new mode (or a
forced scheme on a subtree) works everywhere at once. With class branching,
every component needs its own override and they drift.

**Forcing a scheme on a subtree** — `u-mode-light` / `u-mode-dark` set
`color-scheme` on an element, so all `light-dark()` tokens inside re-resolve.
This is the supported way to make something always-light regardless of page
mode; the video playback chip uses exactly this so it stays legible over
footage in either mode. Reach for it instead of hardcoding hex values.

**Section-level theming** — `<Section theme="alt">` swaps in the offset
background for one band of the page.

**Mode selection** — the saved preference is applied to `<html>` before first
paint (so there's no flash), and the OS preference is tracked live until the
visitor explicitly picks a mode. `<ThemeToggle />` renders the control.

## Adding a token

1. Put it in the group it belongs to, matching the naming of its neighbors —
   grouping is what makes the file scannable.
2. If it's a size that should scale, add a min/max pair and a generated clamp
   rather than a fixed value.
3. If it's a color that differs by mode, express it with `light-dark()` at the
   theme level rather than resolving it at the point of use.
