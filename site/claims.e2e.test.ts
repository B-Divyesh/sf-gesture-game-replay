import { createServer, type Server } from 'node:http';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, extname, join, normalize, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { expect as browserExpect } from 'playwright/test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { compareRules, frameAt, type GestureFixture, type GestureRule } from '../src/index';

const root = resolve(import.meta.dirname, '..');
const builtSite = resolve(root, 'dist/site');
let server: Server;
let browser: Browser;
let baseUrl = '';

const mimeTypes: Record<string, string> = {
  '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml',
};

function builtFileFor(pathname: string): { file: string; status: number } {
  if (pathname === '/' || pathname === '/demo' || pathname === '/demo/') return { file: join(builtSite, 'index.html'), status: 200 };
  if (pathname === '/privacy' || pathname === '/privacy/') return { file: join(builtSite, 'privacy/index.html'), status: 200 };
  if (pathname === '/terms' || pathname === '/terms/') return { file: join(builtSite, 'terms/index.html'), status: 200 };
  const relative = normalize(pathname).replace(/^[/\\]+/, '');
  const candidate = resolve(builtSite, relative);
  if (candidate.startsWith(`${builtSite}/`) && existsSync(candidate)) return { file: candidate, status: 200 };
  return { file: join(builtSite, '404.html'), status: 404 };
}

async function newDemoPage(context?: BrowserContext): Promise<{ context: BrowserContext; page: Page; ownsContext: boolean }> {
  const ownsContext = !context;
  const activeContext = context ?? await browser.newContext();
  const page = await activeContext.newPage();
  await page.goto(`${baseUrl}/demo`);
  await browserExpect(page).toHaveTitle('Demo — Gesture Replay Kit');
  await browserExpect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await browserExpect(page.locator('#fixture-name')).toContainText('Sample');
  await browserExpect(page.locator('#frame-readout')).toContainText('Frame 1 of 41');
  await page.waitForFunction(() => document.getElementById('workbench')!.getBoundingClientRect().top < window.innerHeight);
  return { context: activeContext, page, ownsContext };
}

async function closeDemo(result: { context: BrowserContext; ownsContext: boolean }): Promise<void> {
  if (result.ownsContext) await result.context.close();
}

function packArtifact(destination: string): string {
  execFileSync('npm', ['run', 'build:lib'], { cwd: root, stdio: 'ignore' });
  const packed = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', destination], { cwd: root, encoding: 'utf8' })) as { filename: string }[];
  return join(destination, packed[0]!.filename);
}

beforeAll(async () => {
  server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    const { file, status } = builtFileFor(pathname);
    try {
      const body = await readFile(file);
      response.writeHead(status, {
        'Content-Type': mimeTypes[extname(file)] ?? 'application/octet-stream',
        'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate',
      });
      response.end(body);
    } catch {
      response.writeHead(500, { 'Content-Type': 'text/plain' });
      response.end('Test server could not read the built site.');
    }
  });
  await new Promise<void>((resolveServer) => server.listen(0, '127.0.0.1', () => resolveServer()));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not start the test server.');
  baseUrl = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ headless: true });
});

afterAll(async () => {
  await browser?.close();
  await new Promise<void>((resolveServer) => server?.close(() => resolveServer()));
});

describe('published claims', () => {
  it('keeps reduced-motion playback advancing in discrete time steps', async () => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const demo = await newDemoPage(context);
    try {
      await demo.page.getByRole('button', { name: 'Play replay' }).click();
      await demo.page.waitForTimeout(650);
      const time = await demo.page.locator('#time-readout').textContent();
      expect(time).toMatch(/0:00\.[4-9]\d\d|0:0[1-3]\./);
    } finally { await context.close(); }
  });

  it('keeps demo storage separate, resets the shipped sample, and discards it on exit', async () => {
    const context = await browser.newContext();
    await context.addInitScript(() => localStorage.setItem('real:fixture', 'keep-me'));
    const demo = await newDemoPage(context);
    try {
      await demo.page.getByLabel('Threshold').last().fill('0.99');
      await demo.page.getByRole('button', { name: 'Reset demo' }).click();
      await browserExpect(demo.page.locator('#fixture-name')).toContainText('Sample');
      expect(await demo.page.evaluate(() => localStorage.getItem('real:fixture'))).toBe('keep-me');
      await demo.page.getByRole('link', { name: 'Start for real' }).click();
      await demo.page.waitForURL(`${baseUrl}/`);
      expect(await demo.page.evaluate(() => localStorage.getItem('demo:gesture-game-replay:session'))).toBeNull();
      await browserExpect(demo.page.locator('#fixture-name')).toHaveText('No trace loaded');
    } finally { await context.close(); }
  });

  it('serves a designed 404 response with a way back', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      const response = await page.goto(`${baseUrl}/does-not-exist`);
      expect(response?.status()).toBe(404);
      await browserExpect(page).toHaveTitle('Page not found — Gesture Replay Kit');
      await browserExpect(page.getByRole('heading', { level: 1 })).toContainText('Find a replay');
      await browserExpect(page.getByRole('link', { name: 'Go home' })).toBeVisible();
    } finally { await context.close(); }
  });

  it('@claim:replay-and-compare replays the sample and reports a rule comparison', async () => {
    const demo = await newDemoPage();
    try {
      await demo.page.getByRole('button', { name: 'Play replay' }).click();
      await demo.page.waitForFunction(() => document.getElementById('time-readout')?.textContent !== '0:00.000');
      await demo.page.getByLabel('Threshold').last().fill('0.9');
      await browserExpect(demo.page.locator('#comparison-summary')).not.toHaveText('');
    } finally { await closeDemo(demo); }
  });

  it('@claim:no-video-retention rejects a video file and keeps the sample workspace usable', async () => {
    const demo = await newDemoPage();
    try {
      await demo.page.locator('#fixture-file').setInputFiles({ name: 'player-video.mp4', mimeType: 'video/mp4', buffer: Buffer.from('not a video fixture') });
      await browserExpect(demo.page.locator('#fixture-status')).toContainText('Could not load player-video.mp4');
      await browserExpect(demo.page.locator('#frame-readout')).toContainText('Frame 1 of 41');
    } finally { await closeDemo(demo); }
  });

  it('@claim:no-pixels blocks camera use during the sample flow', async () => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      (window as Window & { cameraCalls?: number }).cameraCalls = 0;
      const mediaDevices = navigator.mediaDevices;
      if (mediaDevices) Object.defineProperty(mediaDevices, 'getUserMedia', { configurable: true, value: () => {
        (window as Window & { cameraCalls?: number }).cameraCalls = ((window as Window & { cameraCalls?: number }).cameraCalls ?? 0) + 1;
        return Promise.reject(new Error('Camera use is not allowed in this check.'));
      } });
    });
    const demo = await newDemoPage(context);
    try {
      await demo.page.getByRole('button', { name: 'Play replay' }).click();
      await demo.page.waitForTimeout(150);
      expect(await demo.page.evaluate(() => (window as Window & { cameraCalls?: number }).cameraCalls)).toBe(0);
      expect(await demo.page.locator('video').count()).toBe(0);
    } finally { await context.close(); }
  });

  it('@claim:no-account completes the first replay without an account request or sign-in step', async () => {
    const context = await browser.newContext();
    const requests: string[] = [];
    context.on('request', (request) => requests.push(request.url()));
    const demo = await newDemoPage(context);
    try {
      await demo.page.getByRole('button', { name: 'Play replay' }).click();
      await demo.page.waitForFunction(() => document.getElementById('time-readout')?.textContent !== '0:00.000');
      expect(requests.every((url) => new URL(url).origin === baseUrl)).toBe(true);
      expect(await demo.page.getByRole('button', { name: /sign in|log in/i }).count()).toBe(0);
    } finally { await context.close(); }
  });

  it('@claim:local-json keeps imported fixture data out of persistent real-data storage', async () => {
    const context = await browser.newContext();
    await context.addInitScript(() => localStorage.setItem('real:fixture', 'keep-me'));
    const demo = await newDemoPage(context);
    try {
      const fixture = JSON.stringify({ format: 'gesture-replay/v1', duration: 0, frames: [{ t: 0, pose: [{ x: 0.4, y: 0.5 }] }] });
      await demo.page.locator('#fixture-file').setInputFiles({ name: 'local.json', mimeType: 'application/json', buffer: Buffer.from(fixture) });
      await browserExpect(demo.page.locator('#fixture-name')).toHaveText('local.json');
      expect(await demo.page.evaluate(() => ({ real: localStorage.getItem('real:fixture'), fixtureKeys: Object.keys(localStorage).filter((key) => /fixture/i.test(key)) }))).toEqual({ real: 'keep-me', fixtureKeys: ['real:fixture'] });
    } finally { await context.close(); }
  });

  it('@claim:no-upload sends no upload request while replaying and exporting the sample', async () => {
    const context = await browser.newContext();
    const requests: { url: string; method: string }[] = [];
    context.on('request', (request) => requests.push({ url: request.url(), method: request.method() }));
    const demo = await newDemoPage(context);
    try {
      const download = demo.page.waitForEvent('download');
      await demo.page.getByRole('button', { name: 'Export scrubbed' }).click();
      await download;
      expect(requests.filter((request) => request.method !== 'GET')).toEqual([]);
      expect(requests.every((request) => new URL(request.url).origin === baseUrl)).toBe(true);
    } finally { await context.close(); }
  });

  it('@claim:no-video-import does not offer video as an accepted import format', async () => {
    const demo = await newDemoPage();
    try {
      await browserExpect(demo.page.locator('#fixture-file')).toHaveAttribute('accept', /application\/json/);
      await browserExpect(demo.page.locator('#fixture-file')).not.toHaveAttribute('accept', /video/);
    } finally { await closeDemo(demo); }
  });

  it('@claim:scrubbed-export downloads a normalized fixture without source metadata', async () => {
    const demo = await newDemoPage();
    try {
      const downloadPromise = demo.page.waitForEvent('download');
      await demo.page.getByRole('button', { name: 'Export scrubbed' }).click();
      const download = await downloadPromise;
      const path = await download.path();
      if (!path) throw new Error('The browser did not save the scrubbed fixture.');
      const exported = JSON.parse(await readFile(path, 'utf8')) as { frames: { t: number }[]; metadata?: Record<string, unknown> };
      expect(exported.frames).toHaveLength(41);
      expect(exported.frames[0]?.t).toBe(0);
      expect(exported.metadata?.source).toBeUndefined();
    } finally { await closeDemo(demo); }
  });

  it('@claim:typed-module-entries installs and runs ESM, CommonJS, and TypeScript imports in a clean consumer', async () => {
    const temp = await mkdtemp(join(tmpdir(), 'gesture-replay-consumer-'));
    try {
      const tarball = packArtifact(temp);
      const consumer = join(temp, 'consumer');
      await mkdir(consumer);
      execFileSync('npm', ['init', '--yes'], { cwd: consumer, stdio: 'ignore' });
      execFileSync('npm', ['install', '--ignore-scripts', tarball], { cwd: consumer, stdio: 'ignore' });
      await writeFile(join(consumer, 'esm.mjs'), "import { LandmarkRecorder } from 'gesture-game-replay'; const r = new LandmarkRecorder(); r.start(0); r.addFrame({ timestamp: 1, pose: [] }); console.log(r.stop(1).frames.length);\n");
      await writeFile(join(consumer, 'cjs.cjs'), "const { LandmarkRecorder } = require('gesture-game-replay'); const r = new LandmarkRecorder(); r.start(0); r.addFrame({ timestamp: 1, pose: [] }); console.log(r.stop(1).frames.length);\n");
      await writeFile(join(consumer, 'typed.ts'), "import { LandmarkRecorder } from 'gesture-game-replay'; const recorder: LandmarkRecorder = new LandmarkRecorder(); void recorder;\n");
      expect(execFileSync('node', ['esm.mjs'], { cwd: consumer, encoding: 'utf8' }).trim()).toBe('1');
      expect(execFileSync('node', ['cjs.cjs'], { cwd: consumer, encoding: 'utf8' }).trim()).toBe('1');
      execFileSync(join(root, 'node_modules/.bin/tsc'), ['--noEmit', '--target', 'es2022', '--module', 'nodenext', '--moduleResolution', 'nodenext', 'typed.ts'], { cwd: consumer, stdio: 'ignore' });
    } finally { await rm(temp, { recursive: true, force: true }); }
  }, 15_000);

  it('@claim:zero-runtime-dependencies publishes no production dependency tree', async () => {
    const temp = await mkdtemp(join(tmpdir(), 'gesture-replay-package-'));
    try {
      const listing = execFileSync('tar', ['-xOf', packArtifact(temp), 'package/package.json'], { encoding: 'utf8' });
      const manifest = JSON.parse(listing) as { dependencies?: Record<string, string> };
      expect(manifest.dependencies ?? {}).toEqual({});
    } finally { await rm(temp, { recursive: true, force: true }); }
  });

  it('@claim:deterministic-results returns the same replay frame and comparison for identical input', () => {
    const fixture: GestureFixture = { format: 'gesture-replay/v1', duration: 100, frames: [{ t: 0, pose: [{ x: .5, y: .6 }] }, { t: 100, pose: [{ x: .5, y: .2 }] }] };
    const first: GestureRule = { id: 'first', label: 'First', all: [{ stream: 'pose', index: 0, axis: 'y', op: 'lt', value: .4 }] };
    const second: GestureRule = { ...first, id: 'second', label: 'Second', all: [{ stream: 'pose', index: 0, axis: 'y', op: 'lt', value: .3 }] };
    expect(frameAt(fixture, 50)).toEqual(frameAt(fixture, 50));
    expect(compareRules(fixture, first, second)).toEqual(compareRules(fixture, first, second));
  });

  it('@claim:license-safety waits for verification before storing a returned token and leaves it out of Cache Storage', async () => {
    const context = await browser.newContext();
    let releaseVerification: (() => void) | undefined;
    await context.route('https://api.sociobot.in/api/v1/products/gesture-game-replay/verify?license=*', async (route) => {
      await new Promise<void>((resolveVerification) => { releaseVerification = () => resolveVerification(); });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'invalid' }) });
    });
    const page = await context.newPage();
    try {
      await page.goto(`${baseUrl}/?license=invalid-claim-token`);
      await browserExpect(page.locator('#license-status')).toContainText('Checking');
      expect(await page.evaluate(() => localStorage.getItem('sb_license:gesture-game-replay'))).toBeNull();
      releaseVerification?.();
      await browserExpect(page.locator('#license-status')).toContainText('License no longer active');
      const cacheKeys = await page.evaluate(async () => {
        const names = await caches.keys();
        return (await Promise.all(names.map(async (name) => (await caches.open(name)).keys()))).flat().map((request) => request.url);
      });
      expect(cacheKeys.some((url) => /license|token/i.test(url))).toBe(false);
    } finally { await context.close(); }
  });

  it('@claim:offline-workbench reloads the demo sample while offline after its first visit', async () => {
    const isolatedContext = await browser.newContext();
    try {
      const demo = await newDemoPage(isolatedContext);
      await demo.page.waitForFunction(async () => {
        await navigator.serviceWorker.ready;
        return Boolean(navigator.serviceWorker.controller);
      });
      await isolatedContext.setOffline(true);
      await demo.page.reload();
      await browserExpect(demo.page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
      await browserExpect(demo.page.locator('#frame-readout')).toContainText('Frame 1 of 41');
      await browserExpect(demo.page.getByRole('button', { name: 'Export scrubbed' })).toBeEnabled();
    } finally { await isolatedContext.close(); }
  });

  it('@claim:no-telemetry-or-cdn loads and uses the demo with only first-party requests', async () => {
    const context = await browser.newContext();
    const requestedOrigins = new Set<string>();
    context.on('request', (request) => requestedOrigins.add(new URL(request.url()).origin));
    const demo = await newDemoPage(context);
    try {
      await demo.page.getByRole('button', { name: 'Play replay' }).click();
      await demo.page.waitForTimeout(180);
      expect([...requestedOrigins]).toEqual([baseUrl]);
    } finally { await context.close(); }
  });

  it('@claim:free-core lets a new visitor replay, compare, and export without contacting checkout', async () => {
    const context = await browser.newContext();
    const requests: string[] = [];
    context.on('request', (request) => requests.push(request.url()));
    const demo = await newDemoPage(context);
    try {
      await demo.page.getByRole('button', { name: 'Play replay' }).click();
      const download = demo.page.waitForEvent('download');
      await demo.page.getByRole('button', { name: 'Export scrubbed' }).click();
      await download;
      expect(requests.some((url) => url.includes('/checkout'))).toBe(false);
    } finally { await context.close(); }
  });
});
