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
    if (hash === "#top") {
      smoothScrollTo(0, 900);
    } else {
      scrollToTarget(target);
    }
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

// Web3Forms keys are public by design: this one can only deliver to info@allorafoundry.com.
const WEB3FORMS_ACCESS_KEY = "a8199d60-b6b7-4acc-ab01-0729384bf585";

const buildForm = document.getElementById("build-form");
if (buildForm) {
  const statusEl = document.getElementById("build-form-status");
  const submitBtn = buildForm.querySelector("button[type=submit]");

  buildForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(buildForm);
    const data = Object.fromEntries(formData.entries());
    const helpNeeded = formData.getAll("Help needed");
    if (helpNeeded.length) data["Help needed"] = helpNeeded.join(", ");
    delete data.botcheck;
    data.access_key = WEB3FORMS_ACCESS_KEY;
    data.subject = "New Build With Us submission";

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    statusEl.textContent = "";
    statusEl.className = "form-status";

    try {
      // Honeypot tripped: show success without sending anything, so bots learn nothing.
      if (buildForm.botcheck.checked) {
        buildForm.reset();
        buildForm.hidden = true;
        statusEl.textContent = "Thanks — we'll be in touch soon.";
        statusEl.className = "form-status form-status-success";
        return;
      }

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Something went wrong. Please try again.");
      }

      buildForm.reset();
      buildForm.hidden = true;
      statusEl.textContent = "Thanks — we'll be in touch soon.";
      statusEl.className = "form-status form-status-success";
    } catch (err) {
      statusEl.textContent = err.message || "Something went wrong. Please try again.";
      statusEl.className = "form-status form-status-error";
      submitBtn.disabled = false;
      submitBtn.textContent = "Send";
    }
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
