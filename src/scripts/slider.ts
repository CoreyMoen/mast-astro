/**
 * Slider: dependency-free carousel engine.
 *
 * Native scroll + CSS scroll snap does the movement (touch, momentum,
 * snapping — and it works before/without JavaScript); this module adds
 * arrows, pagination, autoplay, loop, keyboard support, mouse dragging,
 * ARIA, and the fade effect. Slide sizing lives entirely in CSS, so the
 * engine measures geometry instead of duplicating breakpoints.
 *
 * Same data-attribute API as the Swiper-based Mast slider:
 * data-loop, data-autoplay (ms), data-effect="fade", data-speed (ms),
 * data-centered, data-grab-cursor, data-slider-overflow,
 * data-loop-additional-slides, and the --lg/--md/--sm/--xs/--gap vars.
 */

interface SliderControls {
  /**
   * Page count, recomputed on call so it tracks breakpoint changes.
   * Loop engines report an unbounded range via a negative count.
   */
  count: () => number;
  current: () => number;
  goTo: (index: number, instant?: boolean) => void;
  next: () => void;
  prev: () => void;
}

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initSliders() {
  document
    .querySelectorAll<HTMLElement>('[data-slider="slider"]')
    .forEach((el) => {
      if (!el.dataset.sliderReady) {
        el.dataset.sliderReady = "true";
        createSlider(el);
      }
    });
}

function createSlider(el: HTMLElement) {
  const wrapper = el.querySelector<HTMLElement>(".swiper-wrapper");
  if (!wrapper) return;
  const slides = Array.from(
    wrapper.querySelectorAll<HTMLElement>(".swiper-slide"),
  );
  if (slides.length === 0) return;

  const component = el.closest<HTMLElement>('[data-slider="component"]') ?? el;
  const speed = parseInt(el.dataset.speed ?? "") || 300;
  const autoplayDelay = parseInt(el.dataset.autoplay ?? "") || 0;
  const isFade = el.dataset.effect === "fade";
  el.style.setProperty("--slider-speed", `${speed}ms`);

  setupA11y(el, slides);

  const controls = isFade
    ? createFadeEngine(el, slides)
    : createScrollEngine(el, wrapper, slides);
  if (!controls) return;

  setupNav(component, controls);
  setupPagination(component, wrapper, controls);
  setupKeyboard(el, controls);
  if (autoplayDelay > 0 && !reducedMotion()) {
    setupAutoplay(el, wrapper, controls, autoplayDelay);
  }
}

/* ---- Shared chrome ---- */

function setupA11y(el: HTMLElement, slides: HTMLElement[]) {
  el.setAttribute("role", "region");
  el.setAttribute("aria-roledescription", "carousel");
  if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", "Slider");
  slides.forEach((slide, i) => {
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", `${i + 1} of ${slides.length}`);
  });
}

function setupNav(component: HTMLElement, controls: SliderControls) {
  const prevEl = component.querySelector<HTMLButtonElement>(
    '[data-slider="previous"]',
  );
  const nextEl = component.querySelector<HTMLButtonElement>(
    '[data-slider="next"]',
  );
  prevEl?.addEventListener("click", () => controls.prev());
  nextEl?.addEventListener("click", () => controls.next());

  const update = () => {
    const count = controls.count();
    const current = controls.current();
    const bounded = count > 0;
    const atStart = bounded && current <= 0;
    const atEnd = bounded && current >= count - 1;
    prevEl?.classList.toggle("swiper-button-disabled", atStart);
    nextEl?.classList.toggle("swiper-button-disabled", atEnd);
    prevEl?.toggleAttribute("disabled", atStart);
    nextEl?.toggleAttribute("disabled", atEnd);
  };
  component.addEventListener("mast-slider:change", update);
  update();
}

function setupPagination(
  component: HTMLElement,
  wrapper: HTMLElement,
  controls: SliderControls,
) {
  const paginationEl = component.querySelector<HTMLElement>(
    '[data-slider="pagination"]',
  );
  if (!paginationEl) return;

  // Autoplay may later switch this to "off" while its timer runs.
  if (!wrapper.hasAttribute("aria-live")) {
    wrapper.setAttribute("aria-live", "polite");
  }

  let bullets: HTMLButtonElement[] = [];
  const render = (pageCount: number) => {
    paginationEl.innerHTML = "";
    bullets = [];
    for (let i = 0; i < pageCount; i++) {
      const bullet = document.createElement("button");
      bullet.type = "button";
      bullet.className = "slider-pagination_button";
      bullet.setAttribute("aria-label", `Go to slide ${i + 1}`);
      bullet.addEventListener("click", () => controls.goTo(i));
      paginationEl.appendChild(bullet);
      bullets.push(bullet);
    }
  };

  const update = () => {
    // Page count changes with the responsive slides-per-view, so the
    // bullets are rebuilt whenever a resize changes it.
    const pageCount = Math.abs(controls.count());
    if (pageCount !== bullets.length) render(pageCount);
    const active = ((controls.current() % pageCount) + pageCount) % pageCount;
    bullets.forEach((bullet, i) => {
      bullet.classList.toggle("cc-active", i === active);
      if (i === active) {
        bullet.setAttribute("aria-current", "true");
      } else {
        bullet.removeAttribute("aria-current");
      }
    });
  };
  component.addEventListener("mast-slider:change", update);
  update();
}

function setupKeyboard(el: HTMLElement, controls: SliderControls) {
  if (el.tabIndex < 0) el.tabIndex = 0;
  el.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      controls.prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      controls.next();
    }
  });
}

function setupAutoplay(
  el: HTMLElement,
  wrapper: HTMLElement,
  controls: SliderControls,
  delay: number,
) {
  let timer: ReturnType<typeof setInterval> | null = null;
  let hovered = false;
  let inView = true;

  // Autoplaying content shouldn't chatter at screen readers.
  const setLive = () =>
    wrapper.setAttribute("aria-live", timer ? "off" : "polite");

  const advance = () => {
    // Bounded sliders rewind to the start; looping ones keep going.
    const count = controls.count();
    if (count > 0 && controls.current() >= count - 1) {
      controls.goTo(0);
    } else {
      controls.next();
    }
  };
  const start = () => {
    if (timer || hovered || !inView || document.hidden) return;
    timer = setInterval(advance, delay);
    setLive();
  };
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
    setLive();
  };
  const restart = () => {
    stop();
    start();
  };

  el.addEventListener("mouseenter", () => {
    hovered = true;
    stop();
  });
  el.addEventListener("mouseleave", () => {
    hovered = false;
    start();
  });
  // Pause while a keyboard user is interacting with the slider.
  el.addEventListener("focusin", () => {
    hovered = true;
    stop();
  });
  el.addEventListener("focusout", (e) => {
    if (e.relatedTarget instanceof Node && el.contains(e.relatedTarget)) return;
    hovered = false;
    start();
  });
  // Reset the interval when navigation happens manually.
  el.closest('[data-slider="component"]')?.addEventListener(
    "mast-slider:change",
    () => {
      if (timer) restart();
    },
  );

  new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        inView = entry.isIntersecting;
        if (inView) {
          start();
        } else {
          stop();
        }
      });
    },
    { threshold: 0.5 },
  ).observe(el);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  start();
}

function emitChange(el: HTMLElement) {
  el.dispatchEvent(new CustomEvent("mast-slider:change", { bubbles: true }));
}

/* ---- Scroll engine (default) ---- */

function createScrollEngine(
  el: HTMLElement,
  wrapper: HTMLElement,
  realSlides: HTMLElement[],
): SliderControls | null {
  const loop = el.dataset.loop === "true";
  const centered = el.dataset.centered === "true";
  const speed = parseInt(el.dataset.speed ?? "") || 300;
  const realCount = realSlides.length;

  // Loop: clone enough slides on each side to fill the widest view.
  let leadingClones = 0;
  if (loop) {
    const styles = getComputedStyle(
      el.closest('[data-slider="component"]') ?? el,
    );
    const maxPerView = Math.max(
      ...["--xs", "--sm", "--md", "--lg"].map(
        (v) => parseFloat(styles.getPropertyValue(v)) || 1,
      ),
    );
    const extra = parseInt(el.dataset.loopAdditionalSlides ?? "") || 0;
    leadingClones = Math.min(realCount, Math.ceil(maxPerView) + extra);
    for (let i = 0; i < leadingClones; i++) {
      const head = cloneSlide(realSlides[i]!);
      const tail = cloneSlide(realSlides[realCount - 1 - i]!);
      wrapper.appendChild(head);
      wrapper.insertBefore(tail, wrapper.firstChild);
    }
  }

  const allSlides = () =>
    Array.from(wrapper.querySelectorAll<HTMLElement>(".swiper-slide"));

  const maxScroll = () => el.scrollWidth - el.clientWidth;

  // Exact snap positions: each slide's scrollLeft when aligned to the
  // snapport (the scrollport inset by scroll-padding; slide centers to
  // scrollport center in data-centered mode). Measuring real geometry
  // keeps this correct under the overflow-bleed padding. Positions are
  // scroll-invariant, so they're cached for the current frame — scroll
  // events would otherwise trigger a full rect pass per listener.
  let positionsCache: number[] | null = null;
  const positions = () => {
    if (positionsCache) return positionsCache;
    const rect = el.getBoundingClientRect();
    const max = maxScroll();
    let place: (s: DOMRect) => number;
    if (centered) {
      const center = rect.left + el.clientWidth / 2;
      place = (s) => s.left + s.width / 2 - center;
    } else {
      const origin =
        rect.left + (parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0);
      place = (s) => s.left - origin;
    }
    positionsCache = allSlides().map((s) =>
      Math.max(
        0,
        Math.min(el.scrollLeft + place(s.getBoundingClientRect()), max),
      ),
    );
    requestAnimationFrame(() => {
      positionsCache = null;
    });
    return positionsCache;
  };
  const nearestIndex = (scrollLeft: number) => {
    const pos = positions();
    let best = 0;
    pos.forEach((p, i) => {
      if (Math.abs(p - scrollLeft) < Math.abs(pos[best]! - scrollLeft))
        best = i;
    });
    return best;
  };

  // In loop mode every real index maps to a slide offset by the clones;
  // otherwise pages are the distinct reachable snap positions.
  const pageCount = () => {
    if (loop) return realCount;
    const pos = positions();
    return Math.max(
      1,
      pos.filter((p, i) => i === 0 || p - pos[i - 1]! > 1).length,
    );
  };

  const currentIndex = () => {
    const raw = nearestIndex(el.scrollLeft);
    return loop ? raw - leadingClones : raw;
  };

  let animation: number | null = null;
  const scrollTo = (target: number, instant: boolean) => {
    if (animation) cancelAnimationFrame(animation);
    target = Math.max(0, Math.min(target, maxScroll()));
    if (instant || reducedMotion()) {
      el.classList.add("cc-free-scroll");
      el.scrollLeft = target;
      requestAnimationFrame(() => el.classList.remove("cc-free-scroll"));
      return;
    }
    const from = el.scrollLeft;
    const startTime = performance.now();
    el.classList.add("cc-free-scroll");
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / speed);
      const ease = 1 - Math.pow(1 - t, 3);
      el.scrollLeft = from + (target - from) * ease;
      if (t < 1) {
        animation = requestAnimationFrame(tick);
      } else {
        animation = null;
        el.classList.remove("cc-free-scroll");
      }
    };
    animation = requestAnimationFrame(tick);
  };

  const goTo = (index: number, instant = false) => {
    const pos = positions();
    if (loop) {
      // Get out of the clone zone first so indices are unambiguous.
      settleLoop(true);
      const cur = currentIndex();
      // A neighbor step may run one slide into the clone zone (the
      // settle handler teleports back invisibly); farther jumps land
      // directly on the real slide.
      const target =
        index === cur + 1 || index === cur - 1
          ? index
          : ((index % realCount) + realCount) % realCount;
      scrollTo(pos[leadingClones + target] ?? 0, instant);
    } else {
      scrollTo(pos[Math.max(0, Math.min(index, pos.length - 1))] ?? 0, instant);
    }
  };

  // When the scroller rests inside the clone zone, jump silently to the
  // matching real slide (identical pixels, so the jump is invisible).
  const settleLoop = (force = false) => {
    if (!loop) return;
    if (animation && !force) return;
    // Never teleport under an active mouse drag — the drag math would
    // resume from a stale origin and double-jump. The release handler's
    // snap re-triggers settling once the pointer is up.
    if (el.classList.contains("cc-dragging")) return;
    const idx = currentIndex();
    if (idx < 0 || idx >= realCount) {
      const bounded = ((idx % realCount) + realCount) % realCount;
      el.classList.add("cc-free-scroll");
      el.scrollLeft = positions()[leadingClones + bounded] ?? 0;
      requestAnimationFrame(() => el.classList.remove("cc-free-scroll"));
    }
  };

  // Settle handler: debounced scroll (scrollend where available).
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  const onSettle = () => {
    settleLoop();
    emitChange(el);
  };
  el.addEventListener("scroll", () => {
    emitChange(el);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(onSettle, 150);
  });
  if ("onscrollend" in el) {
    el.addEventListener("scrollend", onSettle);
  }

  // Mouse dragging (touch swiping is native scrolling already).
  if (el.dataset.grabCursor !== "false") {
    setupMouseDrag(el, () => {
      // Snap to the nearest slide; the settle handler resolves clones.
      scrollTo(positions()[nearestIndex(el.scrollLeft)] ?? 0, false);
    });
  }

  // Hide the chrome when everything already fits.
  const applyOverflow = () => {
    const component = el.closest<HTMLElement>('[data-slider="component"]');
    const fits = maxScroll() <= 1;
    component
      ?.querySelectorAll<HTMLElement>(".slider-nav, .slider-pagination")
      .forEach((nav) => {
        nav.style.display = fits ? "none" : "";
      });
  };

  // Re-align to the nearest snap position when the layout resizes.
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      applyOverflow();
      settleLoop(true);
      emitChange(el);
    }, 150);
  }).observe(el);

  if (loop) {
    // Start on the first real slide.
    el.classList.add("cc-free-scroll");
    el.scrollLeft = positions()[leadingClones] ?? 0;
    requestAnimationFrame(() => el.classList.remove("cc-free-scroll"));
  }
  applyOverflow();
  emitChange(el);

  return {
    count: () => (loop ? -realCount : pageCount()),
    current: currentIndex,
    goTo,
    next: () => goTo(currentIndex() + 1),
    prev: () => goTo(currentIndex() - 1),
  };
}

function cloneSlide(slide: HTMLElement): HTMLElement {
  const clone = slide.cloneNode(true) as HTMLElement;
  clone.setAttribute("aria-hidden", "true");
  clone.setAttribute("data-clone", "");
  clone.removeAttribute("role");
  clone.inert = true;
  return clone;
}

function setupMouseDrag(el: HTMLElement, onRelease: () => void) {
  let startX = 0;
  let startScroll = 0;
  let dragging = false;
  let moved = false;

  el.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    // Stop text selection and native image/link dragging from stealing
    // the gesture.
    e.preventDefault();
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = el.scrollLeft;
    el.classList.add("cc-dragging", "cc-free-scroll");
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener("dragstart", (e) => {
    if (dragging) e.preventDefault();
  });
  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5) moved = true;
    el.scrollLeft = startScroll - dx;
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove("cc-dragging", "cc-free-scroll");
    if (moved) {
      // Swallow the click that follows a drag so links don't fire.
      el.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
        },
        { capture: true, once: true },
      );
    }
    // Always snap on release: settling is suppressed during the drag,
    // so even a held-in-place pointer needs a resolution pass.
    onRelease();
  };
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);
}

/* ---- Fade engine ---- */

function createFadeEngine(
  el: HTMLElement,
  slides: HTMLElement[],
): SliderControls {
  const loop = el.dataset.loop === "true";
  let index = 0;

  const apply = () => {
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle("cc-active-slide", active);
      slide.setAttribute("aria-hidden", String(!active));
      // aria-hidden content must also leave the tab order.
      slide.inert = !active;
    });
    emitChange(el);
  };

  const goTo = (next: number, instant = false) => {
    if (loop) {
      index = ((next % slides.length) + slides.length) % slides.length;
    } else {
      index = Math.max(0, Math.min(next, slides.length - 1));
    }
    if (instant || reducedMotion()) {
      // Suppress the opacity transition for this change.
      slides.forEach((s) => (s.style.transition = "none"));
      requestAnimationFrame(() =>
        slides.forEach((s) => (s.style.transition = "")),
      );
    }
    apply();
  };

  // Pointer swipes (no native scrolling in fade mode).
  let startX: number | null = null;
  el.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
  });
  el.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1));
  });
  el.style.touchAction = "pan-y";

  apply();

  return {
    count: () => (loop ? -slides.length : slides.length),
    current: () => index,
    goTo,
    next: () => goTo(index + 1),
    prev: () => goTo(index - 1),
  };
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSliders);
} else {
  initSliders();
}
