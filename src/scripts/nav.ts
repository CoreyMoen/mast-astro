/**
 * Nav interactions: mobile hamburger menu and dropdowns.
 * Replaces the Webflow nav/dropdown runtime with a small vanilla port.
 */
export function initNav() {
  const navs = document.querySelectorAll<HTMLElement>(".nav");
  if (!navs.length) return;

  navs.forEach((nav) => {
    const menuBtn = nav.querySelector<HTMLButtonElement>(".nav-menu_btn");

    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.addEventListener("click", () => {
        const open = nav.classList.toggle("cc-open");
        menuBtn.setAttribute("aria-expanded", String(open));
      });
    }

    const dropdowns = nav.querySelectorAll<HTMLElement>(".nav-dropdown");

    function closeDropdowns(except?: HTMLElement) {
      dropdowns.forEach((dropdown) => {
        if (dropdown === except) return;
        dropdown.classList.remove("cc-open");
        dropdown.querySelector(".cc-dropdown-btn")?.setAttribute("aria-expanded", "false");
      });
    }

    dropdowns.forEach((dropdown) => {
      const toggle = dropdown.querySelector<HTMLElement>(".cc-dropdown-btn");
      if (!toggle) return;

      toggle.setAttribute("aria-haspopup", "true");
      toggle.setAttribute("aria-expanded", "false");

      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        const open = dropdown.classList.toggle("cc-open");
        toggle.setAttribute("aria-expanded", String(open));
        closeDropdowns(dropdown);
      });
    });

    document.addEventListener("click", (e) => {
      if (!(e.target instanceof Node) || !nav.contains(e.target)) {
        closeDropdowns();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      closeDropdowns();
      if (nav.classList.contains("cc-open")) {
        nav.classList.remove("cc-open");
        menuBtn?.setAttribute("aria-expanded", "false");
        menuBtn?.focus();
      }
    });
  });
}
