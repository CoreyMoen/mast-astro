/**
 * Theme toggle.
 *
 * The current mode is applied to <html> as .u-mode-light / .u-mode-dark,
 * which sets `color-scheme` and re-resolves every light-dark() token.
 * An inline head script in BaseLayout applies the saved mode before first
 * paint; this module wires up the checkbox toggles.
 */
function initThemeToggle() {
  const docEl = document.documentElement;
  // Storage can throw when the browser blocks site data.
  const readSavedTheme = () => {
    try {
      return localStorage.getItem("savedTheme");
    } catch {
      return null;
    }
  };
  const savedTheme = readSavedTheme();
  const prefersColorScheme = window.matchMedia("(prefers-color-scheme: dark)");

  function applyMode(isLight: boolean) {
    docEl.classList.toggle("u-mode-light", isLight);
    docEl.classList.toggle("u-mode-dark", !isLight);
  }

  function updateLabels(
    isLight: boolean,
    darkLabel: HTMLElement | null,
    lightLabel: HTMLElement | null,
  ) {
    if (darkLabel && lightLabel) {
      darkLabel.style.display = isLight ? "none" : "block";
      lightLabel.style.display = isLight ? "block" : "none";
    }
  }

  let isLight =
    savedTheme !== null ? savedTheme === "light" : !prefersColorScheme.matches;

  applyMode(isLight);

  const checkboxes = document.querySelectorAll<HTMLInputElement>(
    '[data-theme-toggle="checkbox"]',
  );

  const toggleInstances = Array.from(checkboxes).map((checkbox) => ({
    checkbox,
    darkLabel:
      checkbox.parentElement?.querySelector<HTMLElement>(
        '[data-theme-toggle="dark-label"]',
      ) ?? null,
    lightLabel:
      checkbox.parentElement?.querySelector<HTMLElement>(
        '[data-theme-toggle="light-label"]',
      ) ?? null,
  }));

  function syncAllToggles(isLight: boolean) {
    toggleInstances.forEach((instance) => {
      instance.checkbox.checked = isLight;
      updateLabels(isLight, instance.darkLabel, instance.lightLabel);
    });
  }

  syncAllToggles(isLight);

  toggleInstances.forEach((instance) => {
    instance.checkbox.addEventListener("change", () => {
      isLight = instance.checkbox.checked;
      applyMode(isLight);
      try {
        localStorage.setItem("savedTheme", isLight ? "light" : "dark");
      } catch {
        // Storage unavailable; the choice still applies for this page.
      }
      syncAllToggles(isLight);
    });
  });

  // Track the OS scheme only while the visitor hasn't picked a mode —
  // re-checked at event time so a same-session toggle choice sticks.
  prefersColorScheme.addEventListener("change", (e) => {
    if (readSavedTheme() !== null) return;
    isLight = !e.matches;
    applyMode(isLight);
    syncAllToggles(isLight);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initThemeToggle);
} else {
  initThemeToggle();
}
