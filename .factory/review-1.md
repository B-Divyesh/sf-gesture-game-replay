# Review 1 — replay gesture fixtures without retaining video

Audited 2026-09-05 for work order gesture-game-replay-review-1.

Implementation candidate reviewed: 7a58a7ece680e2bb8b2529c458f61a8ac84360e5 (last application change).
Documentation tip: c29b89b746676c6cdce70fb082db38a46bdc825a. The diff between them changes only the handoff and verification report. A fresh build of the tip matched the live root, service worker, and main bundle by SHA-256, so the live runtime is the implementation candidate.

Live URL: https://gesture-game-replay.sociobot.in/

## Verdict: FAIL

There are 6 findings and 15 untested public claims. This is not a PASS.

## Job, audience, and first action

The intended job is replaying pose or hand landmarks, comparing gesture rules, and exporting a scrubbed fixture without retaining video. The audience is indie game and classroom-toy makers using webcam input. The live first screen instead shows the headline “Replay the gesture. Not the person.” and offers “Open the workbench” or “Load example trace.”

The first screen does not meet the plain-words contract: its headline is not the job in the user's words, it does not name the audience, and its primary action does not explain that it loads safe sample data. The required “Try it with sample data” action is absent.

## Findings

### High — required claims manifest and claim tests are absent

.factory/claims.json does not exist. There are no declared claim commands, no one-test-per-claim mapping, and no sandbox proof for public promises. This is not an empty claim set. The following 15 distinct, testable public claims are unlisted and untested:

1. Captures landmark traces and compares gesture rules.
2. Does not retain video.
3. Pixels never enter the product.
4. Does not require an account.
5. JSON stays local.
6. Nothing uploads.
7. Raw video is not supported.
8. Scrubbed export normalizes time and removes source data.
9. Ships typed ESM and CommonJS entry points.
10. Has zero runtime dependencies.
11. Replay and rule results are deterministic.
12. The bridge accepts only allowlisted, validated messages and recovers from invalid input.
13. License tokens are verified before storage and are not service-worker cached.
14. The complete free workbench works offline.
15. There is no telemetry, cloud storage, camera access, or runtime CDN.

The README's example coverage and the 13 existing unit tests do not satisfy the claims contract because no tests are tagged or enumerated through the required manifest.

### High — the one-click sample is not the required isolated demo sandbox

Desktop and phone both load a realistic 41-frame anonymous-wave.fixture.json with one click. It remains in tab memory; the fresh sample flow left localStorage empty, and scrubbed export removed its source metadata. However, /demo returns the ordinary empty landing page and ?demo=1 leaves “No trace loaded.”

There is no persistent “Demo — sample data, nothing is saved” label, Reset demo, Start for real, separate demo: namespace, or .factory/demo.md. A visitor cannot identify, reset, or leave the required isolated sandbox.

### High — reduced-motion playback never advances

In a fresh 390×844 context with prefers-reduced-motion: reduce, loading the sample and pressing Play changed the button to Pause replay but time stayed at 0:00.000 after one second. With no motion preference, the same flow reached 0:00.483 in about 500 ms. The app rounds every animation-frame increment to 100 ms under reduced motion; normal roughly 16 ms frames repeatedly round to zero. This breaks the core replay path for users requesting reduced motion.

### Medium — no designed 404 route

/does-not-exist returns HTTP 200, the ordinary landing title, and the ordinary landing h1; it contains neither an error nor a way back. staticwebapp.config.json has only a navigation fallback and no 404 response override, and there is no 404.html. This is a missing required 404 experience, not an acceptable deliberate HTTP 404.

### Medium — first-screen plain-words and copy-audit requirements are unmet

The first screen includes “A motion lab without the footage,” a non-job headline, no named audience, and actions that do not state the sample outcome. .factory/copy-audit.md is absent, so the required sentence/word-count and terminology audit has not been provided.

### Medium — required social metadata and shared footer structure are missing

The live root has a title, description, canonical URL, favicon, lang, and theme color, but no Open Graph title/description/image, Twitter card, or Apple touch icon. Its footer lacks “Built by Param Factory” and a version/build ID. The header contains product anchors and GitHub but no Demo or Privacy link.

## Checks that passed

- A fresh non-local clone at c29b89b passed npm ci, npm audit --omit=dev --audit-level=high, npm test (13/13), npm run typecheck, npm run build, and npm pack --dry-run. npm pack produced a 9.2 KB tarball (44.8 KB unpacked).
- A separate clean consumer installed that tarball. ESM and CommonJS imports passed recording, interpolation, comparison, scrubbing/export parsing, and malformed-input smoke checks.
- Live desktop normal flow loaded the 41-frame sample, accepted keyboard Home/End seek, exported anonymous-wave.scrubbed.fixture.json, rejected malformed JSON with recovery text, and deleted the fixture after confirmation. The export had 41 frames, first time 0, no source, and no sample source value.
- Phone flow at 390×844 loaded the sample with no horizontal overflow. Normal-motion playback advanced. /privacy/ and /terms/ returned HTTP 200 with their own correct titles.
- The factory verify-url.sh passed on the live root: title, lang=en, one h1, main landmark, image alt text, labeled buttons, and no browser console/page errors. Playwright axe-core 4.13.0 integration found zero WCAG 2 A/AA/2.1 AA violations. The standalone npx axe Selenium runner could not locate Chrome, so the equivalent Playwright axe integration was used.
- Fresh normal loading requested only the product origin and self-hosted assets. There were no console/page errors and no camera permission request. A first-visit then offline fresh-page check displayed the offline notice and still allowed the sample to load and export.
- Live headers carry CSP, camera/microphone-denying Permissions-Policy, Referrer-Policy, and nosniff; the hashed main asset is immutable for one year. A license-canary navigation after service-worker activation stripped the URL and left Cache Storage with only fixed shell paths.

## Earlier findings and present disposition

| Earlier finding | Disposition | Evidence |
| --- | --- | --- |
| Untrusted/malformed bridge messages could corrupt a recording and crash export | Resolved | Current bridge code checks the first-party origin, opener source, and schema before recording; site bridge tests and the clean 13-test suite pass. |
| License token was retained in Cache Storage or persisted before verification | Resolved | Current canary navigation stripped the query; Cache Storage contained only /, /privacy/, /terms/, and /favicon.svg; current code verifies before storage. |
| Hashed assets lacked immutable caching | Resolved | Live main bundle returns Cache-Control: public, max-age=31536000, immutable. |
| CSP and Permissions-Policy were absent | Resolved | Live root includes CSP and Permissions-Policy disabling camera and microphone. |
| Earlier Lighthouse runner limitation | Not a current product defect | This review makes no Lighthouse score assertion. Direct budgets remain within limits: main JS 23.58 KB (8.90 KB gzip), CSS 16.75 KB (4.50 KB gzip), fonts 52.72 KB, hero 41.02 KB. |

## Live identity

| File | SHA-256 |
| --- | --- |
| / and built index.html | 5cb961b346169b9415c113d72c954bc6f345e3b85327918708b34ef94b3d94da |
| /sw.js and built sw.js | 8d47fe04301292bb54a5f6b10650ec6495ffe2340c10fad73c08b7b053482516 |
| live and built main JS | 1377069dd9fe6d62701a02d9fd0ab5b556e91a2cfbf194ced3e93e5b2c21cd4f |

Review artifacts generated outside the repository are in /tmp/gesture-game-replay-review.3VZeVR/evidence/.

## Required repair and re-review

Add the required claims manifest and isolated test for every public claim; implement a separately namespaced /demo or ?demo=1 sandbox with persistent label, reset, exit, and documentation; fix reduced-motion time accumulation; add a real 404; then bring the first screen, metadata, header/footer, and copy audit into the supplied contracts. Re-review from a clean checkout after repair.
