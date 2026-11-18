import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const OUT = 'docs/swatches';
const theme = readFileSync('src/styles/theme.css', 'utf8');

mkdirSync(OUT, { recursive: true });
for (const [, name, hex] of theme.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{3,8});/g)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32"><rect x="0.5" y="0.5" width="63" height="31" rx="6" fill="${hex}" stroke="#888"/></svg>\n`;
  writeFileSync(`${OUT}/${name}.svg`, svg);
}
