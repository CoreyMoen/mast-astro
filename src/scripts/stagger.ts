/**
 * Scroll-in stagger animation for [data-animate="stagger-children"].
 * Replaces the Webflow IX3 interaction: children fade in one after
 * another the first time the element scrolls into view. Respects
 * prefers-reduced-motion (handled in CSS).
 */
export function initStaggerAnimations() {
  const elements = document.querySelectorAll<HTMLElement>('[data-animate="stagger-children"]');
  if (!elements.length) return;

  const reveal = (element: HTMLElement) => {
    Array.from(element.children).forEach((child, index) => {
      (child as HTMLElement).style.setProperty("--stagger-delay", `${0.1 + index * 0.1}s`);
    });
    element.classList.add("is-animated");
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach((element) => element.classList.add("is-animated"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -5% 0px" },
  );

  elements.forEach((element) => observer.observe(element));
}
