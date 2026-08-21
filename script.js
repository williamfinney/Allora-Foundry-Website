document.getElementById("year").textContent = new Date().getFullYear();

function linear(t) {
  return t;
}

function smoothScrollTo(targetY, duration) {
  const startY = window.pageYOffset;
  const distance = targetY - startY;
  const startTime = performance.now();

  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, startY + distance * linear(progress));
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      root.style.scrollBehavior = previousScrollBehavior;
    }
  }
  requestAnimationFrame(step);
}

function scrollToTarget(target) {
  const header = document.querySelector(".site-header");
  const headerHeight = header ? header.offsetHeight : 0;
  const rect = target.getBoundingClientRect();
  const absoluteTop = rect.top + window.pageYOffset;
  const viewportHeight = window.innerHeight;
  const availableHeight = viewportHeight - headerHeight;
  const centeringOffset = Math.max(0, (availableHeight - rect.height) / 2);
  const extraScroll = 75;
  const targetY = absoluteTop - headerHeight - centeringOffset + extraScroll;
  smoothScrollTo(Math.max(0, targetY), 900);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const hash = link.getAttribute("href");
  if (hash.length < 2) return;
  const target = document.querySelector(hash);
  if (!target) return;
  link.addEventListener("click", (e) => {
    e.preventDefault();
    scrollToTarget(target);
    history.pushState(null, "", hash);
  });
});

const navToggle = document.getElementById("nav-toggle");
const mainNav = document.getElementById("main-nav");

navToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", isOpen);
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const revealTargets = document.querySelectorAll("#what-we-do .card");
if (revealTargets.length && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = `${index * 80}ms`;
          entry.target.classList.add("reveal-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => {
    el.classList.add("reveal");
    revealObserver.observe(el);
  });
}

const modeToggleBtns = document.querySelectorAll(".mode-toggle-btn");
modeToggleBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    modeToggleBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".toggle-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === btn.dataset.target);
    });
  });
});
