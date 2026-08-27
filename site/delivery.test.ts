import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');

describe('static delivery security regression', () => {
  it('never runtime-caches a URL or response with license data', async () => {
    const worker = await readFile(resolve(root, 'site/public/sw.js'), 'utf8');
    expect(worker).toContain("const CACHE = 'gesture-replay-shell-v2'");
    expect(worker).toContain('/license|token/i');
    expect(worker).toContain('if (hasLicenseData(url))');
    expect(worker).toContain('event.respondWith(fetch(event.request));');
    expect(worker).toContain('!url.search && !hasLicenseData(url)');
    expect(worker).toContain('url.search || hasLicenseData(url)');
  });

  it('ships immutable hashed assets and production browser protection headers', async () => {
    const headers = await readFile(resolve(root, 'site/public/_headers'), 'utf8');
    const azure = await readFile(resolve(root, 'site/public/staticwebapp.config.json'), 'utf8');
    expect(headers).toContain('/assets/*\n  Cache-Control: public, max-age=31536000, immutable');
    expect(headers).toContain("Content-Security-Policy: default-src 'self'");
    expect(headers).toContain('connect-src \'self\' https://api.sociobot.in');
    expect(headers).toContain('Permissions-Policy: camera=(), microphone=()');
    expect(azure).toContain('"route": "/assets/*"');
    expect(azure).toContain('"Cache-Control": "public, max-age=31536000, immutable"');
    expect(azure).toContain('"Content-Security-Policy"');
    expect(azure).toContain('"Permissions-Policy"');
  });

  it('uses the registered live Sociobot checkout, never the staging endpoint', async () => {
    const page = await readFile(resolve(root, 'site/index.html'), 'utf8');
    expect(page).toContain('https://api.sociobot.in/api/v1/products/gesture-game-replay/checkout');
    expect(page).not.toContain('pilot-api.sociobot.in');
  });
});
