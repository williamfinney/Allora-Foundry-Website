// Hero dot field: fine dots tracing the outline of the logo's two overlapping
// squares (each rotated 45°), drawn on one <canvas>. No dependencies.
//
// - Dots drift on small orbits, one full cycle every ~40s.
// - With a mouse, each dot is a small spring: a slow cursor nudges nearby dots
//   aside, a quick swipe pushes them a little further, and they spring back.
// - Drawing pauses while the canvas is off screen or the tab is hidden.
// - With reduced motion, a single still frame is drawn.

// Geometry from the logo SVG: rect(15,15,90,90, rx 6) rotated about (60,60),
// rect(55,55,70,70, rx 6) rotated about (90,90).
const SQUARES = [
  { cx: 60, cy: 60, side: 90, radius: 6 },
  { cx: 90, cy: 90, side: 70, radius: 6 },
];
const LOGO_MIN = 60 - (90 / 2) * Math.SQRT2;
const LOGO_MAX = 90 + (70 / 2) * Math.SQRT2;
const LOGO_CENTER = (LOGO_MIN + LOGO_MAX) / 2;
const LOGO_EXTENT = LOGO_MAX - LOGO_MIN;

const DRIFT_PERIOD_MS = 40000;
// Cursor physics, tuned per 60fps frame.
const CURSOR_RADIUS = 110; // px around the cursor's path that feels the push
const HOVER_FORCE = 0.12; // steady push from a resting cursor (settles ~10px away)
const SPEED_FORCE = 0.04; // extra push per px/frame of cursor speed: a swipe moves dots ~30-40px
const SPRING = 0.012; // pull back toward each dot's home
const DAMPING = 0.93; // velocity kept per frame: dots settle back in under a second
const MAX_VELOCITY = 12;
const DOT_ALPHA = 0.5;
const DOT_SIZE = 1.5;
const MIN_DOTS = 1500;
const MAX_DOTS = 4000;

/** Small seeded PRNG so the field is identical on every load. */
function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Point and outward normal at distance `s` along a rounded square's perimeter (centered at 0, unrotated). */
function perimeterPoint(square, s) {
  const half = square.side / 2;
  const r = square.radius;
  const straight = square.side - 2 * r;
  const segment = straight + (Math.PI / 2) * r;
  const side = Math.floor(s / segment) % 4;
  const along = s % segment;

  // Top edge plus the top-right corner, then rotated by 90° per side.
  let x, y, nx, ny;
  if (along < straight) {
    x = -half + r + along;
    y = -half;
    nx = 0;
    ny = -1;
  } else {
    const angle = -Math.PI / 2 + (along - straight) / r;
    nx = Math.cos(angle);
    ny = Math.sin(angle);
    x = half - r + r * nx;
    y = -half + r + r * ny;
  }
  for (let i = 0; i < side; i++) {
    [x, y] = [-y, x];
    [nx, ny] = [-ny, nx];
  }
  return { x, y, nx, ny };
}

function buildDots(count, scale, originX, originY) {
  const random = mulberry32(0xa11a7a);
  const gaussian = () => {
    const u = 1 - random();
    const v = random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const perimeters = SQUARES.map((sq) => 4 * (sq.side - 2 * sq.radius) + 2 * Math.PI * sq.radius);
  const total = perimeters[0] + perimeters[1];
  const band = LOGO_EXTENT * 0.012;
  const dots = [];

  SQUARES.forEach((square, index) => {
    const perimeter = perimeters[index];
    const n = Math.round((count * perimeter) / total);
    for (let i = 0; i < n; i++) {
      const p = perimeterPoint(square, random() * perimeter);
      const offset = gaussian() * band;
      const lx = p.x + p.nx * offset;
      const ly = p.y + p.ny * offset;
      // Rotate 45° about the square's center, then position relative to the logo's center.
      const ux = square.cx + (lx - ly) * Math.SQRT1_2 - LOGO_CENTER;
      const uy = square.cy + (lx + ly) * Math.SQRT1_2 - LOGO_CENTER;
      dots.push({
        x: originX + ux * scale,
        y: originY + uy * scale,
        orbit: 1.5 + random() * 3,
        phase: random() * Math.PI * 2,
        // Each dot takes the push slightly differently so the shape breaks into pieces.
        kick: 0.6 + random(),
        turn: (random() - 0.5) * 0.9,
        dx: 0,
        dy: 0,
        vx: 0,
        vy: 0,
      });
    }
  });
  return dots;
}

function startDotField(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const color = getComputedStyle(canvas).color;

  let dots = [];
  let width = 0;
  let height = 0;
  let pointerX = -Infinity;
  let pointerY = -Infinity;
  let pointerSpeed = 0;
  // Where the cursor was at the previous physics step: a fast swipe pushes every
  // dot along the path it swept, not just the dots near where it ended up.
  let sweepX = -Infinity;
  let sweepY = -Infinity;
  let lastTime = 0;
  let frame = 0;
  let onScreen = true;

  const layout = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.max(MIN_DOTS, Math.min(MAX_DOTS, Math.round((width * height) / 400)));
    const size = Math.min(width * 0.92, height * 0.86, 820);
    dots = buildDots(count, size / LOGO_EXTENT, width / 2, height / 2);
  };

  /** One 60fps physics step for every dot. */
  const step = (angle) => {
    const force = HOVER_FORCE + pointerSpeed * SPEED_FORCE;
    const startX = Number.isFinite(sweepX) ? sweepX : pointerX;
    const startY = Number.isFinite(sweepY) ? sweepY : pointerY;
    const segX = pointerX - startX;
    const segY = pointerY - startY;
    const segLength2 = segX * segX + segY * segY;
    for (const dot of dots) {
      if (finePointer && Number.isFinite(pointerX)) {
        const x = dot.x + Math.cos(angle + dot.phase) * dot.orbit + dot.dx;
        const y = dot.y + Math.sin(angle + dot.phase) * dot.orbit + dot.dy;
        // Closest point on the cursor's path since the last step.
        const t =
          segLength2 > 0
            ? Math.max(0, Math.min(1, ((x - startX) * segX + (y - startY) * segY) / segLength2))
            : 1;
        const ax = x - (startX + segX * t);
        const ay = y - (startY + segY * t);
        const distance = Math.hypot(ax, ay);
        if (distance < CURSOR_RADIUS && distance > 0.001) {
          const push = (1 - distance / CURSOR_RADIUS) * force * dot.kick;
          // Push away from the cursor, bent slightly per dot so the burst looks irregular.
          const ux = ax / distance;
          const uy = ay / distance;
          const cos = Math.cos(dot.turn);
          const sin = Math.sin(dot.turn);
          dot.vx += (ux * cos - uy * sin) * push;
          dot.vy += (ux * sin + uy * cos) * push;
        }
      }
      dot.vx = (dot.vx - dot.dx * SPRING) * DAMPING;
      dot.vy = (dot.vy - dot.dy * SPRING) * DAMPING;
      dot.vx = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, dot.vx));
      dot.vy = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, dot.vy));
      dot.dx += dot.vx;
      dot.dy += dot.vy;
    }
    pointerSpeed *= 0.8;
    sweepX = pointerX;
    sweepY = pointerY;
  };

  const draw = (time) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color;
    ctx.globalAlpha = DOT_ALPHA;
    const angle = (time / DRIFT_PERIOD_MS) * Math.PI * 2;
    const half = DOT_SIZE / 2;

    for (const dot of dots) {
      const x = dot.x + Math.cos(angle + dot.phase) * dot.orbit + dot.dx;
      const y = dot.y + Math.sin(angle + dot.phase) * dot.orbit + dot.dy;
      ctx.fillRect(x - half, y - half, DOT_SIZE, DOT_SIZE);
    }
  };

  const loop = (time) => {
    // Fixed 60fps physics steps, so 120Hz screens and dropped frames behave the same.
    const steps = lastTime ? Math.min(4, Math.max(1, Math.round((time - lastTime) / 16.67))) : 1;
    lastTime = time;
    const angle = (time / DRIFT_PERIOD_MS) * Math.PI * 2;
    for (let i = 0; i < steps; i++) step(angle);
    draw(time);
    frame = requestAnimationFrame(loop);
  };

  const sync = () => {
    const shouldRun = onScreen && document.visibilityState === "visible";
    if (shouldRun && frame === 0) {
      frame = requestAnimationFrame(loop);
    } else if (!shouldRun && frame !== 0) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    }
  };

  let resizeTimer = 0;
  const onResize = (redraw) => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      layout();
      if (redraw) draw(0);
    }, 150);
  };

  layout();

  if (reducedMotion) {
    draw(0);
    window.addEventListener("resize", () => onResize(true));
    return;
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting && entry.intersectionRatio > 0;
        sync();
      },
      { threshold: [0, 0.01] },
    ).observe(canvas);
  }

  document.addEventListener("visibilitychange", sync);
  window.addEventListener("resize", () => onResize(false));

  if (finePointer) {
    window.addEventListener(
      "pointermove",
      (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (Number.isFinite(pointerX)) {
          pointerSpeed = Math.max(pointerSpeed, Math.min(60, Math.hypot(x - pointerX, y - pointerY)));
        }
        pointerX = x;
        pointerY = y;
      },
      { passive: true },
    );
    document.documentElement.addEventListener("pointerleave", () => {
      pointerX = -Infinity;
      pointerY = -Infinity;
      sweepX = -Infinity;
      sweepY = -Infinity;
    });
  }

  sync();
}

const canvas = document.querySelector("[data-dotfield]");
if (canvas instanceof HTMLCanvasElement) startDotField(canvas);
