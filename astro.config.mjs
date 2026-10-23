// @ts-check
import { defineConfig } from "astro/config";
import mastTuner from "./src/tuner/integration.mjs";

export default defineConfig({
  // Update to the production URL when the site has a home.
  site: "https://mast-framework.webflow.io",
  // Prefetch links on hover/tap for instant-feeling navigation.
  prefetch: true,
  // Dev-only dial canvas at /tuner; adds nothing to production builds.
  integrations: [mastTuner()],
});
