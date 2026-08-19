/**
 * Tabs: accessible tabs with autoplay, keyboard nav, deep linking, and a
 * mobile dropdown mode. Direct port of Mast's tabs.js.
 */
export function initTabs() {
  const components = document.querySelectorAll<HTMLElement>(
    "[data-tabs-component]",
  );
  if (!components.length) return;
  components.forEach(initTabsComponent);
}

function initTabsComponent(component: HTMLElement) {
  const tabMenu = component.querySelector<HTMLElement>("[data-tabs-menu]");
  const dropdownMenu = component.querySelector<HTMLElement>(
    "[data-tabs-menu-dropdown-menu]",
  );
  const tabMenuWrapper = component.querySelector<HTMLElement>(
    "[data-tabs-menu-wrapper]",
  );
  const tabLinks = component.querySelectorAll<HTMLElement>("[data-tabs-link]");
  const tabPanes = component.querySelectorAll<HTMLElement>("[data-tabs-pane]");

  if (
    !tabMenu ||
    !dropdownMenu ||
    !tabMenuWrapper ||
    !tabLinks.length ||
    !tabPanes.length
  ) {
    return;
  }

  const tabLinksArray = Array.from(tabLinks);
  const tabPanesArray = Array.from(tabPanes);

  let currentActiveIndex = 0;
  const dropdownToggle = tabMenu.querySelector<HTMLElement>(
    "[data-tabs-menu-dropdown-toggle]",
  );
  const dropdownText =
    dropdownToggle?.querySelector<HTMLElement>(
      "[data-tabs-menu-dropdown-text]",
    ) ?? null;
  const isMobileDropdown =
    tabMenu.getAttribute("data-tab-mobile-dropdown") === "true";

  const autoplayToggleButton = component.querySelector<HTMLElement>(
    "[data-tabs-autoplay-toggle]",
  );

  const autoplayEnabled = tabMenu.getAttribute("data-tabs-autoplay") === "true";
  const autoplayDuration =
    parseFloat(tabMenu.getAttribute("data-tabs-autoplay-duration") ?? "") || 5;
  const autoplayHoverPause =
    tabMenu.getAttribute("data-tabs-autoplay-hover-pause") === "true";
  let autoplayTimer: ReturnType<typeof setTimeout> | null = null;
  let isAutoplayPaused = false;
  let autoplayStartTime: number | null = null;
  let autoplayElapsedTime = 0;

  let cachedWindowWidth = window.innerWidth;
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;

  function setActiveTab(index: number) {
    if (index < 0 || index >= tabLinksArray.length) return;

    tabLinksArray.forEach((link, i) => {
      const isActive = i === index;
      link.setAttribute("aria-selected", String(isActive));
      link.classList.toggle("cc-active", isActive);
      link
        .querySelector("[data-tabs-link-button]")
        ?.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    tabPanesArray.forEach((pane, i) => {
      pane.setAttribute("aria-hidden", String(i !== index));
    });

    currentActiveIndex = index;

    if (dropdownText && isMobileDropdown) {
      const activeLink = tabLinksArray[index]!;
      dropdownText.textContent =
        activeLink.getAttribute("data-tab-link-name") || activeLink.textContent;
    }

    if (dropdownToggle && dropdownMenu!.classList.contains("cc-open")) {
      closeDropdown();
    }

    // Scroll the active tab into view within the overflow container.
    if (!isMobileDropdown) {
      const activeLink = tabLinksArray[index]!;
      const scrollContainer = tabMenuWrapper!;
      const containerLeft = scrollContainer.scrollLeft;
      const containerWidth = scrollContainer.clientWidth;
      const tabLeft = activeLink.offsetLeft;
      const tabWidth = activeLink.offsetWidth;

      if (
        tabLeft < containerLeft ||
        tabLeft + tabWidth > containerLeft + containerWidth
      ) {
        scrollContainer.scrollTo({ left: tabLeft, behavior: "smooth" });
      }
    }

    if (autoplayEnabled) {
      if (isAutoplayPaused) {
        autoplayElapsedTime = 0;
      } else {
        restartAutoplay();
      }
    }
  }

  function openDropdown() {
    if (!dropdownToggle || !dropdownMenu) return;
    dropdownMenu.classList.add("cc-open");
    dropdownToggle.classList.add("cc-open");
    dropdownToggle.setAttribute("aria-expanded", "true");
  }

  function closeDropdown() {
    if (!dropdownToggle || !dropdownMenu) return;
    dropdownMenu.classList.remove("cc-open");
    dropdownToggle.classList.remove("cc-open");
    dropdownToggle.setAttribute("aria-expanded", "false");
  }

  function toggleDropdown() {
    if (dropdownMenu!.classList.contains("cc-open")) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  function setupMobileDropdown() {
    if (!isMobileDropdown || !dropdownToggle) return;

    dropdownToggle.setAttribute("aria-haspopup", "true");
    dropdownToggle.setAttribute("aria-expanded", "false");

    const activeLink =
      component.querySelector<HTMLElement>(
        '[data-tabs-link][aria-selected="true"]',
      ) ||
      component.querySelector<HTMLElement>("[data-tabs-link].cc-active") ||
      tabLinksArray[0];
    if (dropdownText && activeLink) {
      dropdownText.textContent =
        activeLink.getAttribute("data-tab-link-name") || activeLink.textContent;
    }

    dropdownToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown();
    });

    document.addEventListener("click", (e) => {
      if (e.target instanceof Node && !component.contains(e.target)) {
        closeDropdown();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && dropdownMenu!.classList.contains("cc-open")) {
        closeDropdown();
        dropdownToggle.focus();
      }
    });
  }

  function startAutoplay() {
    if (!autoplayEnabled || isAutoplayPaused) return;
    stopAutoplay();
    const remainingTime = autoplayDuration * 1000 - autoplayElapsedTime;
    autoplayStartTime = Date.now();
    autoplayTimer = setTimeout(() => {
      setActiveTab((currentActiveIndex + 1) % tabLinksArray.length);
    }, remainingTime);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
    autoplayStartTime = null;
  }

  function restartAutoplay() {
    if (!autoplayEnabled) return;
    autoplayElapsedTime = 0;

    // Remove and re-add the progress animation to restart it.
    const activeLink = tabLinksArray[currentActiveIndex]!;
    const progressBar = activeLink.querySelector<HTMLElement>(
      "[data-tabs-autoplay-progress]",
    );
    if (progressBar) {
      progressBar.style.animation = "none";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          progressBar.style.animation = "";
        });
      });
    }

    startAutoplay();
  }

  function updateToggleButton() {
    autoplayToggleButton?.setAttribute(
      "aria-label",
      isAutoplayPaused ? "Play autoplay" : "Pause autoplay",
    );
  }

  function pauseAutoplay() {
    if (!autoplayEnabled) return;
    if (autoplayStartTime !== null) {
      autoplayElapsedTime += Date.now() - autoplayStartTime;
    }
    isAutoplayPaused = true;
    component.classList.add("autoplay-paused");
    stopAutoplay();
    updateToggleButton();
  }

  function resumeAutoplay() {
    if (!autoplayEnabled) return;
    isAutoplayPaused = false;
    component.classList.remove("autoplay-paused");
    startAutoplay();
    updateToggleButton();
  }

  function setupAutoplayObserver() {
    if (!autoplayEnabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            resumeAutoplay();
          } else {
            pauseAutoplay();
          }
        });
      },
      { threshold: 0.5 },
    );
    observer.observe(component);
  }

  function setupAutoplayHoverPause() {
    if (!autoplayEnabled || !autoplayHoverPause) return;
    component.addEventListener("mouseenter", pauseAutoplay);
    component.addEventListener("mouseleave", resumeAutoplay);
  }

  function setupAutoplayToggle() {
    if (!autoplayEnabled || !autoplayToggleButton) return;
    autoplayToggleButton.addEventListener("click", () => {
      if (isAutoplayPaused) {
        resumeAutoplay();
      } else {
        pauseAutoplay();
      }
    });
  }

  function findInitialActiveIndex() {
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const matchIndex = tabLinksArray.findIndex((link) => link.id === hash);
      if (matchIndex !== -1) return matchIndex;
    }

    const customActiveIndex = tabLinksArray.findIndex((link) =>
      link.classList.contains("cc-active"),
    );
    if (customActiveIndex !== -1) return customActiveIndex;

    return 0;
  }

  function setupKeyboardNav() {
    const tabLinksLength = tabLinksArray.length;

    tabLinksArray.forEach((link) => {
      const overlay = link.querySelector<HTMLElement>(
        "[data-tabs-link-button]",
      );
      if (!overlay) return;

      overlay.addEventListener("keydown", (e) => {
        let newIndex = currentActiveIndex;

        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            newIndex =
              currentActiveIndex > 0
                ? currentActiveIndex - 1
                : tabLinksLength - 1;
            break;
          case "ArrowRight":
            e.preventDefault();
            newIndex =
              currentActiveIndex < tabLinksLength - 1
                ? currentActiveIndex + 1
                : 0;
            break;
          case "Home":
            e.preventDefault();
            newIndex = 0;
            break;
          case "End":
            e.preventDefault();
            newIndex = tabLinksLength - 1;
            break;
          default:
            return;
        }

        setActiveTab(newIndex);
        tabLinksArray[newIndex]
          ?.querySelector<HTMLElement>("[data-tabs-link-button]")
          ?.focus();
      });
    });
  }

  function setupClickHandlers() {
    tabLinksArray.forEach((link, index) => {
      const overlay = link.querySelector<HTMLElement>(
        "[data-tabs-link-button]",
      );
      if (!overlay) return;

      overlay.addEventListener("click", (e) => {
        e.preventDefault();
        setActiveTab(index);

        if (cachedWindowWidth < 768 && !isMobileDropdown) {
          link.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      });
    });
  }

  function setupResizeHandler() {
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cachedWindowWidth = window.innerWidth;
      }, 150);
    });
  }

  // Initialize.
  setupMobileDropdown();
  if (autoplayEnabled) {
    component.style.setProperty("--autoplay-duration", `${autoplayDuration}s`);
  }
  setupAutoplayObserver();
  setupAutoplayHoverPause();
  setupAutoplayToggle();
  setActiveTab(findInitialActiveIndex());
  setupClickHandlers();
  setupKeyboardNav();
  setupResizeHandler();

  if (autoplayEnabled) {
    startAutoplay();
  }

  window.addEventListener("hashchange", () => {
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const matchIndex = tabLinksArray.findIndex((link) => link.id === hash);
      if (matchIndex !== -1) {
        setActiveTab(matchIndex);
      }
    }
  });
}
