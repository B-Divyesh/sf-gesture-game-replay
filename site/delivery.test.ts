import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');

describe('static delivery contract', () => {
  it('declares cache and browser protection policy for the generated static site', async () => {
    const config = JSON.parse(await readFile(resolve(root, 'site/public/staticwebapp.config.json'), 'utf8')) as {
      globalHeaders: Record<string, string>;
      routes: { route: string; headers?: Record<string, string>; rewrite?: string; statusCode?: number }[];
      responseOverrides: Record<string, { rewrite: string }>;
    };
    const assetRoute = config.routes.find((route) => route.route === '/assets/*');
    const demoRoute = config.routes.find((route) => route.route === '/demo');
    expect(assetRoute?.headers?.['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(config.globalHeaders['Content-Security-Policy']).toMatch(/frame-ancestors 'none'/);
    expect(config.globalHeaders['Permissions-Policy']).toMatch(/camera=\(\), microphone=\(\)/);
    expect(demoRoute).toMatchObject({ rewrite: '/index.html' });
    expect(demoRoute?.statusCode).toBeUndefined();
    expect(config.responseOverrides['404']).toEqual({ rewrite: '/404.html' });
  });

  it('exposes the registered checkout address as a real destination in the page', async () => {
    const page = new JSDOM(await readFile(resolve(root, 'site/index.html'), 'utf8'));
    const purchase = [...page.window.document.querySelectorAll('a')].find((link) => link.textContent?.includes('Buy Adapter Pack'));
    expect(purchase?.href).toBe('https://api.sociobot.in/api/v1/products/gesture-game-replay/checkout');
  });
});
