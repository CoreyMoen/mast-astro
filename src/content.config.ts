import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * The blog collection: one Markdown file per post in src/content/blog/.
 * The zod schema validates every file's frontmatter at build time, so a
 * missing title or a bad date fails the build instead of shipping.
 *
 * `image` is the base name of a file in public/images/ (e.g. "post1");
 * pages derive the responsive srcset from it.
 */
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    image: z.string(),
    imageAlt: z.string().default(""),
  }),
});

export const collections = { blog };
