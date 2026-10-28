/**
 * Page-level behavior shared by every page:
 * - section reveals (once per element, at 15% visibility)
 * - header state: solid once the hero has scrolled away, inverted over the Forest section
 * - page background switches to Forest while the studio section holds the middle of the screen
 */

const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setUpReveals(): void {
  if (reducedMotion || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("reveal-in");
        entry.target.classList.remove("reveal-pending");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.15 },
  );

  for (const element of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
    // Only hide what starts below the fold, so nothing already on screen blinks out.
    if (element.getBoundingClientRect().top < window.innerHeight) continue;
    element.classList.add("reveal-pending");
    observer.observe(element);
  }
}

function setUpScrollState(): void {
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  const forest = document.querySelector<HTMLElement>("[data-forest]");
  if (!hero && !forest) return;

  const header = document.querySelector<HTMLElement>(".site-header");
  let queued = false;

  const update = (): void => {
    queued = false;
    const headerHeight = header?.offsetHeight ?? 0;
    const viewportMiddle = window.innerHeight / 2;

    if (hero) {
      root.classList.toggle("is-scrolled", hero.getBoundingClientRect().bottom <= headerHeight);
    }
    if (forest) {
      const rect = forest.getBoundingClientRect();
      const headerLine = headerHeight / 2;
      root.classList.toggle("header-on-forest", rect.top <= headerLine && rect.bottom > headerLine);
      root.classList.toggle(
        "is-forest",
        rect.top <= viewportMiddle && rect.bottom > viewportMiddle,
      );
    }
  };

  const queue = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue, { passive: true });
  update();
}

setUpReveals();
setUpScrollState();
