/**
 * Slider: Swiper-powered carousel configured by data attributes and CSS
 * variables. Port of Mast's slider.js; Swiper is loaded on demand so
 * pages without sliders ship none of it.
 */
import type Swiper from "swiper";
import type { SwiperOptions } from "swiper/types";

async function initSliders() {
  const swiperElements = document.querySelectorAll<HTMLElement>(
    '[data-slider="slider"]',
  );
  if (swiperElements.length === 0) return;

  const [
    { default: SwiperCore },
    { Navigation, Pagination, Keyboard, A11y, Autoplay, EffectFade },
  ] = await Promise.all([import("swiper"), import("swiper/modules")]);
  SwiperCore.use([
    Navigation,
    Pagination,
    Keyboard,
    A11y,
    Autoplay,
    EffectFade,
  ]);

  swiperElements.forEach((element) => {
    initializeSwiper(SwiperCore, element);
  });

  // Reinitialize on real width changes only (ignore mobile URL-bar resizes).
  let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
  let lastWidth = window.innerWidth;

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const currentWidth = window.innerWidth;
      if (currentWidth === lastWidth) return;
      lastWidth = currentWidth;

      swiperElements.forEach((element) => {
        const instance = (element as SwiperElement).swiperInstance;
        instance?.destroy(true, true);
      });
      setTimeout(() => {
        swiperElements.forEach((element) => {
          initializeSwiper(SwiperCore, element);
        });
      }, 50);
    }, 250);
  });
}

type SwiperElement = HTMLElement & { swiperInstance?: Swiper };

function initializeSwiper(SwiperCore: typeof Swiper, element: HTMLElement) {
  try {
    const config = getSwiperConfig(element);
    const swiper = new SwiperCore(element, config);
    (element as SwiperElement).swiperInstance = swiper;
    setupHeightCalculation(element, swiper);
  } catch (error) {
    console.error("Swiper initialization failed:", error);
  }
}

function setupHeightCalculation(element: HTMLElement, swiper: Swiper) {
  function updateSliderHeight() {
    const slides = element.querySelectorAll<HTMLElement>(".swiper-slide");
    if (slides.length === 0) return;

    let maxHeight = 0;
    slides.forEach((slide) => {
      slide.style.height = "auto";
      maxHeight = Math.max(maxHeight, slide.offsetHeight);
    });

    if (maxHeight > 0) {
      element.style.height = `${maxHeight}px`;
    }
  }

  updateSliderHeight();
  swiper.on("slideChange", updateSliderHeight);
  swiper.on("slideChangeTransitionEnd", updateSliderHeight);
  swiper.on("touchEnd", updateSliderHeight);
  swiper.on("resize", updateSliderHeight);
}

function getSwiperConfig(element: HTMLElement): SwiperOptions {
  // Slides-per-view and gap come from the CSS variables that also drive
  // the pre-hydration CSS layout, so the two always agree.
  const computedStyle = getComputedStyle(element);
  const xs = parseFloat(computedStyle.getPropertyValue("--xs").trim()) || 1;
  const sm = parseFloat(computedStyle.getPropertyValue("--sm").trim()) || 1;
  const md = parseFloat(computedStyle.getPropertyValue("--md").trim()) || 2;
  const lg = parseFloat(computedStyle.getPropertyValue("--lg").trim()) || 3;
  const spaceBetween =
    parseInt(computedStyle.getPropertyValue("--gap").trim()) || 24;

  const config: SwiperOptions = {
    breakpoints: {
      0: { slidesPerView: xs, spaceBetween },
      480: { slidesPerView: sm, spaceBetween },
      768: { slidesPerView: md, spaceBetween },
      992: { slidesPerView: lg, spaceBetween },
    },
    watchSlidesProgress: true,
    simulateTouch: true,
    allowTouchMove: true,
    keyboard: { enabled: true, onlyInViewport: true },
    a11y: { enabled: true },
    watchOverflow: true,
    normalizeSlideIndex: false,
    roundLengths: false,
    grabCursor: element.dataset.grabCursor !== "false",
  };

  const componentWrapper = element.closest<HTMLElement>(
    '[data-slider="component"]',
  );

  const nextEl = componentWrapper?.querySelector<HTMLElement>(
    '[data-slider="next"]',
  );
  const prevEl = componentWrapper?.querySelector<HTMLElement>(
    '[data-slider="previous"]',
  );
  if (nextEl && prevEl) {
    config.navigation = { nextEl, prevEl };
  }

  const paginationEl = componentWrapper?.querySelector<HTMLElement>(
    '[data-slider="pagination"]',
  );
  if (paginationEl) {
    config.pagination = {
      el: paginationEl,
      clickable: true,
      bulletElement: "button",
      bulletClass: "slider-pagination_button",
      bulletActiveClass: "cc-active",
    };
  }

  if (element.dataset.loop === "true") {
    config.loop = true;
    const loopAdditionalSlides = element.dataset.loopAdditionalSlides;
    if (loopAdditionalSlides && !isNaN(Number(loopAdditionalSlides))) {
      config.loopAdditionalSlides = parseInt(loopAdditionalSlides);
    }
  }

  const autoplayDelay = element.dataset.autoplay;
  if (
    autoplayDelay &&
    autoplayDelay !== "false" &&
    !isNaN(Number(autoplayDelay))
  ) {
    config.autoplay = {
      delay: parseInt(autoplayDelay),
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    };
  }

  if (element.dataset.centered === "true") {
    config.centeredSlides = true;
    config.centeredSlidesBounds = true;
  }

  if (element.dataset.effect === "fade") {
    config.effect = "fade";
    config.fadeEffect = { crossFade: true };
  }

  const speed = element.dataset.speed;
  if (speed && !isNaN(Number(speed))) {
    config.speed = parseInt(speed);
  }

  return config;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSliders);
} else {
  initSliders();
}
