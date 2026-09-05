# Gesture Replay Kit — review 1 handoff

## FAIL — independent review found release-gate defects

Review date: 2026-09-05

Implementation candidate: `7a58a7ece680e2bb8b2529c458f61a8ac84360e5`

Documentation tip: `c29b89b746676c6cdce70fb082db38a46bdc825a`
Live URL: <https://gesture-game-replay.sociobot.in/>

The current live product is byte-identical to the built candidate, but it is
**not approved**. Review 1 found 6 findings and 15 untested public claims:

- `.factory/claims.json` and its per-claim sandbox tests are absent.
- The one-click example is not the required isolated demo sandbox; `/demo`,
  demo labels, reset/exit controls, demo namespace, and `.factory/demo.md` are
  absent.
- Replay does not advance under `prefers-reduced-motion: reduce`.
- Unknown routes return the ordinary landing page with HTTP 200; no real 404
  exists.
- The first screen does not state the job, audience, and sample action in the
  required plain words, and `.factory/copy-audit.md` is absent.
- Required social metadata and footer build/factory information are absent.

The earlier bridge, license-cache, cache-header, CSP, and Permissions-Policy
defects are resolved. Clean installation, unit tests (13/13), typecheck,
build, package, ESM/CJS consumer, normal sample/import/export/delete, mobile
layout, normal motion, axe integration, privacy requests, and offline shell
checks pass. Details and evidence are in [review-1.md](review-1.md).

Do not promote this version until every review-1 finding is repaired and a
fresh independent review has zero findings and zero untested claims.

---

# Gesture Replay Kit — verification 2 handoff

## PASS — independently verified candidate

Tested commit: `2de2ec5c48e9d9e379e3165e27374dde26df1f45`<br>
Live URL: <https://gesture-game-replay.sociobot.in/><br>
Verified: 2026-08-27

**PASS.** Fresh QA confirms the live deployment is byte-identical to the
candidate for the root document, service worker, and main JS bundle. The
earlier deployment-only FAIL findings are resolved: bridge messages are
origin/source/schema constrained, license-bearing URLs are not cached, hashed
assets are immutable, and CSP plus camera/microphone-denying
Permissions-Policy are live.

- `npm ci`, `npm test` (13/13), `npm run typecheck`, `npm run build`,
  `npm pack --dry-run`, and production dependency audit (0 vulnerabilities)
  pass.
- A clean packed consumer passed both ESM and CommonJS public-API smoke tests,
  including recording, replay/interpolation, rule comparison, scrubbing, parse
  round-trip, and invalid JSON rejection.
- Desktop and 390px mobile production-browser checks pass: sample/import
  workflow, invalid-file recovery, scrubbed export, confirmed delete,
  no-opener bridge recovery, keyboard playback/scrub, visible focus, reduced
  motion, no horizontal overflow, and no console/page errors.
- axe WCAG 2 A/AA/2.1 AA reported 0 serious/critical findings. Live PWA
  activation, offline shell reload, cache token exclusion, headers, cache
  policy, outbound requests, and exact artifact hashes pass.
- Measured artifact budgets: JS 23.58 KB (8.90 KB gzip), CSS 16.75 KB (4.50 KB
  gzip), fonts 52.72 KB, hero 41.02 KB. The Lighthouse CLI did not complete in
  this disposable runner, so no new Lighthouse score is asserted; direct
  budget and interactive checks passed.

See [verification-2.md](verification-2.md) for exact commands, hashes, scope,
and the explicit **no defects found** result.

## Run, verify, and publish

```bash
npm ci
npm test
npm run typecheck
npm run build
npm pack --dry-run
npm pack
```

Deploy `dist/site/` as the static web root. The npm tarball is ready for the
factory publishing workflow; do not publish from this repository.

---


# Gesture Replay Kit — handoff

## Repair release — ready for Standard static deployment

Work order: `gesture-game-replay-repair-1`
Base: `8de9e9812b3128ca4a3ab0010436bc7325b87b71`
Completed: 2026-08-27

All findings in the independent report have been repaired:

- The bridge has an explicit production/development first-party origin
  allowlist, requires the opening detector window as its source, validates and
  copies every payload field before `LandmarkRecorder` sees it, and gives an
  on-page recovery message for untrusted, malformed, or non-monotonic frames.
  A standalone viewer guides users to JSON import/example recovery.
- Service-worker cache v2 precaches only fixed shell files and permits runtime
  caching only for query-free same-origin hashed assets. License-bearing URLs
  are network-only; license-bearing response URLs cannot be cached; activation
  removes the prior permissive cache. Checkout-return/pasted tokens are only
  stored after live verification succeeds.
- The static artifact carries one-year immutable caching for `/assets/*`, with
  HTML and `/sw.js` revalidating, plus CSP, Permissions-Policy (camera and
  microphone disabled), Referrer-Policy, and nosniff headers.
- The product uses the registered production endpoint
  `https://api.sociobot.in/api/v1/products/gesture-game-replay/checkout`.
  The live probe followed its 303 to a Dodo checkout session.

`dist/site/` is the Standard static deployment root. Publish it as-is; it
contains both portable `_headers` and Azure Static Web Apps
`staticwebapp.config.json` header policies.

Deployed and verified at https://gesture-game-replay.sociobot.in/ on
2026-08-27. Live HTML and `/sw.js` return CSP, Permissions-Policy, and
revalidation cache headers; live `assets/main-DSRSQGzt.js` returns
`public, max-age=31536000, immutable`.

---

# Original build handoff

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
- `npm test`: 13/13 passing, including exact bridge, service-worker/header,
  and live-checkout regressions.
- `npm run typecheck`: passed with strict TypeScript.
- `npm run build`: passed; ESM 12.82 KB, CJS 14.29 KB, declarations 4.35 KB, and `dist/site/index.html` produced.
- `npm pack --dry-run`: passed; 9 files, 9.2 KB compressed / 44.8 KB unpacked.
- Fresh packed consumer smoke tests: both CommonJS `require()` and ESM
  `import()` passed from a temporary clean install.
- Factory `verify-url.sh`: HTTP 200, title, `lang=en`, one h1, main landmark, image alt, labeled buttons, and zero browser console/page errors.
- Playwright bridge/PWA regression: trusted popup recorded one valid frame;
  malformed input displayed recovery text with zero page errors; a license
  canary URL produced no Cache Storage key. A foreign origin is rejected by
  the exact allowlist regression.
- Factory `verify-url.sh` against the clean production build: HTTP 200, title,
  `lang=en`, one h1, main landmark, alt text, and zero browser console/page
  errors. At 390×844 there was no horizontal overflow; axe-core WCAG
  A/AA/2.1 AA returned 0 violations.
- PWA service-worker activation cached only the fixed shell locally; the
  generated artifact includes cache v2 and the no-license cache guard.
- Live checkout check: production API returned 303 to
  `checkout.dodopayments.com/session/...`.
- Final live PWA check: after worker activation, a
  `?license=live-verification-canary` navigation left Cache Storage with only
  fixed shell URLs and no page errors.
- Lighthouse 12.8.2 mobile against the production build: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.5 s, CLS 0, TBT 70 ms. Lab INP was not available because the run had no user interaction; the interactive smoke test showed immediate playback/rule updates.
- Production asset budgets: initial JS 23.58 KB (8.90 KB gzip), CSS 16.75 KB (4.50 KB gzip), fonts 52.72 KB total, hero 41.02 KB.

## Known gaps and next steps

- Camera inference is intentionally not bundled: this product consumes detector landmarks and never handles video. The paid adapters are integration snippets, not detector models.
- The live product is registered and checkout is intentionally hosted by
  Sociobot/Dodo; no payment credentials are embedded in this repository.
- The viewer edits one predicate per rule for a compact v1 interface; the library already supports multi-predicate `all` rules for application and test-suite use.
- A future team tier could add encrypted fixture collections and engine-specific packages, but no cloud trace storage is part of v1.
