// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  // src/ is the framework (the npm package); site/ is the style-guide
  // site, which imports the framework as "mast-astro" like any consumer.
  srcDir: "./site",
  // Update to the production URL when the site has a home.
  site: "https://mast-framework.webflow.io",
  // Prefetch links on hover/tap for instant-feeling navigation.
  prefetch: true,
});
