# Webflow CMS → Astro content collections

A Webflow CMS collection becomes files in the repo: one Markdown file
per item, a schema that validates them at build time, and pages that
query them. No database, no runtime — content is versioned in git and
type-checked like code. The blog collection in this repo is the worked
example; extend the same pattern rather than inventing a parallel one.

## Getting the data out of Webflow

Webflow exports CMS items as CSV (Collection settings → Export). Rich
Text fields export as HTML — convert to Markdown for the file body.
Images export as CDN URLs — download them (they live at
`cdn.prod.website-files.com/...`), including the responsive variants if
the site relied on them.

## The three pieces

**1. One `.md` per item** in `src/content/<collection>/`, slug as the
filename (Webflow's item slug, kebab-case):

```markdown
---
title: The steady center
description: Why the calmest part of a system should be load-bearing.
date: 2026-08-04
image: post1
imageAlt: Sailboats moored in a calm marina
---

Body copy (the Rich Text field), as Markdown.
```

**2. A schema** in `src/content.config.ts`. Map Webflow field types:

| Webflow field | zod |
| --- | --- |
| Plain text / Link / Option | `z.string()` (use `z.enum([...])` for Option) |
| Rich text | the Markdown body, not frontmatter |
| Date | `z.coerce.date()` |
| Number | `z.number()` |
| Switch | `z.boolean()` |
| Image | `z.string()` base name + required alt string (see below) |
| Reference / Multi-ref | `z.string()` / `z.array(z.string())` holding the referenced item ids; resolve with `getEntry`/`getCollection` at build |

Follow the blog collection's image convention: the frontmatter stores a
base name (`post1`), files live at `public/images/<name>.webp` with
`-p-500/-p-800/-p-1080/-p-1600` variants, and a helper in `src/lib/`
derives `src`/`srcset`/`sizes`. Add an `existsSync` refine on the image
field (as the blog schema does) so a typo'd name fails the build, and
make alt text required — an empty string is an explicit "decorative"
choice, not a default.

**3. Queries in pages.** Collection lists and collection-fed sliders:

```astro
---
const posts = (await getCollection("blog"))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---
{posts.map((post) => <Slide>…<Card href={`/blog/${post.id}`}>…</Card></Slide>)}
```

Detail pages are a dynamic route (`src/pages/<collection>/[slug].astro`)
with `getStaticPaths` mapping `post.id` to params, `render(post)` for
the body, and the item wrapped in `<article>` with a `<time>` element —
`src/pages/blog/[slug].astro` is the template to copy.

## Webflow CMS features with no direct equivalent

- **Conditional visibility** on CMS-bound elements → a plain
  `{post.data.flag && …}` conditional.
- **List limits / sorting / filtering UI** → build-time
  `.slice()`/`.sort()`/`.filter()`. Client-side filtering needs its own
  script — flag it as a follow-up rather than shipping dead controls.
- **`w-dyn-empty` empty states** → `{items.length === 0 && …}` if the
  collection can genuinely be empty; usually just drop it.
- **Draft/archived items** → don't create files for them, or add a
  `draft: z.boolean().default(false)` field and filter it in queries.
- **A future headless CMS**: the loader in `content.config.ts` is the
  swap point — pages and schemas stay put.
