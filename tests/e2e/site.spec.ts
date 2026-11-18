import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { config } from '../../src/config';

test('home shows hero with join and Discord links', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero h1')).toBeVisible();
  await expect(page.locator('.hero__join')).toHaveAttribute('href', config.joinUrl);
  await expect(page.locator('.hero').getByRole('link', { name: 'Discord' })).toHaveAttribute('href', config.discordUrl);
});

test('events page shows the empty state when there are no events', async ({ page }) => {
  await page.goto('/events');
  test.skip((await page.locator('.event-card__link').count()) > 0, 'events exist');
  await expect(page.getByText('New events are coming soon.')).toBeVisible();
});

test('event card opens and closes the modal', async ({ page }) => {
  await page.goto('/events');
  const card = page.locator('.event-card__link').first();
  test.skip((await card.count()) === 0, 'no events');
  const id = (await card.getAttribute('href'))!.slice(1);
  const dialog = page.locator(`dialog#${id}`);
  await card.click();
  await expect(dialog).toBeVisible();
  await dialog.locator('[data-close]').click();
  await expect(dialog).toBeHidden();
});

test('event hash opens the modal directly', async ({ page }) => {
  await page.goto('/events');
  const card = page.locator('.event-card__link').first();
  test.skip((await card.count()) === 0, 'no events');
  const hash = (await card.getAttribute('href'))!;
  await page.goto(`/events${hash}`);
  await page.reload();
  await expect(page.locator(`dialog${hash}`)).toBeVisible();
});

test('links page has no chrome and the right buttons', async ({ page }) => {
  await page.goto('/links');
  await expect(page.locator('header.nav')).toHaveCount(0);
  await expect(page.locator('footer')).toHaveCount(0);
  const buttons = page.locator('.links__btn');
  for (const button of await buttons.all()) await expect(button).toBeVisible();
  await expect(buttons.first()).toHaveAttribute('href', config.joinUrl);
  const nextEvent = page.locator('.links__btn[href^="/events#"]');
  expect(await nextEvent.count()).toBeLessThanOrEqual(1);
  if (await nextEvent.count()) await expect(buttons.nth(1)).toHaveAttribute('href', /^\/events#[\w-]+$/);
  await expect(page.getByRole('link', { name: 'Join our Discord' })).toHaveAttribute('href', config.discordUrl);
});

test('footer and links page link to Discord, Instagram, LinkedIn and email', async ({ page }) => {
  for (const path of ['/', '/links']) {
    await page.goto(path);
    const social = page.locator('.social');
    await expect(social.getByRole('link', { name: 'Discord' })).toHaveAttribute('href', config.discordUrl);
    await expect(social.getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', config.instagramUrl);
    await expect(social.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', config.linkedinUrl);
    await expect(social.getByRole('link', { name: 'Email' })).toHaveAttribute('href', `mailto:${config.email}`);
  }
});

test('partners page has a mailto link', async ({ page }) => {
  await page.goto('/partners');
  await expect(page.locator(`a[href^="mailto:${config.partnerEmail}"]`).first()).toBeVisible();
});

for (const path of ['/qr', '/links/qr']) {
  test(`${path} downloads a static 2048px PNG and a standalone SVG`, async ({ page }) => {
    await page.goto(path);
    const read = async (type: string) => {
      const [download] = await Promise.all([page.waitForEvent('download'), page.click(`[data-download=${type}]`)]);
      return readFileSync((await download.path())!);
    };
    const png = await read('png');
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(2048);
    const svg = (await read('svg')).toString();
    expect(svg).not.toContain('var(');
    expect(svg).not.toContain('<animate');
  });
}

test('unknown path shows the 404 page with a home link', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.locator('.not-found').getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
});
