import QRCode from 'qrcode';

export interface QrColors {
  background: string;
  modules: string;
  eyes: string;
}

const MARGIN = 3;
const EYE = 7;
// H tolerates ~30 % damage; the logo covers well under that.
const LOGO_SHARE = 0.24;
// Matches --radius-logo in theme.css, so the static logo has the same corners as on the site.
const LOGO_RADIUS = 0.22;

const isEye = (row: number, col: number, size: number) =>
  (row < EYE && col < EYE) || (row < EYE && col >= size - EYE) || (row >= size - EYE && col < EYE);

const eye = (x: number, y: number, color: string) =>
  `<rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" rx="1.8" fill="none" stroke="${color}" stroke-width="1"/>` +
  `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.9" fill="${color}"/>`;

/** Returns the logo's inner SVG markup (without the outer <svg> and any metadata), assuming a 0 0 100 100 viewBox. */
export function logoInner(logoSvg: string): string {
  return logoSvg
    .replace(/<metadata>[\s\S]*?<\/metadata>/, '')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
}

export function qrSvg(text: string, logo: string, colors: QrColors) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'H' });
  const size = modules.size;
  const full = size + MARGIN * 2;

  let hole = Math.round(size * LOGO_SHARE);
  if (hole % 2 !== size % 2) hole += 1;
  const holeStart = (size - hole) / 2;
  const inHole = (row: number, col: number) =>
    row >= holeStart && row < holeStart + hole && col >= holeStart && col < holeStart + hole;

  const dots: string[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!modules.get(row, col) || isEye(row, col, size) || inHole(row, col)) continue;
      dots.push(`<circle cx="${col + MARGIN + 0.5}" cy="${row + MARGIN + 0.5}" r="0.46"/>`);
    }
  }

  const far = MARGIN + size - EYE;
  const logoInset = 0.6;
  const logoAt = MARGIN + holeStart + logoInset;
  const logoSize = hole - logoInset * 2;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${full} ${full}" width="1024" height="1024" shape-rendering="geometricPrecision">` +
    `<rect width="${full}" height="${full}" rx="${full * 0.06}" fill="${colors.background}"/>` +
    `<g fill="${colors.modules}">${dots.join('')}</g>` +
    eye(MARGIN, MARGIN, colors.eyes) +
    eye(far, MARGIN, colors.eyes) +
    eye(MARGIN, far, colors.eyes) +
    `<clipPath id="qr-logo"><rect x="${logoAt}" y="${logoAt}" width="${logoSize}" height="${logoSize}" rx="${logoSize * LOGO_RADIUS}"/></clipPath>` +
    `<svg x="${logoAt}" y="${logoAt}" width="${logoSize}" height="${logoSize}" viewBox="0 0 100 100" clip-path="url(#qr-logo)">${logo}</svg>` +
    `</svg>`;

  return { svg, logoBox: { start: logoAt / full, size: logoSize / full } };
}
