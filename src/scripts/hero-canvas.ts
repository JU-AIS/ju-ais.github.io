interface Dot {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  glow: number;
}

interface Ripple {
  x: number;
  y: number;
  start: number;
}

const POINTER_RADIUS = 140;
const RIPPLE_SPEED = 520;
const RIPPLE_LIFE = 2.2;
const SPRING = 90;
const DAMPING = 9;

function cssColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function toRgb(hex: string): string {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)).join(', ');
}

export function startHeroCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rgb = toRgb(cssColor('--color-text-on-dark'));

  let width = 0;
  let height = 0;
  let dots: Dot[] = [];
  let ripples: Ripple[] = [];
  const pointer = { x: 0, y: 0, active: false };
  let lastInput = 0;
  let running = false;
  let visible = true;
  let frame = 0;
  let last = 0;

  function setup(): void {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, width < 720 ? 1.5 : 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    const gap = width < 720 ? 24 : 28;
    const cols = Math.ceil(width / gap) + 1;
    const rows = Math.ceil(height / gap) + 1;
    const offsetX = (width - (cols - 1) * gap) / 2;
    const offsetY = (height - (rows - 1) * gap) / 2;
    dots = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = offsetX + col * gap;
        const y = offsetY + row * gap;
        dots.push({ homeX: x, homeY: y, x, y, vx: 0, vy: 0, glow: 0 });
      }
    }
  }

  function step(delta: number, time: number): void {
    ripples = ripples.filter((r) => time - r.start < RIPPLE_LIFE);

    for (const dot of dots) {
      let fx = (dot.homeX - dot.x) * SPRING - dot.vx * DAMPING;
      let fy = (dot.homeY - dot.y) * SPRING - dot.vy * DAMPING;
      let excite = 0;

      if (pointer.active) {
        const dx = dot.homeX - pointer.x;
        const dy = dot.homeY - pointer.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < POINTER_RADIUS) {
          const force = (1 - dist / POINTER_RADIUS) ** 2;
          fx += (dx / dist) * force * 2600;
          fy += (dy / dist) * force * 2600;
          excite = Math.max(excite, force);
        }
      }

      for (const ripple of ripples) {
        const age = time - ripple.start;
        const dx = dot.homeX - ripple.x;
        const dy = dot.homeY - ripple.y;
        const dist = Math.hypot(dx, dy) || 1;
        const front = Math.exp(-(((dist - age * RIPPLE_SPEED) / 26) ** 2)) * (1 - age / RIPPLE_LIFE);
        if (front > 0.01) {
          fx += (dx / dist) * front * 3200;
          fy += (dy / dist) * front * 3200;
          excite = Math.max(excite, front);
        }
      }

      dot.vx += fx * delta;
      dot.vy += fy * delta;
      dot.x += dot.vx * delta;
      dot.y += dot.vy * delta;
      dot.glow += (excite - dot.glow) * Math.min(delta * 10, 1);
    }
  }

  function draw(time: number): void {
    ctx!.clearRect(0, 0, width, height);
    for (const dot of dots) {
      // A slow diagonal wave of light keeps the grid alive when nobody touches it.
      const wave = 0.5 + 0.5 * Math.sin(dot.homeX * 0.006 + dot.homeY * 0.004 - time * 0.8);
      const alpha = 0.16 + wave * 0.2 + dot.glow * 0.7;
      const radius = 1.1 + dot.glow * 1.6;
      ctx!.fillStyle = `rgba(${rgb}, ${alpha})`;
      ctx!.beginPath();
      ctx!.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
      ctx!.fill();
    }
  }

  function addRipple(x: number, y: number): void {
    ripples.push({ x, y, start: performance.now() / 1000 });
  }

  function tick(now: number): void {
    if (!running) return;
    const delta = Math.min((now - last) / 1000, 0.033);
    last = now;
    const time = now / 1000;
    if (time - lastInput > 4.5) {
      addRipple(width * (0.5 + Math.random() * 0.45), height * (0.2 + Math.random() * 0.6));
      lastInput = time;
    }
    step(delta, time);
    draw(time);
    frame = requestAnimationFrame(tick);
  }

  function play(): void {
    if (running || reducedMotion || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function pause(): void {
    running = false;
    cancelAnimationFrame(frame);
  }

  setup();
  draw(0);

  if (reducedMotion) {
    window.addEventListener('resize', () => { setup(); draw(0); });
    return;
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? play() : pause();
  }).observe(canvas);

  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(setup, 150);
  });

  const host = canvas.parentElement!;
  const toLocal = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  host.addEventListener('pointermove', (e) => {
    Object.assign(pointer, toLocal(e), { active: true });
    lastInput = performance.now() / 1000;
  });
  host.addEventListener('pointerleave', () => (pointer.active = false));
  host.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    const { x, y } = toLocal(e);
    addRipple(x, y);
    lastInput = performance.now() / 1000;
  });

  play();
}
