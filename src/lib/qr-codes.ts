import { config } from '../config';
import { slugify } from './hitract';

const slug = slugify(config.shortName);

// One entry per slide (and dot) in the QR carousel. `href` is a site path or a full external URL.
export const qrCodes = [
  { title: config.shortName, href: '/', fileName: `${slug}-qr` },
  { title: 'Links', href: '/links', fileName: `${slug}-links-qr` },
  { title: 'Join on HiTract', href: config.joinUrl, fileName: `${slug}-join-qr` },
];
