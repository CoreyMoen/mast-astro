/**
 * Mast for Astro — client runtime.
 *
 * One small bundle wires up every interactive piece of the framework.
 * Each initializer exits immediately when its elements aren't on the
 * page; Swiper is code-split and only fetched when a slider exists.
 */
import { initThemeToggle } from "./theme-toggle.ts";
import { initNav } from "./nav.ts";
import { initAccordions } from "./accordion.ts";
import { initModals } from "./modal.ts";
import { initTabs } from "./tabs.ts";
import { initSliders } from "./slider.ts";
import { initInlineVideos } from "./inline-video.ts";
import { initStaggerAnimations } from "./stagger.ts";
import { initA11yHelpers } from "./a11y.ts";

function init() {
  initThemeToggle();
  initNav();
  initAccordions();
  initModals();
  initTabs();
  initInlineVideos();
  initStaggerAnimations();
  initA11yHelpers();
  initSliders();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
