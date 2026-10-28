/**
 * Hero dot field: fine Sage dots tracing the outline of the logo's two overlapping squares
 * (each rotated 45°). One 2D canvas, no dependencies.
 *
 * - Dots drift on small orbits, one full cycle every ~40s.
 * - With a fine pointer, dots within 120px of the cursor ease up to 12px away from it.
 * - The loop runs only while a [data-dotfield-zone] element is on screen and the tab is visible.
 * - With reduced motion, a single static frame is drawn.
 */

interface Square {
  cx: number;
  cy: number;
  side: number;
  radius: number;
}

interface Dot {
  x: number;
  y: number;
  orbit: number;
  phase: number;
  ox: number;
  oy: number;
}

// Geometry copied from the logo SVG: rect(15,15,90,90,rx 6) about (60,60), rect(55,55,70,70,rx 6) about (90,90).
const SQUARES: readonly Square[] = [
  { cx: 60, cy: 60, side: 90, radius: 6 },
  { cx: 90, cy: 90, side: 70, radius: 6 },
];
// Bounds of both rotated squares in logo units.
const LOGO_MIN = 60 - (90 / 2) * Math.SQRT2;
const LOGO_MAX = 90 + (70 / 2) * Math.SQRT2;
const LOGO_CENTER = (LOGO_MIN + LOGO_MAX) / 2;
const LOGO_EXTENT = LOGO_MAX - LOGO_MIN;

const DRIFT_PERIOD_MS = 40_000;
const CURSOR_RADIUS = 120;
const CURSOR_PUSH = 12;
const DOT_ALPHA = 0.35;
const DOT_SIZE = 1.5;
const MIN_DOTS = 1500;
const MAX_DOTS = 4000;

/** Small deterministic PRNG so the field looks the same on every load. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Point and outward normal at distance `s` along a rounded square's perimeter (unrotated, centered at 0). */
function perimeterPoint(
  square: Square,
  s: number,
): { x: number; y: number; nx: number; ny: number } {
  const half = square.side / 2;
  const r = square.radius;
  const straight = square.side - 2 * r;
  const arc = (Math.PI / 2) * r;
  const segment = straight + arc;
  const side = Math.floor(s / segment) % 4;
  const along = s % segment;

  // Work on the top edge + top-right corner, then rotate by 90° per side.
  let x: number;
  let y: number;
  let nx: number;
  let ny: number;
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

function buildDots(count: number, scale: number, originX: number, originY: number): Dot[] {
  const random = mulberry32(0xa11a7a);
  const gaussian = (): number => {
    const u = 1 - random();
    const v = random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const perimeters = SQUARES.map((sq) => 4 * (sq.side - 2 * sq.radius) + 2 * Math.PI * sq.radius);
  const total = perimeters.reduce((a, b) => a + b, 0);
  const cos = Math.SQRT1_2;
  const band = LOGO_EXTENT * 0.012;
  const dots: Dot[] = [];

  SQUARES.forEach((square, index) => {
    const perimeter = perimeters[index] ?? 0;
    const n = Math.round((count * perimeter) / total);
    for (let i = 0; i < n; i++) {
      const p = perimeterPoint(square, random() * perimeter);
      const offset = gaussian() * band;
      const lx = p.x + p.nx * offset;
      const ly = p.y + p.ny * offset;
      // Rotate 45° about the square's center, then place relative to the logo's center.
      const ux = square.cx + (lx - ly) * cos - LOGO_CENTER;
      const uy = square.cy + (lx + ly) * cos - LOGO_CENTER;
      dots.push({
        x: originX + ux * scale,
        y: originY + uy * scale,
        orbit: 1.5 + random() * 3,
        phase: random() * Math.PI * 2,
        ox: 0,
        oy: 0,
      });
    }
  });
  return dots;
}

export function startDotField(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;
  const ctx: CanvasRenderingContext2D = context;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const color = getComputedStyle(canvas).color;

  let dots: Dot[] = [];
  let width = 0;
  let height = 0;
  let pointerX = -Infinity;
  let pointerY = -Infinity;
  let frame = 0;
  let zonesVisible = true;

  const layout = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.max(MIN_DOTS, Math.min(MAX_DOTS, Math.round((width * height) / 400)));
    const size = Math.min(width * 0.92, height * 0.82, 900);
    dots = buildDots(count, size / LOGO_EXTENT, width / 2, height / 2);
  };

  const draw = (time: number): void => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color;
    ctx.globalAlpha = DOT_ALPHA;
    const angle = (time / DRIFT_PERIOD_MS) * Math.PI * 2;
    const half = DOT_SIZE / 2;

    for (const dot of dots) {
      const x = dot.x + Math.cos(angle + dot.phase) * dot.orbit;
      const y = dot.y + Math.sin(angle + dot.phase) * dot.orbit;

      let tx = 0;
      let ty = 0;
      if (finePointer) {
        const dx = x - pointerX;
        const dy = y - pointerY;
        const distance = Math.hypot(dx, dy);
        if (distance < CURSOR_RADIUS && distance > 0.001) {
          const push = (1 - distance / CURSOR_RADIUS) * CURSOR_PUSH;
          tx = (dx / distance) * push;
          ty = (dy / distance) * push;
        }
      }
      // Ease toward the target offset so dots glide rather than jump.
      dot.ox += (tx - dot.ox) * 0.08;
      dot.oy += (ty - dot.oy) * 0.08;

      ctx.fillRect(x + dot.ox - half, y + dot.oy - half, DOT_SIZE, DOT_SIZE);
    }
  };

  const loop = (time: number): void => {
    draw(time);
    frame = requestAnimationFrame(loop);
  };

  const shouldRun = (): boolean => zonesVisible && document.visibilityState === "visible";

  const sync = (): void => {
    if (shouldRun() && frame === 0) {
      frame = requestAnimationFrame(loop);
    } else if (!shouldRun() && frame !== 0) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  layout();

  if (reducedMotion) {
    draw(0);
    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        layout();
        draw(0);
      }, 150);
    });
    return;
  }

  const zones = Array.from(document.querySelectorAll("[data-dotfield-zone]"));
  if (zones.length > 0 && "IntersectionObserver" in window) {
    const visible = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // A zone merely touching the viewport edge reports isIntersecting with a ratio of 0.
          if (entry.isIntersecting && entry.intersectionRatio > 0) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        zonesVisible = visible.size > 0;
        sync();
      },
      { threshold: [0, 0.01] },
    );
    zones.forEach((zone) => observer.observe(zone));
  }

  document.addEventListener("visibilitychange", sync);

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(layout, 150);
  });

  if (finePointer) {
    window.addEventListener(
      "pointermove",
      (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
      },
      { passive: true },
    );
    document.documentElement.addEventListener("pointerleave", () => {
      pointerX = -Infinity;
      pointerY = -Infinity;
    });
  }

  sync();
}
