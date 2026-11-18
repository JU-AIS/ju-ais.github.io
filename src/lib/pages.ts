// Every static page gets a QR page at `<path>/qr`.
export const pagePaths = Object.keys(import.meta.glob('../pages/**/*.astro'))
  .filter((file) => !/\[|\/404\.astro$/.test(file))
  .map((file) => file.replace(/^\.\.\/pages/, '').replace(/(\/index)?\.astro$/, '') || '/');

export function qrPathFor(pathname: string) {
  const path = pathname.replace(/\/$/, '') || '/';
  if (path === '/' || !pagePaths.includes(path)) return '/qr';
  return `${path}/qr`;
}
