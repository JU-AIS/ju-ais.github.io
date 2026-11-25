import { getCollection, type CollectionEntry } from 'astro:content';
import { config } from '../config';

export type Event = CollectionEntry<'events'>;

const dayKey = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: config.timeZone }).format(date);

export function isPast(event: Event): boolean {
  return dayKey(event.data.date) < dayKey(new Date());
}

export async function getEvents(): Promise<{ upcoming: Event[]; past: Event[] }> {
  const all = await getCollection('events');
  const upcoming = all
    .filter((event) => !isPast(event))
    .sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
  const past = all
    .filter(isPast)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  return { upcoming, past };
}

export async function getNowUrl(): Promise<string> {
  if (config.nowUrl) return config.nowUrl;
  const { upcoming } = await getEvents();
  return upcoming.find((event) => event.data.signup)?.data.signup ?? config.membershipUrl;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: config.timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: config.timeZone, hour: '2-digit', minute: '2-digit' }).format(date);
}
