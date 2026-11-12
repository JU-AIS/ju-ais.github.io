interface Node {
  ring: number;
  angle: number;
  speed: number;
  radius: number;
  size: number;
  x: number;
  y: number;
}

interface Ring {
  rx: number;
  ry: number;
  tilt: number;
}

const LINK_DISTANCE = 120;
const POINTER_RADIUS = 160;

function cssColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function startHeroCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const accent = cssColor('--color-accent');
  const light = cssColor('--color-text-on-dark');
  const primary = cssColor('--color-primary');

  let width = 0;
  let height = 0;
  let rings: Ring[] = [];
  let nodes: Node[] = [];
  let pointer = { x: -9999, y: -9999, active: false };
  let running = false;
  let visible = true;
  let frame = 0;
  let last = 0;

  function setup(): void {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const isSmall = width < 720;
    const dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    const base = Math.max(width, height) * (isSmall ? 0.62 : 0.5);
    rings = [0.35, 0.55, 0.78, 1].map((scale, i) => ({
      rx: base * scale,
      ry: base * scale * (0.38 + i * 0.04),
      tilt: -0.5 + i * 0.32,
    }));

    const count = isSmall ? 46 : 96;
    nodes = Array.from({ length: count }, () => {
      const ring = Math.floor(Math.random() * rings.length);
      return {
        ring,
        angle: Math.random() * Math.PI * 2,
        speed: (0.04 + Math.random() * 0.08) * (Math.random() < 0.5 ? -1 : 1) / (ring + 1),
        radius: 0.85 + Math.random() * 0.3,
        size: 1 + Math.random() * 2.2,
        x: 0,
        y: 0,
      };
    });
  }

  function center(): { cx: number; cy: number } {
    return width < 720 ? { cx: width * 0.6, cy: height * 0.22 } : { cx: width * 0.62, cy: height * 0.5 };
  }

  function place(node: Node, cx: number, cy: number): void {
    const ring = rings[node.ring];
    const ex = Math.cos(node.angle) * ring.rx * node.radius;
    const ey = Math.sin(node.angle) * ring.ry * node.radius;
    node.x = cx + ex * Math.cos(ring.tilt) - ey * Math.sin(ring.tilt);
    node.y = cy + ex * Math.sin(ring.tilt) + ey * Math.cos(ring.tilt);

    if (pointer.active) {
      const dx = pointer.x - node.x;
      const dy = pointer.y - node.y;
      const dist = Math.hypot(dx, dy);
      if (dist < POINTER_RADIUS) {
        const pull = (1 - dist / POINTER_RADIUS) * 0.35;
        node.x += dx * pull;
        node.y += dy * pull;
      }
    }
  }

  function drawSpark(cx: number, cy: number, time: number): void {
    const pulse = reducedMotion ? 1 : 1 + Math.sin(time * 1.6) * 0.12;
    const size = Math.min(width, height) * 0.045 * pulse;

    const glow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, size * 6);
    glow.addColorStop(0, withAlpha(accent, 0.35));
    glow.addColorStop(0.4, withAlpha(primary, 0.25));
    glow.addColorStop(1, withAlpha(primary, 0));
    ctx!.fillStyle = glow;
    ctx!.fillRect(cx - size * 6, cy - size * 6, size * 12, size * 12);

    const inner = size * 0.24;
    ctx!.beginPath();
    ctx!.moveTo(cx, cy - size);
    ctx!.quadraticCurveTo(cx + inner, cy - inner, cx + size, cy);
    ctx!.quadraticCurveTo(cx + inner, cy + inner, cx, cy + size);
    ctx!.quadraticCurveTo(cx - inner, cy + inner, cx - size, cy);
    ctx!.quadraticCurveTo(cx - inner, cy - inner, cx, cy - size);
    ctx!.fillStyle = light;
    ctx!.fill();
  }

  function draw(time: number): void {
    const { cx, cy } = center();
    ctx!.clearRect(0, 0, width, height);

    ctx!.lineWidth = 1;
    for (const ring of rings) {
      ctx!.beginPath();
      ctx!.ellipse(cx, cy, ring.rx, ring.ry, ring.tilt, 0, Math.PI * 2);
      ctx!.strokeStyle = withAlpha(accent, 0.09);
      ctx!.stroke();
    }

    for (const node of nodes) place(node, cx, cy);

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < LINK_DISTANCE) {
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.strokeStyle = withAlpha(accent, (1 - dist / LINK_DISTANCE) * 0.35);
          ctx!.stroke();
        }
      }
    }

    for (const node of nodes) {
      const near = pointer.active && Math.hypot(pointer.x - node.x, pointer.y - node.y) < POINTER_RADIUS;
      ctx!.beginPath();
      ctx!.arc(node.x, node.y, near ? node.size * 1.6 : node.size, 0, Math.PI * 2);
      ctx!.fillStyle = near ? light : withAlpha(accent, 0.85);
      ctx!.fill();
    }

    drawSpark(cx, cy, time);
  }

  function tick(now: number): void {
    if (!running) return;
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    for (const node of nodes) node.angle += node.speed * delta;
    draw(now / 1000);
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
  host.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
  });
  host.addEventListener('pointerleave', () => (pointer.active = false));

  play();
}
