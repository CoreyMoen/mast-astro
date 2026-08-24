/**
 * Accordion: animated <details>/<summary> disclosure.
 * Direct port of Mast's accordion.js, using CSS height transitions.
 */
function initAccordions() {
  const detailsElements =
    document.querySelectorAll<HTMLDetailsElement>("details");
  if (detailsElements.length === 0) return;

  // Modern browsers wrap <details> content in a ::details-content pseudo
  // with content-visibility:hidden when [open] is removed — inline styles
  // on the child can't override it. This rule keeps the pseudo visible
  // while we animate a sibling closed.
  const style = document.createElement("style");
  style.textContent =
    "details[data-accordion-animating]::details-content{content-visibility:visible!important;display:block!important;}";
  document.head.appendChild(style);

  let prefersReducedMotion = false;
  try {
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    prefersReducedMotion = reducedMotionQuery.matches;
    reducedMotionQuery.addEventListener("change", (e) => {
      prefersReducedMotion = e.matches;
    });
  } catch {
    prefersReducedMotion = false;
  }

  // Handle open attribute based on data-accordion-start-open value.
  document
    .querySelectorAll<HTMLDetailsElement>("details[open]")
    .forEach((details) => {
      if (details.getAttribute("data-accordion-start-open") !== "true") {
        details.removeAttribute("open");
      }
    });

  detailsElements.forEach((details) => {
    const summary = details.querySelector("summary");
    const content = details.querySelector<HTMLElement>(
      "[data-accordion='content']",
    );
    if (!summary || !content) return;

    if (details.getAttribute("data-accordion-start-open") !== "true") {
      content.style.height = "0px";
      content.style.overflow = "clip";
    }

    summary.addEventListener("click", (event) => {
      const isClosing = details.hasAttribute("open");

      if (isClosing) {
        event.preventDefault();

        if (prefersReducedMotion) {
          details.removeAttribute("open");
        } else {
          content.style.height = `${content.scrollHeight}px`;
          void content.offsetHeight; // force reflow
          content.style.transition = "height 0.4s ease-in-out";
          content.style.height = "0px";
          setTimeout(() => {
            details.removeAttribute("open");
            content.style.transition = "";
          }, 400);
        }
      } else {
        // When this <details> is part of an exclusive name="..." group, the
        // browser will instantly close any open sibling in the same tick.
        // Animate the sibling closed ourselves before that happens.
        const groupName = details.getAttribute("name");
        if (groupName && !prefersReducedMotion) {
          const siblings = document.querySelectorAll<HTMLDetailsElement>(
            `details[name="${groupName}"][open]`,
          );

          siblings.forEach((sib) => {
            if (sib === details) return;
            const sibContent = sib.querySelector<HTMLElement>(
              "[data-accordion='content']",
            );
            if (!sibContent) return;

            sibContent.style.height = `${sibContent.scrollHeight}px`;
            sibContent.style.overflow = "clip";
            sibContent.style.display = "block";

            // Activates the injected ::details-content CSS rule above.
            sib.dataset.accordionAnimating = "closing";

            // Force a reflow, then start the transition synchronously —
            // by the next frame the sibling's [open] is already gone.
            void sibContent.offsetHeight;

            sibContent.style.transition = "height 0.4s ease-in-out";
            sibContent.style.height = "0px";
            setTimeout(() => {
              delete sib.dataset.accordionAnimating;
              sibContent.style.transition = "";
              sibContent.style.display = "";
            }, 400);
          });
        }
      }
    });

    details.addEventListener("toggle", () => {
      if (!details.open) return;
      const fullHeight = content.scrollHeight;

      if (prefersReducedMotion) {
        content.style.height = "auto";
      } else {
        content.style.transition = "height 0.4s ease-out";
        content.style.height = `${fullHeight}px`;
        setTimeout(() => {
          content.style.height = "auto";
          content.style.transition = "";
        }, 400);
      }
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAccordions);
} else {
  initAccordions();
}
