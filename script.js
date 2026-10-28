// Footer year.
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Portfolio cards fade up once as they scroll into view. Cards already on
// screen at load are left alone so nothing blinks out.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealTargets = document.querySelectorAll("[data-reveal]");

if (revealTargets.length && !reducedMotion && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal-visible");
        entry.target.classList.remove("reveal");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.15 },
  );

  revealTargets.forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.classList.add("reveal");
    revealObserver.observe(el);
  });
}

// Build With Us form → Web3Forms.
// Web3Forms keys are public by design: this one can only deliver to info@allorafoundry.com.
const WEB3FORMS_ACCESS_KEY = "a8199d60-b6b7-4acc-ab01-0729384bf585";

const buildForm = document.getElementById("build-form");
if (buildForm) {
  const statusEl = document.getElementById("build-form-status");
  const submitBtn = buildForm.querySelector("button[type=submit]");
  const submitLabel = submitBtn.textContent;

  const showSuccess = () => {
    buildForm.reset();
    buildForm.hidden = true;
    statusEl.textContent = "Thanks — we'll be in touch soon.";
    statusEl.className = "form-status form-status-success";
  };

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
        showSuccess();
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

      showSuccess();
    } catch (err) {
      statusEl.textContent = err.message || "Something went wrong. Please try again.";
      statusEl.className = "form-status form-status-error";
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
    }
  });
}
