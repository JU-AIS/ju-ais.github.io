interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  depth: number;
  alpha: number;
}

const POINTER_RADIUS = 180;
const BASE_SPEED = 18;

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
  let particles: Particle[] = [];
  const pointer = { x: 0, y: 0, vx: 0, vy: 0, active: false };
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
    ctx!.lineCap = 'round';

    const count = Math.round(Math.min(700, (width * height) / 2200));
    particles = Array.from({ length: count }, () => {
      const depth = 0.3 + Math.random() * 0.7;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        depth,
        alpha: (0.15 + Math.random() * 0.45) * depth,
      };
    });
  }

  // Smooth, slowly shifting current that every particle drifts along.
  function flowAngle(x: number, y: number, time: number): number {
    return Math.sin(x * 0.0025 + time * 0.15) * Math.cos(y * 0.003 - time * 0.1) * Math.PI - Math.PI / 2.4;
  }

  function step(delta: number, time: number): void {
    for (const p of particles) {
      const angle = flowAngle(p.x, p.y, time);
      const speed = BASE_SPEED * p.depth;
      p.vx += (Math.cos(angle) * speed - p.vx) * 0.02;
      p.vy += (Math.sin(angle) * speed - p.vy) * 0.02;

      if (pointer.active) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < POINTER_RADIUS) {
          const force = (1 - dist / POINTER_RADIUS) ** 2;
          // Swirl around the cursor, push away a little and get dragged along with its movement.
          p.vx += (-dy / dist * 140 + dx / dist * 60) * force * delta * p.depth;
          p.vy += (dx / dist * 140 + dy / dist * 60) * force * delta * p.depth;
          p.vx += pointer.vx * force * 1.2;
          p.vy += pointer.vy * force * 1.2;
        }
      }

      p.x += p.vx * delta;
      p.y += p.vy * delta;

      if (p.x < -10) p.x += width + 20;
      else if (p.x > width + 10) p.x -= width + 20;
      if (p.y < -10) p.y += height + 20;
      else if (p.y > height + 10) p.y -= height + 20;
    }
    pointer.vx *= 0.85;
    pointer.vy *= 0.85;
  }

  function draw(): void {
    ctx!.clearRect(0, 0, width, height);
    for (const p of particles) {
      const speed = Math.hypot(p.vx, p.vy);
      const tail = Math.min(speed * 0.12, 18);
      const glow = Math.min(speed / 120, 0.5);
      ctx!.strokeStyle = `rgba(${rgb}, ${Math.min(p.alpha + glow, 0.9)})`;
      ctx!.lineWidth = 0.8 + p.depth * 2.2;
      ctx!.beginPath();
      ctx!.moveTo(p.x - (p.vx / (speed || 1)) * tail, p.y - (p.vy / (speed || 1)) * tail);
      ctx!.lineTo(p.x + 0.01, p.y);
      ctx!.stroke();
    }
  }

  function ripple(x: number, y: number): void {
    for (const p of particles) {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 260) {
        const force = (1 - dist / 260) * 220 * p.depth;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
    }
  }

  function tick(now: number): void {
    if (!running) return;
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    step(delta, now / 1000);
    draw();
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
  draw();

  if (reducedMotion) {
    window.addEventListener('resize', () => { setup(); draw(); });
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
  host.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (pointer.active) {
      pointer.vx = x - pointer.x;
      pointer.vy = y - pointer.y;
    }
    Object.assign(pointer, { x, y, active: true });
  });
  host.addEventListener('pointerleave', () => (pointer.active = false));
  host.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    const rect = canvas.getBoundingClientRect();
    ripple(e.clientX - rect.left, e.clientY - rect.top);
  });

  play();
}
