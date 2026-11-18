import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { config } from '../../src/config';
import { qrCodes } from '../../src/lib/qr-codes';

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

test('footer links to GitHub and the QR page', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  await expect(footer.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', config.githubUrl);
  await expect(footer.getByRole('link', { name: 'QR code' })).toHaveAttribute('href', '/qr');
});

test('partners page has a mailto link', async ({ page }) => {
  await page.goto('/partners');
  await expect(page.locator(`a[href^="mailto:${config.partnerEmail}"]`).first()).toBeVisible();
});

test('links page social row links to the links QR code', async ({ page }) => {
  await page.goto('/links');
  await expect(page.locator('.social').getByRole('link', { name: 'QR code' })).toHaveAttribute('href', '/links/qr');
});

const linksSlide = qrCodes.findIndex(({ href }) => href === '/links');

test('/qr starts on the first QR code and dots switch slides', async ({ page }) => {
  await page.goto('/qr');
  const dots = page.locator('.qr__dot');
  await expect(dots).toHaveCount(qrCodes.length);
  await expect(page.locator('.qr h1')).toHaveText(qrCodes[0].title);
  await expect(dots.first()).toHaveAttribute('aria-current', 'true');
  await dots.nth(linksSlide).click();
  await expect(page.locator('.qr h1')).toHaveText('Links');
  await expect(dots.nth(linksSlide)).toHaveAttribute('aria-current', 'true');
  await expect(dots.first()).toHaveAttribute('aria-current', 'false');
  await expect(page.locator('.qr__lead a')).toHaveAttribute('href', /\/links$/);
});

test('/links/qr opens the carousel on the links slide', async ({ page }) => {
  await page.goto('/links/qr');
  await expect(page.locator('.qr h1')).toHaveText('Links');
  await expect(page.locator('.qr__dot').nth(linksSlide)).toHaveAttribute('aria-current', 'true');
  const scrolled = await page.locator('.qr__track').evaluate((el) => Math.round(el.scrollLeft / el.clientWidth));
  expect(scrolled).toBe(linksSlide);
});

test('/qr changes slide with arrow keys and horizontal scrolling', async ({ page }) => {
  await page.goto('/qr');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.qr h1')).toHaveText(qrCodes[1].title);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.qr h1')).toHaveText(qrCodes[0].title);
  const last = qrCodes.length - 1;
  await page.locator('.qr__track').evaluate((el, i) => el.scrollTo({ left: i * el.clientWidth }), last);
  await expect(page.locator('.qr h1')).toHaveText(qrCodes[last].title);
});

test('/qr changes slide by dragging with the mouse', async ({ page, isMobile }) => {
  test.skip(isMobile, 'touch swipes natively');
  await page.goto('/qr');
  const box = (await page.locator('.qr__track').boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.7, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.3, y, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('.qr h1')).toHaveText(qrCodes[1].title);
});

test('/qr has no duplicate ids', async ({ page }) => {
  await page.goto('/qr');
  const ids = await page.locator('[id]').evaluateAll((els) => els.map((el) => el.id));
  expect(ids.length).toBe(new Set(ids).size);
});

for (const [i, { fileName }] of qrCodes.entries()) {
  test(`/qr slide ${i + 1} downloads a static 2048px PNG and a standalone SVG`, async ({ page }) => {
    await page.goto('/qr');
    await page.locator('.qr__dot').nth(i).click();
    await expect(page.locator('.qr__dot').nth(i)).toHaveAttribute('aria-current', 'true');
    const read = async (type: string) => {
      const [download] = await Promise.all([page.waitForEvent('download'), page.click(`[data-download=${type}]`)]);
      expect(download.suggestedFilename()).toBe(`${fileName}.${type}`);
      return readFileSync((await download.path())!);
    };
    const png = await read('png');
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(2048);
    const svg = (await read('svg')).toString();
    expect(svg).not.toContain('var(');
    expect(svg).not.toContain('<animate');
    expect(svg).toContain(`<clipPath id="qr-${i}-logo">`);
    expect(svg).toContain(`clip-path="url(#qr-${i}-logo)"`);
  });
}

test('unknown path shows the 404 page with a home link', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.locator('.not-found').getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
});
