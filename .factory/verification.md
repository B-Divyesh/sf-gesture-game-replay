# Independent verification — FAIL

Verified 2026-08-27 against candidate commit
`3f0d76564365f5fe3167b229cf56a92b86905b72` and
`https://gesture-game-replay.sociobot.in/`.

The live deployment is the candidate: SHA-256 values matched for `/`,
`/privacy/`, `/terms/`, `/sw.js`, `/favicon.svg`, `/robots.txt`,
`/sitemap.xml`, and every built asset (including `main-D8kKDsG-.js`).

## Release-gate results

| Check | Result | Evidence |
| --- | --- | --- |
| Clean checkout/install | PASS | Detached clean clone at the requested SHA; `npm ci` completed with 0 audit vulnerabilities. |
| Unit tests | PASS | `npm test`: 8/8 Vitest tests passed. |
| Type/lint | PASS / N/A | `npm run typecheck` passed. No lint script/configuration is provided by the repository. |
| Exact production build | PASS | `npm run build` generated `dist/lib` and `dist/site`. Initial JS 21.01 KB (8.07 KB gzip), CSS 16.75 KB (4.50 KB gzip), fonts 52.72 KB total, and hero 41.02 KB: all stated budgets pass. |
| Package readiness | PASS | `npm pack` produced a 9.0 KB tarball; a new consumer installed it with no production dependencies. ESM and CJS recording/replay/comparison/scrub/parse smoke tests passed. |
| Desktop product flow | PASS | Chromium loaded the example, played it, changed a threshold, reported disagreements, exported a scrubbed file, confirmed deletion, rejected malformed imported JSON, and recovered by loading an example. No normal-flow console/page errors. |
| Mobile, keyboard, motion | PASS | At 390×844 there was no horizontal overflow. With reduced motion, keyboard focus on the timeline supported ArrowRight seek and Space play/pause. Visible keyboard focus was a 3 px mustard outline. |
| Accessibility | PASS | axe-core WCAG A/AA/2.1 AA found 0 serious/critical (or any) violations in desktop empty/loaded and mobile loaded states. The routes have title, `lang=en`, one h1, and main landmarks. |
| Offline/PWA | PASS with note | After SW activation, an offline reload displayed the shell and offline notice. The checked-in SW uses a versioned cache, `skipWaiting`, and cleanup; a distinct future release artifact was not available for a cross-version upgrade simulation. |
| Local-first/outbound normal path | PASS | Initial production-load requests were only same-origin HTML, self-hosted fonts, JS, CSS, and hero image. Source review found no camera API, analytics, CDN script/font, or fixture upload. |
| Lighthouse | PASS | Local production build, mobile preset: performance 99, accessibility 100, best practices 100, SEO 100; FCP 1.19 s, LCP 1.60 s, CLS 0, TBT 67 ms. |

## Release-blocking defects

### Medium — any origin can inject malformed bridge frames and break export

The advertised local `postMessage` bridge accepts messages without checking
`event.origin` and casts `message.frame` directly to `RecorderFrame` without
schema validation. On the live site, while recording, a synthetic
`MessageEvent` with `origin: https://untrusted.example` was accepted:

```
Recording landmarks… 1 frames captured.
```

An equally foreign malformed frame `{ timestamp, pose: [{}] }` was also
accepted (`2 frames captured`). Clicking **Export scrubbed** then emitted this
uncaught page error:

```
Cannot read properties of undefined (reading 'toFixed')
```

This violates the required malformed-input/recovery behavior and lets an
untrusted opener/window corrupt a recording. Validate frame landmarks before
recording and restrict bridge messages to an explicit trusted origin/source
handshake; errors must remain recoverable in the UI.

### Medium — raw license token is persisted in Cache Storage

The service worker caches every same-origin GET request. With an activated
live service worker, visiting `/?license=verification-canary-9bd05f` stripped
the URL from the address bar but left this persistent Cache Storage key:

```
https://gesture-game-replay.sociobot.in/?license=verification-canary-9bd05f
```

The viewer also writes a returned token to localStorage before verification.
The privacy policy says the token is stored under the named local-storage key;
it does not disclose a raw token in the service-worker cache. Do not cache
license-bearing navigations (and preferably accept return tokens without
persisting an unverified token).

### Medium — live hashed assets miss the immutable-cache deployment budget

The built `_headers` declares immutable one-year asset caching, but the live
main JS and service worker respond with:

```
Cache-Control: public, must-revalidate, max-age=30
```

The live asset is byte-identical and content-hashed, so this is a deployment
configuration failure against the required long-lived immutable asset-cache
policy. Configure the deployment to send `public, max-age=31536000, immutable`
for `/assets/*`, while keeping HTML and `/sw.js` revalidating.

### Low — live response headers omit CSP and Permissions-Policy

Observed protections include HSTS, `nosniff`, and Referrer-Policy. Content-
Security-Policy and Permissions-Policy were absent from HTML, JS, and SW
responses. Add a CSP suitable for the self-hosted static app and explicitly
disable unused camera/microphone permissions to reinforce the privacy claim.

## Commands and probes

```bash
npm ci
npm audit --omit=dev
npm test
npm run typecheck
npm run build
npm pack --dry-run
npm pack
```

Chromium/Playwright probes covered desktop and 390 px mobile, keyboard use,
reduced motion, normal flow, malformed JSON recovery, export/deletion, axe,
console/page errors, offline reload, outbound requests, and the bridge and
license-cache negative cases. `curl` verified HTTPS headers/cache behavior;
SHA-256 comparison verified every published file against `dist/site`.

## Verdict

**FAIL.** Do not promote this candidate until the two data-handling defects
and live immutable-cache configuration are corrected and independently
retested.
