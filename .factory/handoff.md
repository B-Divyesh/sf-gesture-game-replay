# Gesture Replay Kit — build handoff

Work order: `gesture-game-replay-build-1`

Version: `0.1.0`

Completed: 2026-08-27

## What shipped

- A zero-runtime-dependency TypeScript library with ESM, CommonJS, and declaration outputs.
- Versioned `gesture-replay/v1` JSON fixtures for pose, left-hand, and right-hand landmarks.
- `LandmarkRecorder` with monotonic timestamps and defensive copying; it has no video/camera input API.
- Strict parsing/validation, interpolated `frameAt` replay, speed-aware `ReplayClock`, confidence/occlusion summaries, threshold/hold rule evaluation, A/B disagreement intervals, and privacy-scrubbed export.
- A complete local viewer with JSON file/drag import, anonymous synthetic fixture, opt-in `postMessage` landmark recording bridge, 0.25×–4× playback, scrubber and keyboard controls, skeleton visualization, frame inspector, editable A/B rules, accessible timeline description, confirmed deletion, and JSON download.
- Explicit empty, invalid-file, recording-with-no-frames, offline, locked-license, active-license, and revoked-license states.
- A $19 one-time Adapter Pack using the Sociobot checkout/verify contract. The token key is `sb_license:gesture-game-replay`; verdicts are checked at most daily, cached unlocks paint optimistically, restore-by-paste is available, and free features never wait on billing.
- `/privacy/` and `/terms/`, self-hosted fonts, a versioned service worker, cache headers, robots/sitemap, and no analytics, CDN runtime assets, or cloud fixture storage.
- A product-specific paper-cut diorama system in `.factory/design.md` and original 1200×800 WebP hero (41 KB). The source prompt and provenance are recorded there.

## Run and publish

```bash
npm ci
npm test
npm run typecheck
npm run build
npm pack --dry-run
```

Static deployment root: `dist/site/` (contains `index.html`, `/privacy/index.html`, and `/terms/index.html`). Library output: `dist/lib/`. The package tarball is ready for the factory release workflow; it was not published by this worker.

## Verification

- Clean-clone install: passed; npm audit reported 0 vulnerabilities.
- `npm test`: 8/8 passing.
- `npm run typecheck`: passed with strict TypeScript.
- `npm run build`: passed; ESM 12.82 KB, CJS 14.29 KB, declarations 4.35 KB, and `dist/site/index.html` produced.
- `npm pack --dry-run`: passed; 9 files, 8.9 KB compressed / 43.9 KB unpacked.
- Node smoke tests: both CommonJS `require()` and ESM `import()` passed.
- Factory `verify-url.sh`: HTTP 200, title, `lang=en`, one h1, main landmark, image alt, labeled buttons, and zero browser console/page errors.
- Playwright at 390×844: empty state, sample loading, replay progression, and live threshold update passed with no console errors.
- axe-core 4.13 WCAG A/AA/2.1 AA: 0 violations in empty workbench, loaded workbench, privacy, and terms routes.
- Offline Playwright reload after service-worker activation: shell visible, offline status announced, zero console errors.
- Lighthouse 12.8.2 mobile against the production build: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.5 s, CLS 0, TBT 40 ms. Lab INP was not available because the run had no user interaction; the interactive smoke test showed immediate playback/rule updates.
- Production asset budgets: initial JS 21.01 KB (8.07 KB gzip), CSS 16.75 KB (4.50 KB gzip), fonts 52.72 KB total, hero 41.02 KB.

## Known gaps and next steps

- Camera inference is intentionally not bundled: this product consumes detector landmarks and never handles video. The paid adapters are integration snippets, not detector models.
- The hosted billing endpoint must have the `gesture-game-replay` product registered by the factory before real purchases can verify. No product ID or provider credential is embedded.
- The viewer edits one predicate per rule for a compact v1 interface; the library already supports multi-predicate `all` rules for application and test-suite use.
- A future team tier could add encrypted fixture collections and engine-specific packages, but no cloud trace storage is part of v1.
