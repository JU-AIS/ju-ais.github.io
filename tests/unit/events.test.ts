import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const entries = vi.hoisted(() => [] as Event[]);

vi.mock('astro:content', () => ({
  getCollection: async () => entries,
}));

import { config } from '../../src/config';
import { formatDate, formatTime, getEvents, getNowUrl, isPast, type Event } from '../../src/lib/events';

const event = (id: string, iso: string, signup?: string, hitractId?: number) =>
  ({ id, data: { date: new Date(iso), signup, hitractId } }) as unknown as Event;

describe('events', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-12-08T22:30:00+01:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    entries.length = 0;
    config.nowUrl = '';
  });

  it('isPast is day-based in Europe/Stockholm', () => {
    expect(isPast(event('earlier-today', '2026-12-08T00:15:00+01:00'))).toBe(false);
    expect(isPast(event('later-today', '2026-12-08T23:45:00+01:00'))).toBe(false);
    expect(isPast(event('yesterday', '2026-12-07T23:59:00+01:00'))).toBe(true);
    expect(isPast(event('tomorrow', '2026-12-09T00:01:00+01:00'))).toBe(false);
  });

  it('uses Stockholm day, not UTC day', () => {
    vi.setSystemTime(new Date('2026-12-08T00:30:00+01:00'));
    expect(isPast(event('utc-yesterday', '2026-12-07T23:30:00Z'))).toBe(false);
  });

  it('getEvents splits upcoming ascending and past descending', async () => {
    entries.push(
      event('old', '2026-10-01T18:00:00+02:00'),
      event('far', '2027-02-01T18:00:00+01:00'),
      event('today', '2026-12-08T18:00:00+01:00'),
      event('recent', '2026-12-01T18:00:00+01:00'),
      event('soon', '2026-12-15T18:00:00+01:00'),
    );
    const { upcoming, past } = await getEvents();
    expect(upcoming.map((e) => e.id)).toEqual(['today', 'soon', 'far']);
    expect(past.map((e) => e.id)).toEqual(['recent', 'old']);
  });

  it('getNowUrl points at the next upcoming event with a sign-up', async () => {
    entries.push(
      event('past', '2026-12-01T18:00:00+01:00', 'https://t/past'),
      event('later', '2027-01-20T18:00:00+01:00', 'https://t/later'),
      event('no-tickets', '2026-12-10T18:00:00+01:00'),
      event('soon', '2026-12-15T18:00:00+01:00', 'https://t/soon'),
    );
    expect(await getNowUrl()).toBe('https://t/soon');
  });

  it('getNowUrl opens HiTract events in the app', async () => {
    entries.push(
      event('later', '2027-01-20T18:00:00+01:00', 'https://t/later'),
      event('hitract', '2026-12-10T18:00:00+01:00', 'https://pay.hitract.se/ticket/listTickets/?id=19062', 19062),
    );
    expect(await getNowUrl()).toBe('https://open.hitract.se/hitevent/19062');
  });

  it('getNowUrl keeps pointing at an event until its day is over', async () => {
    entries.push(event('today', '2026-12-08T18:00:00+01:00', 'https://t/today'));
    expect(await getNowUrl()).toBe('https://t/today');
  });

  it('getNowUrl falls back to the club page without upcoming sign-ups', async () => {
    expect(await getNowUrl()).toBe(config.clubUrl);
    entries.push(event('past', '2026-12-01T18:00:00+01:00', 'https://t/past'), event('no-tickets', '2026-12-20T18:00:00+01:00'));
    expect(await getNowUrl()).toBe(config.clubUrl);
  });

  it('getNowUrl prefers the manual override', async () => {
    entries.push(event('soon', '2026-12-15T18:00:00+01:00', 'https://t/soon'));
    config.nowUrl = 'https://forms.example/x';
    expect(await getNowUrl()).toBe('https://forms.example/x');
  });

  it('formats date and time in Europe/Stockholm', () => {
    const date = new Date('2026-12-08T17:00:00Z');
    expect(formatDate(date)).toBe('Tue, 8 Dec 2026');
    expect(formatTime(date)).toBe('18:00');
    const summer = new Date('2026-06-30T22:30:00Z');
    expect(formatDate(summer)).toBe('Wed, 1 Jul 2026');
    expect(formatTime(summer)).toBe('00:30');
  });
});
