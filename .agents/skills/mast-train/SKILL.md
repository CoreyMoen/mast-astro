---
name: mast-train
description: Run the Mast training loop that teaches agents a project's layout taste — generate batches of example pages from the section recipes and layout primitives, read the developer's section comments from the tuner, and distill them into the mast-design skill. Use this when someone asks to generate training pages or a training batch, to "distill" or "learn from" their tuner comments, to refine the default layout guidance, or pastes a prompt copied from the tuner's Training phase.
---

# Training layout taste

The loop has three steps. The tuner's Training phase (`/tuner` in dev,
tab 3) is where the developer reviews; you do the other two. Background:
the "Training" section of `docs/dials.md`.

| File | What it holds |
|---|---|
| `src/training/pages/*.astro` | Generated pages, served at `/training/<name>` in dev only, never built |
| `src/training/feedback.json` | `comments` (open) and `distilled` (already folded in) |
| `.agents/skills/mast-design/SKILL.md` | The distilled taste: what agents read before building a page |

## 1. Generate a batch

1. Read `.agents/skills/mast-design/SKILL.md`, then `feedback.json`
   (both lists), then the existing pages, so the batch builds on what was
   kept, retries what needed refining, and skips what was avoided.
2. Write 3–6 pages named `batch-NN-<topic>.astro`, NN one above the
   highest batch so far. Pick topics that pull layouts in different
   directions: a product launch, a nonprofit, a portfolio, a restaurant,
   a service business, a long-form story. Write real, specific copy;
   placeholder text hides whether a layout works.
3. Build every page from three things only:
   - **recipes** in `src/components/recipes/`, with their `choices` prop
     to vary composition, alignment, and whitespace per section;
   - **bespoke sections** from `Section`/`Row`/`Col`/`Spacer`/`Divider`
     and Mast classes, for patterns no recipe covers. Mark the
     `<Section>` with `data-recipe="bespoke"` and a short
     `data-variant` (`stats-row`, `numbered-steps`) so comments can name
     them;
   - images in `public/images/` (`/images/postN.webp`).
4. Vary deliberately. Within a page, mix rhythms (dense next to airy,
   alt backgrounds alternating, one editorial moment among standard
   ones). Across the batch, try the open questions from the feedback
   two different ways.
5. Copy the header comment from `batch-01-product.astro` so each page
   says what it is. Run `npm run check`.
6. Restart the dev server if it's running (new routes are injected at
   startup), then tell the developer the batch is ready under Training
   in `/tuner` and what it explores.

## 2. Review (the developer)

They turn on commenting and click sections. Each comment records the
page, section index, `recipe`, `variant`, first heading, a verdict
(`keep`, `refine`, `avoid`), and a note.

## 3. Distill

1. Read the open `comments` with the pages they point at. A comment
   without its section is half the information: open the page file and
   find the section by index (count `<Section>`s, recipes included).
2. Generalize. "The stats row feels cramped" on one page is a rule about
   stat sections in general, with its reason: _"Give stats a full row
   with at least a 3-column span each; cramped numbers read as noise."_
   Keep the developer's words where they're sharper than yours.
3. Merge into `mast-design/SKILL.md`: strengthen a rule that a comment
   confirms, rewrite one it contradicts (newest wins), and add new ones
   under the section they belong to. Keep the file a guide, not a log:
   no dates, page names, or comment ids. Remove the "default
   principles" notice once real training replaces most of them.
4. When a comment is about a recipe itself ("editorial Features should
   never use cards"), change the recipe too, or say you'd like to.
   When it is about a value (a color, a radius), it belongs in Details
   or Expression, not the skill: say so instead of writing a rule.
5. Move the distilled comments from `comments` to `distilled` in
   `feedback.json`.
6. Show the developer the diff of the skill and a one-paragraph summary
   of what changed. They review it like code.

## Pages that aren't needed any more

Old batches can stay as reference; delete them when the canvas gets
crowded. Their comments keep working only while the page exists, so
distill before deleting.
