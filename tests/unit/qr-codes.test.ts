import { describe, expect, it } from 'vitest';
import { qrCodes, qrStartFor } from '../../src/lib/qr-codes';

const startHref = (path: string) => qrCodes[qrStartFor(path)].href;

describe('qrStartFor', () => {
  it('starts on the page’s own code', () => {
    expect(startHref('/')).toBe('/');
    expect(startHref('/links')).toBe('/links');
    expect(startHref('/join')).toBe('/join');
  });

  it('starts on the section’s code', () => {
    expect(startHref('/partners')).toBe('/partners/contact');
    expect(startHref('/partners/contact')).toBe('/partners/contact');
  });

  it('falls back to the home code', () => {
    expect(startHref('/about')).toBe('/');
    expect(startHref('/join/app')).toBe('/');
  });
});
