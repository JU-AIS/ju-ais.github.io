import { describe, expect, it } from 'vitest';
import { config } from '../../src/config';
import { appStoreFor } from '../../src/lib/app-store';

describe('appStoreFor', () => {
  it('sends iPhones to the App Store', () => {
    expect(appStoreFor('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15')).toBe(config.appStoreUrl);
  });

  it('sends Android phones to Google Play', () => {
    expect(appStoreFor('Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36')).toBe(config.googlePlayUrl);
  });

  it('sends iPads (which report a Mac) to the App Store', () => {
    expect(appStoreFor('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', 5)).toBe(config.appStoreUrl);
  });

  it('returns null on desktop', () => {
    expect(appStoreFor('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15')).toBeNull();
    expect(appStoreFor('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')).toBeNull();
  });
});
