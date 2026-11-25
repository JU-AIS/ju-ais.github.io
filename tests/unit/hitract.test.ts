import { describe, expect, it } from 'vitest';
import { clubEventsPage, coverFile, isSynced, slugify, toIsoWithOffset, toMarkdown, type HitractEvent } from '../../src/lib/hitract';

const event = (overrides: Partial<HitractEvent> = {}): HitractEvent => ({
  hitEventId: 42,
  name: 'Prompt Battle',
  description: 'Line one\nLine two <b>',
  eventDate: '2026-12-08 18:00:00',
  eventPlaceDescription: 'Rio',
  hitEventType: 'SOCIAL',
  hasTickets: true,
  eventImage: { id: 7, large: 'https://storage.hitract.se/x.jpg' },
  ...overrides,
});

describe('hitract', () => {
  it('slugify makes stable ascii folder names', () => {
    expect(slugify('Members Brunch [Västerås]')).toBe('members-brunch-vasteras');
    expect(slugify('Autumn KFUM 2026 🍂')).toBe('autumn-kfum-2026');
    expect(slugify('🍂')).toBe('event');
  });

  it('adds the Stockholm offset for winter and summer time', () => {
    expect(toIsoWithOffset('2026-12-08 18:00:00', 'Europe/Stockholm')).toBe('2026-12-08T18:00:00+01:00');
    expect(toIsoWithOffset('2026-07-01 12:30:00', 'Europe/Stockholm')).toBe('2026-07-01T12:30:00+02:00');
  });

  it('finds a local cover named after the event slug', () => {
    expect(coverFile(event(), ['other.jpg', 'prompt-battle.PNG'])).toBe('prompt-battle.PNG');
    expect(coverFile(event(), ['prompt-battle.webp'])).toBe('prompt-battle.webp');
    expect(coverFile(event(), ['prompt-battle.pdf', 'prompt-battle-2.jpg', 'Prompt Battle.jpg'])).toBeNull();
    expect(coverFile(event(), [])).toBeNull();
  });

  it('skips elections', () => {
    expect(isSynced(event())).toBe(true);
    expect(isSynced(event({ hitEventType: 'ELECTION' }))).toBe(false);
  });

  it('writes frontmatter, escapes html and keeps line breaks', () => {
    const md = toMarkdown(event(), 'our-club', 'Europe/Stockholm', './cover.jpg');
    expect(md).toContain('title: "Prompt Battle"');
    expect(md).toContain('date: "2026-12-08T18:00:00+01:00"');
    expect(md).toContain('type: "social"');
    expect(md).toContain('cover: "./cover.jpg"');
    expect(md).toContain('signup: "https://pay.hitract.se/ticket/listTickets/?id=42"');
    expect(md).toContain('hitractId: 42');
    expect(md).toContain('Line one  \nLine two &lt;b>');
  });

  it('escapes markdown link and image syntax so it shows as text', () => {
    const body = (description: string) => toMarkdown(event({ description }), 'c', 'Europe/Stockholm', null).split('---\n\n')[1];
    expect(body('[click](javascript:alert(1))')).toBe('\\[click\\](javascript:alert(1))\n');
    expect(body('![](https://tracker.example/x.gif)')).toBe('!\\[\\](https://tracker.example/x.gif)\n');
    expect(body('\\[ref]: javascript:x')).toBe('\\\\\\[ref\\]: javascript:x\n');
    expect(body('Doors open 18:00.\n\nMore at https://juais.se')).toBe('Doors open 18:00.  \n  \nMore at https://juais.se\n');
  });

  it('links to the club page without tickets and omits a missing cover', () => {
    const md = toMarkdown(event({ hasTickets: false, eventPlaceDescription: null, onlyForMembers: true }), 'our-club', 'Europe/Stockholm', null);
    expect(md).toContain(`signup: "${clubEventsPage('our-club')}"`);
    expect(md).toContain('location: "TBA"');
    expect(md).not.toContain('cover:');
    expect(md).toContain('*Members only.*');
  });
});
