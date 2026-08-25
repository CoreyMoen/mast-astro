import { existsSync } from "node:fs";
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * The blog collection: one Markdown file per post in src/content/blog/.
 * The zod schema validates every file's frontmatter at build time, so a
 * missing title, a bad date, or a typo'd image name fails the build
 * instead of shipping.
 *
 * `image` is the base name of a file in public/images/ (e.g. "post1");
 * pages derive the responsive srcset from it. `imageAlt` is required —
 * pass an empty string only for a purely decorative image.
 */
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    image: z
      .string()
      .refine((name) => existsSync(`public/images/${name}.webp`), {
        message: "image must be the base name of a file in public/images/",
      }),
    imageAlt: z.string(),
  }),
});

export const collections = { blog };
