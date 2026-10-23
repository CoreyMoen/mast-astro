---
name: mast-design
description: This project's layout taste — how to compose pages and sections from the Mast recipes and layout primitives so they fit the system. Read it before building or restyling any page or section in this project, whenever someone asks for a page "about" a topic or "with this content", and whenever choosing between section designs. It is trained from the developer's own feedback in the tuner (see mast-train), so it overrides general layout instincts.
---

# Designing pages for this project

> **Default principles.** These ship with Mast and haven't been trained
> on this project yet. Run the Training phase in `/tuner` (the
> `mast-train` skill) to replace them with the developer's own taste.

How to build is in `mast-build` (classes, components, tokens). This file
is about **what to build**: which sections, in what order, arranged how.

## Start from the dials

Read `getChoices()` and the token dials in `src/dials.ts` before
choosing anything; they are the site's expression, already decided.
Use recipes at their default `choices` unless a section needs to differ
from its neighbors, and when it does, override one choice, not three.

## Composing a page

- **Open with one clear claim.** A `Hero` or `PageHeader` whose title
  says what the page is for in under twelve words. One primary action;
  a secondary only if it's a different kind of next step.
- **Alternate rhythm.** Follow a dense section (cards, FAQs, a team
  grid) with an open one (a `Statement`, a `Split`). Alternate `theme`
  between `base` and `alt` so sections separate without rules.
- **One editorial moment per page.** An oversized statement or an
  editorial composition lands because the sections around it are calm.
  Two of them compete.
- **End with a single call to action** (`Cta`) that repeats the page's
  primary action in different words.
- **Five to eight sections** for a landing page. Fewer for a utility
  page. If a page needs more, it's probably two pages.

## Choosing sections

| Content | Reach for |
|---|---|
| 3–6 parallel points (features, values, services) | `Features`: `standard` for scannable cards, `offset` when the intro deserves weight, `editorial` for 3–4 points worth reading slowly |
| One idea with an image | `Split`; alternate `reverse` when two follow each other |
| A quote, belief, or proof point | `Statement` |
| People | `Team` |
| Questions and objections | `Faq`, late on the page, before the `Cta` |
| Numbers, steps, logos, anything no recipe covers | A bespoke section from `Section`/`Row`/`Col`, following the rules below |

## Bespoke sections

- Build from `Row`/`Col` spans that sum to 12 or use `justify="between"`.
  Avoid spans under 3 for text.
- Anchor with an eyebrow (`<div class="eyebrow cc-rule">`) and a heading
  at the size its importance deserves, not the next one down.
- Use `Spacer` between an intro and its body, and `Divider` to rule
  repeated items apart; never empty paragraphs or margins on the side.
- Numbers and short labels can go big (`h1` class on a `div`) when
  there are three or four of them; more than that, they should be body
  size in a list.

## Copy

- Real, specific copy beats any layout fix. A section that only works
  with lorem ipsum doesn't work.
- Headings say the point, not the topic: "Spend Friday on the work",
  not "Benefits".
- Keep intros to two sentences and card bodies to one or two.
