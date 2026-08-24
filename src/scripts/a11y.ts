/**
 * Small global helpers: skip-link fallback, footer year, and detection of
 * increased default browser font size (columns stack via a container
 * query when the user doubles their base font size).
 */
function initA11yHelpers() {
  // Detect and mark default font size increase.
  function detectFontSizeIncrease() {
    const rootFontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    const multiplier = rootFontSize / 16;
    document.body.classList.toggle("font-size-increased", multiplier >= 2);
  }

  detectFontSizeIncrease();
  new ResizeObserver(detectFontSizeIncrease).observe(document.documentElement);

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
