import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from '../src/config.ts';
import { coverFile, eventsUrl, imageUrl, isSynced, slugify, toMarkdown, type HitractEvent } from '../src/lib/hitract.ts';

const EVENTS_DIR = 'src/content/events';
const SYNC_DIR = join(EVENTS_DIR, 'hitract');
// Optional sharper covers than HiTract's 800 px, named after the event's slug (e.g. ju-ais-x-lovable-build-night.jpg).
const COVERS_DIR = join(EVENTS_DIR, 'covers');
// HiTract keeps finished events, so fetching from the club's start includes past events.
const SINCE = '2026-11-01';
const EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { appPlatform: 'web' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function fetchEvents(club: string): Promise<HitractEvent[]> {
  const events: HitractEvent[] = [];
  for (let page = 0; ; page++) {
    const data = await fetchJson(eventsUrl(club, SINCE, page));
    events.push(...data.content);
    if (data.last || page + 1 >= data.totalPages) return events;
  }
}

function existingFolders(): Map<number, { folder: string; imageId: number | null; cover: string | null }> {
  const found = new Map();
  if (!existsSync(SYNC_DIR)) return found;
  for (const folder of readdirSync(SYNC_DIR)) {
    const file = join(SYNC_DIR, folder, 'index.md');
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    const id = text.match(/^hitractId: (\d+)$/m)?.[1];
    if (!id) continue;
    found.set(Number(id), {
      folder,
      imageId: Number(text.match(/^hitractImageId: (\d+)$/m)?.[1]) || null,
      cover: text.match(/^cover: "(.+)"$/m)?.[1] ?? null,
    });
  }
  return found;
}

function uniqueFolder(event: HitractEvent, taken: Set<string>): string {
  const slug = slugify(event.name);
  return taken.has(slug) ? `${slug}-${event.hitEventId}` : slug;
}

function localCover(event: HitractEvent): string | null {
  if (!existsSync(COVERS_DIR)) return null;
  const file = coverFile(event, readdirSync(COVERS_DIR));
  return file ? `../../covers/${file}` : null;
}

async function downloadCover(event: HitractEvent, dir: string): Promise<string | null> {
  const url = imageUrl(event);
  if (!url) return null;
  const res = await fetch(url);
  if (!res.ok) return null;
  const ext = EXTENSIONS[res.headers.get('content-type') ?? ''] ?? 'jpg';
  writeFileSync(join(dir, `cover.${ext}`), Buffer.from(await res.arrayBuffer()));
  return `./cover.${ext}`;
}

async function sync(): Promise<void> {
  const club = config.hitractClub;
  const events = (await fetchEvents(club)).filter(isSynced);
  const existing = existingFolders();
  const taken = new Set([...readdirSync(EVENTS_DIR), ...readdirSync(SYNC_DIR)]);

  for (const event of events) {
    const known = existing.get(event.hitEventId);
    const folder = known?.folder ?? uniqueFolder(event, taken);
    taken.add(folder);
    const dir = join(SYNC_DIR, folder);
    mkdirSync(dir, { recursive: true });

    const imageId = event.eventImage?.id ?? null;
    const cached = known && known.imageId === imageId && known.cover?.startsWith('./') ? known.cover : null;
    const cover = localCover(event) ?? cached ?? (await downloadCover(event, dir));
    writeFileSync(join(dir, 'index.md'), toMarkdown(event, club, config.timeZone, cover));
    console.log(`${known ? 'updated' : 'added  '} ${folder}`);
  }
  console.log(`HiTract sync: ${events.length} events from ${club}`);
}

mkdirSync(SYNC_DIR, { recursive: true });
sync().catch((error) => {
  // Fail the deploy so the last published site stays live instead of one without events.
  console.error(`HiTract sync failed: ${error.message}`);
  process.exitCode = 1;
});
