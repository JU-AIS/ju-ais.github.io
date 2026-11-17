export interface HitractEvent {
  hitEventId: number;
  name: string;
  description?: string | null;
  eventDate: string;
  eventPlaceDescription?: string | null;
  hitEventType: string;
  onlyForMembers?: boolean;
  hasTickets?: boolean;
  eventImage?: { id: number; large?: string; default?: string } | null;
}

const API = 'https://hitract.se/api/hitClub/web';
const SKIPPED_TYPES = new Set(['ELECTION']);
const TYPES: Record<string, string> = { SOCIAL: 'social', LECTURE: 'lecture', WORKSHOP: 'workshop' };

export const eventsUrl = (club: string, fromDate: string, page: number) =>
  `${API}/${club}/allHitEvents?fromDate=${fromDate}&page=${page}&size=50&sort=eventDate,desc`;

export const clubEventsPage = (club: string) => `https://hitract.se/hitclub/${club}/hitevents`;

export const isSynced = (event: HitractEvent) => !SKIPPED_TYPES.has(event.hitEventType);

export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '') || 'event';
}

// HiTract dates are Swedish wall-clock time without an offset.
export function toIsoWithOffset(local: string, timeZone: string): string {
  const [date, time = '00:00:00'] = local.split(' ');
  const asUtc = new Date(`${date}T${time}Z`);
  const zoned = new Date(asUtc.toLocaleString('en-US', { timeZone }));
  const utc = new Date(asUtc.toLocaleString('en-US', { timeZone: 'UTC' }));
  const minutes = Math.round((zoned.getTime() - utc.getTime()) / 60000);
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const offset = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
  return `${date}T${time}${offset}`;
}

export const imageUrl = (event: HitractEvent) => event.eventImage?.large ?? event.eventImage?.default ?? null;

export function toMarkdown(event: HitractEvent, club: string, timeZone: string, cover: string | null): string {
  const signup = event.hasTickets
    ? `https://pay.hitract.se/ticket/listTickets/?id=${event.hitEventId}`
    : clubEventsPage(club);
  const frontmatter = {
    title: event.name.trim(),
    date: toIsoWithOffset(event.eventDate, timeZone),
    location: event.eventPlaceDescription?.trim() || 'TBA',
    type: TYPES[event.hitEventType] ?? 'social',
    cover,
    signup,
    hitractId: event.hitEventId,
    hitractImageId: event.eventImage?.id ?? null,
  };
  const yaml = Object.entries(frontmatter)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');
  const body = (event.description ?? '').trim().replace(/</g, '&lt;').replace(/\n/g, '  \n');
  const membersOnly = event.onlyForMembers ? '\n\n*Members only.*' : '';
  return `---\n${yaml}\n---\n\n${body}${membersOnly}\n`;
}
