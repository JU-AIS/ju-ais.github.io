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

test('footer and links page link to Discord, WhatsApp, Instagram, LinkedIn and email', async ({ page }) => {
  for (const path of ['/', '/links']) {
    await page.goto(path);
    const social = page.locator('.social');
    await expect(social.getByRole('link', { name: 'Discord' })).toHaveAttribute('href', config.discordUrl);
    await expect(social.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', config.whatsappUrl);
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

const homeSlide = qrCodes.findIndex(({ href }) => href === '/');
const linksSlide = qrCodes.findIndex(({ href }) => href === '/links');

test('/qr starts on the home QR code and dots switch slides', async ({ page }) => {
  await page.goto('/qr');
  const dots = page.locator('.qr__dot');
  await expect(dots).toHaveCount(qrCodes.length);
  await expect(page.locator('.qr h1')).toHaveText(qrCodes[homeSlide].title);
  await expect(dots.nth(homeSlide)).toHaveAttribute('aria-current', 'true');
  await dots.nth(linksSlide).click();
  await expect(page.locator('.qr h1')).toHaveText('Links');
  await expect(dots.nth(linksSlide)).toHaveAttribute('aria-current', 'true');
  await expect(dots.nth(homeSlide)).toHaveAttribute('aria-current', 'false');
  await expect(page.locator('.qr__lead a')).toHaveAttribute('href', /\/links$/);
});

test('/links/qr opens the carousel on the links slide', async ({ page }) => {
  await page.goto('/links/qr');
  await expect(page.locator('.qr h1')).toHaveText('Links');
  await expect(page.locator('.qr__dot').nth(linksSlide)).toHaveAttribute('aria-current', 'true');
  const scrolled = await page.locator('.qr__track').evaluate((el) => Math.round(el.scrollLeft / el.clientWidth));
  expect(scrolled).toBe(linksSlide);
});

test('/now/qr shows the Now code even when the first scroll is dropped (Safari)', async ({ page }) => {
  await page.addInitScript(() => {
    const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollLeft')!;
    let dropped = false;
    Object.defineProperty(Element.prototype, 'scrollLeft', {
      ...desc,
      set(value: number) {
        if (!dropped && (this as Element).classList.contains('qr__track')) dropped = true;
        else desc.set!.call(this, value);
      },
    });
  });
  const nowSlide = qrCodes.findIndex(({ href }) => href === '/now');
  await page.goto('/now/qr');
  await expect(page.locator('.qr h1')).toHaveText('Now');
  const visible = await page.locator('.qr__track').evaluate((el) => Math.round(el.scrollLeft / el.clientWidth));
  expect(visible).toBe(nowSlide);
});

test('/qr changes slide with arrow keys and horizontal scrolling', async ({ page }) => {
  await page.goto('/qr');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.qr h1')).toHaveText(qrCodes[homeSlide + 1].title);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.qr h1')).toHaveText(qrCodes[homeSlide].title);
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
  await expect(page.locator('.qr h1')).toHaveText(qrCodes[homeSlide + 1].title);
});

test('any page + /qr opens the carousel on that page\'s code, and the footer links there', async ({ page }) => {
  for (const [path, title] of [['/about', config.shortName], ['/partners', 'Partner with us'], ['/join', 'Join']]) {
    await page.goto(path);
    await expect(page.locator('footer').getByRole('link', { name: 'QR code' })).toHaveAttribute('href', `${path}/qr`);
    await page.goto(`${path}/qr`);
    await expect(page.locator('.qr h1')).toHaveText(title);
    await expect(page.locator('.qr__dot')).toHaveCount(qrCodes.length);
  }
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

test('/join shows QR codes on desktop and an Open in HiTract button on phones', async ({ page, isMobile }) => {
  await page.goto('/join');
  const open = page.getByRole('link', { name: 'Open in HiTract' });
  if (isMobile) {
    await expect(open).toBeVisible();
    await expect(open).toHaveAttribute('href', config.membershipUrl);
    await expect(page.locator('.join-box').getByRole('link', { name: 'App Store' })).toHaveAttribute('href', config.appStoreUrl);
    await expect(page.locator('.join-box').getByRole('link', { name: 'Google Play' })).toHaveAttribute('href', config.googlePlayUrl);
    await expect(page.locator('.join-desk')).toBeHidden();
  } else {
    await expect(open).toBeHidden();
    await expect(page.locator('.join-step__qr > svg')).toHaveCount(2);
    for (const svg of await page.locator('.join-step__qr > svg').all()) await expect(svg).toBeVisible();
    await expect(page.locator('.join-desk__stores').getByRole('link', { name: 'App Store' })).toHaveAttribute('href', config.appStoreUrl);
    await expect(page.locator('.join-desk__stores').getByRole('link', { name: 'Google Play' })).toHaveAttribute('href', config.googlePlayUrl);
  }
});

test('/join/app shows both store links on desktop without redirecting', async ({ page, isMobile }) => {
  test.skip(isMobile, 'phones are redirected to their store');
  await page.goto('/join/app');
  await expect(page).toHaveURL(/\/join\/app\/?$/);
  await expect(page.getByRole('link', { name: 'App Store' })).toHaveAttribute('href', config.appStoreUrl);
  await expect(page.getByRole('link', { name: 'Google Play' })).toHaveAttribute('href', config.googlePlayUrl);
});

test('/now redirects to the next sign-up, or membership without events', async ({ page }) => {
  await page.goto('/events');
  const signup = page.locator('.event-modal a', { hasText: 'Sign up' }).first();
  const expected = (await signup.count()) > 0 ? (await signup.getAttribute('href'))! : config.membershipUrl;
  await page.route(/^https:\/\/(?!localhost)/, (route) => route.fulfill({ body: 'stub' }));
  await page.goto('/now');
  await expect(page).toHaveURL(expected);
});
