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
  const skipLinkEle = document.getElementById("skip-link");
  if (skipLinkEle) {
    const handleSkipLink = (e: Event) => {
      if (e.type === "keydown" && (e as KeyboardEvent).key !== "Enter") return;
      e.preventDefault();
      const target = document.querySelector<HTMLElement>("main");
      if (!target) return;
      target.setAttribute("tabindex", "-1");
      target.focus();
    };
    skipLinkEle.addEventListener("click", handleSkipLink);
    skipLinkEle.addEventListener("keydown", handleSkipLink);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initA11yHelpers);
} else {
  initA11yHelpers();
}
