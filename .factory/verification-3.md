# Verification 3 — replay landmark traces without video

Verified 2026-09-05 for work order `gesture-game-replay-verify-3`.

- Implementation candidate: `d10ecb6de53d58928559ea347a481b4069b566c3`
- Documentation candidate: `4aea9aec7b51f829764ac646da819a13b6fd5278`
- Live URL: <https://gesture-game-replay.sociobot.in/>

## Verdict: FAIL

There are **3 findings** and **7 untested or incompletely tested public
claims**. The declared commands all pass, but the live viewer accepts fixture
JSON containing video and identity-like fields despite saying it never accepts
video. Several phone controls also miss the required 44 px touch target.

## Job, audience, and first action

Before scrolling on fresh desktop and 390 px phone browsers, the page says the
job is **“Replay landmark traces to tune gesture rules.”** It names game and
classroom-toy makers who need to fix missed moves without keeping player video.
The first action is **“Try it with sample data,”** followed by the explanation
that it loads a 41-frame wave trace to replay and compare.

## Findings

### High — fixture validation accepts and retains forbidden extra data

The public site says the viewer “never accepts video,” the README says the
recorder does not accept or store video frames, and `docs/format.md` says a
fixture contains no pixels, audio, face descriptors, names, or device
identifiers. The runtime validator checks required fields but does not reject
unknown root, frame, landmark, or metadata keys.

An installed-package probe passed this object through `parseFixture()` and
`stringifyFixture()` unchanged:

```json
{
  "format": "gesture-replay/v1",
  "duration": 0,
  "video": "raw-video-payload",
  "frames": [
    { "t": 0, "pose": [{ "x": 0.4, "y": 0.5, "faceDescriptor": "identifier" }] }
  ],
  "metadata": { "name": "Child Name", "deviceId": "camera-id" }
}
```

The fresh live demo also loaded a JSON fixture carrying those fields. It showed
`contains-sensitive-extra-fields.json` as the current fixture, reported
“Loaded 2 frames,” enabled export, and displayed the extra `faceDescriptor` in
the frame inspector. The data stays local and scrubbed export drops it, but the
input boundary and in-memory model still accept and retain data the published
format and privacy copy say cannot enter the product. This is especially
material for the stated child/player privacy use case.

Evidence: `src/validation.ts` accepts records without an allowed-key check;
`/work/.evidence/gesture-game-replay-verify-3/library-extra-field-acceptance.json`
and `live-extra-field-import.json` contain the observed results without a real
person's data.

### High — the claims manifest does not cover all public promises

All 16 entries in `.factory/claims.json` have one matching tag and every
declared command passed. Cross-checking the landing page, README, privacy page,
terms, and format guide found seven public promises that are missing or only
partly asserted by the tagged tests:

1. The fixture format excludes pixels, audio, face descriptors, names, and
   device identifiers. It is both unlisted and false for parsed input.
2. `LandmarkRecorder` records traces without retaining input references. This
   has an untagged unit check but no manifest entry.
3. `ReplayClock` advances at a chosen speed. This has an untagged unit check but
   no manifest entry.
4. `holdForMs` removes one-frame spikes. This has an untagged unit check but no
   manifest entry.
5. Scrubbing rounds coordinates and removes notes and dates. The tagged
   `scrubbed-export` test checks normalized time and `metadata.source`, but not
   rounding, notes, or dates.
6. Returned **and pasted** licenses are verified before storage and a valid
   license is rechecked at most daily. The tagged test covers only an invalid
   checkout-return token; it does not cover the pasted-token or daily-cache
   paths.
7. The $19 one-time Adapter Pack contains the stated MediaPipe, TensorFlow.js,
   and batch-manifest material, and refunded licenses become inactive. The
   checkout destination is tested, but the offer contents and revocation
   behavior have no manifest claim or sandbox test.

Under the attached claims contract, untagged tests do not substitute for a
manifest entry and its one tagged observable test.

### Medium — phone touch targets are smaller than 44 px

At a 390 × 844 CSS-pixel viewport, live bounding boxes measured 93 × 40.8 px
for **Reset demo**, 86 × 24.8 px for **Start for real**, about 24.8 px high for
the header links, 76 × 38.3 px for **Show code**, and 197 × 24 px for the replay
range input. These controls are operable and sufficiently spaced for
Lighthouse's tap-target audit, but they do not meet the attached accessibility
and design contracts' explicit 44 × 44 px minimum.

Evidence: `/work/.evidence/gesture-game-replay-verify-3/touch-and-resize.json`.

## Declared claim commands

The commands were run one by one from a fresh checkout of the implementation
SHA after `npm ci`. Each selected exactly one tagged test and passed.

| Claim | Result |
| --- | --- |
| `replay-and-compare` | PASS |
| `no-video-retention` | PASS |
| `no-pixels` | PASS |
| `no-account` | PASS |
| `local-json` | PASS |
| `no-upload` | PASS |
| `no-video-import` | PASS |
| `scrubbed-export` | PASS |
| `typed-module-entries` | PASS |
| `zero-runtime-dependencies` | PASS |
| `deterministic-results` | PASS |
| `bridge-validation` | PASS |
| `license-safety` | PASS |
| `offline-workbench` | PASS |
| `no-telemetry-or-cdn` | PASS |
| `free-core` | PASS |

Full output: `/work/.evidence/gesture-game-replay-verify-3/all-claim-commands.log`.

## Checks that passed

- Clean checkout: Node `22.23.2`, npm `10.9.8`; `npm ci` installed 128
  packages and reported zero vulnerabilities. `npm audit --omit=dev
  --audit-level=high` also reported zero vulnerabilities.
- `npm test`: 31/31 tests in four files passed. `npm run typecheck` and
  `npm run build` passed.
- `npm pack --dry-run`: 9 files, 9.4 kB packed, 45.4 kB unpacked. The declared
  consumer claim installed the tarball and ran ESM, CommonJS, and TypeScript
  imports in a fresh temporary project.
- Independent installed-library boundary probes returned documented errors for
  add-before-start, non-finite start, stop-before-last-frame, unsorted fixture,
  invalid speed, non-finite elapsed time while playing, and an empty rule.
- Live identity: the candidate build and live `/`, `/demo`, `/sw.js`,
  `/404.html`, main JS, and main CSS matched byte-for-byte by SHA-256.
- Live sample: the demo opened at frame 1 of 41 with its persistent sample
  label. Playback advanced, a threshold change altered disagreement output,
  and export produced 41 frames starting at `t=0` without source metadata.
- Demo isolation: a real-data sentinel and a license sentinel were unchanged.
  **Start for real** removed the `demo:` marker and opened an empty workbench.
  **Reset demo** restored the sample and frame 1.
- Invalid/recovery paths: malformed JSON and an MP4 were rejected without
  losing the loaded sample; canceling deletion retained the fixture and
  confirming removed it; bridge use without an opener gave recovery guidance;
  empty and invalid license restore paths gave useful messages and stored no
  invalid token.
- Phone/reduced motion: no horizontal page overflow at 390 px; playback reached
  0:00.600 in reduced-motion mode; Home, End, ArrowRight, and Space behavior
  worked. Desktop keyboard focus used the designed 3 px mustard outline and
  dark 5 px outer ring. A 200% root text-size probe retained all content with
  no page overflow.
- Accessibility: the factory `verify-url.sh` passed. Playwright axe 4.13.0
  reported zero WCAG 2 A/AA/2.1 AA violations on live demo, phone demo,
  privacy, terms, and 404 states. The pages have `lang=en`, one h1, main
  landmarks, skip links, labels, alt text, and route-specific titles.
- Offline: after service-worker activation, a fresh offline `/demo` reload
  retained the sample and enabled export. Cache Storage held only fixed shell
  URLs and no license/token URL.
- Privacy traffic: the full sample replay/export flow sent no non-GET requests
  and no request outside the product origin. No console or page errors occurred
  on normal desktop or phone flows.
- Routes and links: root, demo, privacy, terms, icons, social image, robots,
  sitemap, source links, and the checkout destination resolved. The unknown
  route returned the expected styled HTTP 404 with its own title and links.
- Headers: CSP, camera/microphone-denying Permissions-Policy, Referrer-Policy,
  nosniff, and HSTS are live. HTML and the service worker revalidate; hashed
  assets use `public, max-age=31536000, immutable`.
- Budgets: initial JS is 25.19 kB (9.42 kB gzip), CSS 17.55 kB (4.65 kB gzip),
  fonts total 52.72 kB, and the hero WebP is 41.02 kB.
- Lighthouse mobile completed in this run: performance 100, accessibility 100,
  best practices 100, SEO 100; FCP 1.00 s, LCP 1.36 s, CLS 0, TBT 23 ms.

## Earlier findings disposition

| Earlier finding | Current disposition |
| --- | --- |
| Untrusted or malformed bridge messages could corrupt export | Resolved; trusted-origin/source and schema tests pass. |
| License token entered Cache Storage or storage before verification | Resolved for the checkout-return path; invalid token was not stored or cached. Pasted-token and daily-cache claim coverage remains incomplete. |
| Hashed assets lacked immutable caching | Resolved live. |
| CSP and Permissions-Policy were absent | Resolved live. |
| Claims manifest and claim commands were absent | Partly resolved: all 16 declared commands pass, but seven public promises remain missing or incompletely tested. |
| Sample was not an isolated demo | Resolved live and in clean tests. |
| Reduced-motion replay froze | Resolved; live replay reached 0:00.600. |
| Unknown URLs returned the landing page | Resolved; the styled page returns HTTP 404. |
| First-screen plain wording and copy audit were missing | Resolved. |
| Social metadata and standard footer were missing | Resolved on the checked routes. |
| Lighthouse could not run in the prior runner | Resolved in this run with 100/100/100/100 category scores. |

## Required next work

Reject or strip unknown keys at every fixture level before returning or storing
parsed data, then add a regression test using video and identity-like extras.
Bring every public promise into `.factory/claims.json` with one complete tagged
test, and enlarge all non-inline phone controls to at least 44 × 44 CSS pixels.
Rebuild, deploy, and run a fresh verification.
