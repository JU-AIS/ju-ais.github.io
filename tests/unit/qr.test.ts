import { describe, expect, it } from 'vitest';
import { logoInner, qrSvg } from '../../src/lib/qr';

const colors = { background: '#fff', modules: '#000', eyes: '#00f' };

describe('qr', () => {
  it('strips the outer svg and metadata from the logo', () => {
    const inner = logoInner('<svg viewBox="0 0 100 100"><metadata>secret</metadata><rect width="100"/></svg>');
    expect(inner).toBe('<rect width="100"/>');
  });

  it('draws three eyes and embeds the logo', () => {
    const { svg } = qrSvg('https://juais.se/', '<g id="logo"/>', colors);
    expect(svg.match(/stroke="#00f"/g)).toHaveLength(3);
    expect(svg).toContain('<g id="logo"/>');
  });

  it('leaves the logo area free of modules', () => {
    const { svg, logoBox } = qrSvg('https://juais.se/links', '', colors);
    const full = Number(svg.match(/viewBox="0 0 (\d+)/)![1]);
    const [from, to] = [logoBox.start * full, (logoBox.start + logoBox.size) * full];
    const dots = [...svg.matchAll(/cx="([\d.]+)" cy="([\d.]+)"/g)].map(([, x, y]) => [Number(x), Number(y)]);
    expect(dots.length).toBeGreaterThan(100);
    expect(dots.some(([x, y]) => x > from && x < to && y > from && y < to)).toBe(false);
  });
});
