/**
 * Small global helpers: skip-link fallback and footer year.
 *
 * No font-size detection is needed: the framework's media queries are in
 * rem, so an increased default browser font size shifts every breakpoint
 * and layouts stack naturally.
 */
function initA11yHelpers() {
  // Update footer year to the current year.
  document.querySelectorAll("[data-footer-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  // Skip to <main> backup if the #main anchor target isn't set.
  // (Enter on a link fires click, so one listener covers keyboard too.)
  document.querySelectorAll<HTMLElement>(".nav-skip-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector<HTMLElement>("main");
      if (!target) return;
      target.setAttribute("tabindex", "-1");
      target.focus();
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initA11yHelpers);
} else {
  initA11yHelpers();
}
