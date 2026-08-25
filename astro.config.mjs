// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  // Update to the production URL when the site has a home.
  site: "https://mast-framework.webflow.io",
  // Prefetch links on hover/tap for instant-feeling navigation.
  prefetch: true,
});
