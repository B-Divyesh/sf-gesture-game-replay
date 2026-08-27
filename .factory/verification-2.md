# Independent verification 2 — PASS

Verified 2026-08-27 against candidate commit
`2de2ec5c48e9d9e379e3165e27374dde26df1f45` and
<https://gesture-game-replay.sociobot.in/>.

This is a fresh verification after the earlier failed report. The candidate was
checked from a clean, unmodified checkout. Only this report and the handoff
were changed.

## Verdict

**PASS.** The library and local-first viewer satisfy the researched
smallest-useful-product contract: they record landmark traces rather than
video, deterministically replay and compare rules, and export scrubbed
fixtures. The prior live bridge, license-cache, cache-header, CSP, and
Permissions-Policy findings are fixed and independently retested.

## Evidence

| Area | Result | Fresh evidence |
| --- | --- | --- |
| Install, tests, static checks | PASS | `npm ci` completed; production dependency audit reported 0 vulnerabilities; `npm test` passed 13/13 tests in 3 files; `npm run typecheck` passed. No lint command/configuration is present. |
| Exact production build | PASS | `npm run build` built ESM 12.82 KB, CJS 14.29 KB, declarations 4.35 KB, and `dist/site`. |
| Package consumer | PASS | `npm pack --dry-run` reported a 9.2 KB tarball / 44.8 KB unpacked, 9 files. A separate temporary consumer installed the packed tarball; ESM and CJS public imports exercised recording, interpolation, comparison, scrub/export parse round-trip, and malformed-JSON rejection. |
| Boundaries and invalid API input | PASS | Independently exercised add-before-start, non-finite start, non-monotonic timestamp, stop-before-last-frame, unsorted fixture, invalid replay speed/elapsed time, and an incomplete rule. Each produced the documented error path. |
| Desktop end-to-end | PASS | Production build loaded the synthetic trace, keyboard-scrubbed it, exported a scrubbed download (no source/notes; first `t=0`), rejected malformed JSON with recovery guidance, reloaded a trace, confirmed deletion, and exposed the no-opener bridge recovery state. |
| Accessibility and input | PASS | One `h1`, `lang=en`, title, main landmark, labels, image alt text, live status, skip link, and designed focus ring were present. Playwright axe WCAG 2 A/AA/2.1 AA found 0 serious/critical findings on loaded desktop and live mobile states. Keyboard arrow seek and Space playback work outside fields; focus is visible. |
| Mobile and motion | PASS | At 390×844 the loaded viewer had no horizontal overflow. `prefers-reduced-motion: reduce` playback advanced in 100 ms steps rather than smooth movement. |
| Errors | PASS | No console or page errors in the local production flow or a standard-CSP live production flow. |
| Privacy and outbound behavior | PASS | Normal live loading requested only the product origin. Source/bundle review found no analytics, trackers, runtime CDN assets, camera API, video input, or fixture upload. The sole functional external network path is Sociobot license verification, plus the explicit checkout and GitHub links. Landmark imports stay in tab memory; free use does not write local storage. |
| PWA/offline and token safety | PASS | Live worker `gesture-replay-shell-v2` activated. Cache Storage contained no license/token URL; offline reload rendered the shell. Worker source uses a versioned cache, `skipWaiting`, stale-cache cleanup, and network-only license-bearing requests. |
| Live identity | PASS | SHA-256 matched candidate `dist/site` and live `/`, `/sw.js`, and `/assets/main-DSRSQGzt.js`: `5cb961b346169b9415c113d72c954bc6f345e3b85327918708b34ef94b3d94da`, `8d47fe04301292bb54a5f6b10650ec6495ffe2340c10fad73c08b7b053482516`, and `1377069dd9fe6d62701a02d9fd0ab5b556e91a2cfbf194ced3e93e5b2c21cd4f`, respectively. |
| Live headers and caching | PASS | Live HTML and `/sw.js` return `Cache-Control: public, max-age=0, must-revalidate`; the hashed main bundle returns `public, max-age=31536000, immutable`. HTML, SW, and assets return CSP, Permissions-Policy disabling camera/microphone, Referrer-Policy, nosniff, and HSTS. |
| Bundle budgets | PASS | Initial JS 23.58 KB (8.90 KB gzip) ≤ 200 KB; CSS 16.75 KB (4.50 KB gzip) ≤ 50 KB; self-hosted fonts total 52.72 KB ≤ 120 KB; hero WebP 41.02 KB ≤ 300 KB. |

The one-off Lighthouse CLI run could not complete in this disposable runner
after Chromium launch, so no new Lighthouse score is claimed here. Its
performance budgets were instead directly measured from the exact production
artifact as above; interactive browser checks were performed under the mobile
viewport.

## Defects by severity

None found in the candidate or its matching live deployment.

## Reproduce

```bash
npm ci
npm audit --omit=dev --audit-level=high
npm test
npm run typecheck
npm run build
npm pack --dry-run
```

Serve `dist/site/` with a static server for local browser checks. Publishable
library contents are produced by `npm pack`; registry publication remains
owned by the factory.

