import { config } from '../config';
import { slugify } from './hitract';

const slug = slugify(config.shortName);

// One entry per slide (and dot) in the QR carousel. `href` is a site path or a full external URL;
// `page` is the site section whose `/qr` pages also start on that slide.
export const qrCodes = [
  { title: 'Partner with us', href: '/partners/contact', page: '/partners', fileName: `${slug}-partner-qr` },
  { title: config.shortName, href: '/', fileName: `${slug}-qr` },
  { title: 'Links', href: '/links', fileName: `${slug}-links-qr` },
  { title: 'Join', href: config.joinUrl, fileName: `${slug}-join-qr` },
];

/** The slide `<path>/qr` starts on: the page's own code, else its section's, else the home code. */
export function qrStartFor(path: string) {
  const own = qrCodes.findIndex(({ href }) => href === path);
  if (own >= 0) return own;
  const section = qrCodes.findIndex((code) => 'page' in code && (path === code.page || path.startsWith(`${code.page}/`)));
  return section >= 0 ? section : qrCodes.findIndex(({ href }) => href === '/');
}
