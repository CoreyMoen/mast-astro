/**
 * Helpers for blog post images and dates. Post frontmatter stores the
 * base image name (e.g. "post1"); the responsive variants live in
 * public/images/ alongside it.
 */
export const postSrc = (image: string) => `/images/${image}.webp`;

export const postSrcset = (image: string) =>
  [500, 800, 1080, 1600]
    .map((w) => `/images/${image}-p-${w}.webp ${w}w`)
    .join(", ") + `, /images/${image}.webp 2000w`;

export const postSizes = "(max-width: 47.9375rem) 100vw, 33vw";

export const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
