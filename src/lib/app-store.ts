import { config } from '../config';

/** The HiTract store page for this device, or null on desktop. */
export function appStoreFor(userAgent: string, touchPoints = 0): string | null {
  // iPadOS reports itself as a Mac, so a touch screen gives it away.
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1)) return config.appStoreUrl;
  if (/Android/.test(userAgent)) return config.googlePlayUrl;
  return null;
}
