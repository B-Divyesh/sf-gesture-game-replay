# Gesture Replay Kit — repair 2 handoff

## Release status

**PASS — deployed and verified.**

- Implementation commit: `7626102cf449bae63df1bccea54b0b45f0afbfe2`
- Previous reviewed implementation: `7a58a7ece680e2bb8b2529c458f61a8ac84360e5`
- Previous report/documentation commit: `5081d39f8181e98075f2398498980b6c3824f991`
- Live URL: <https://gesture-game-replay.sociobot.in/>
- Static artifact deployed: `dist/site/` on 2026-09-05

The job is to replay recorded pose or hand landmark traces, compare gesture
rules, and export a scrubbed fixture without retaining video. It serves indie
game and classroom-toy makers who tune webcam-input games.

The landing-page first screen now states that job, names the audience, and
starts with **Try it with sample data**. It says that clicking loads a
41-frame wave trace to replay and compare.

## What changed

- Added `.factory/claims.json` with 16 public claims, exactly one tagged,
  outcome-based check per claim, and clean-consumer coverage for ESM, CommonJS,
  declarations, and zero runtime dependencies.
- Added `/demo`, which immediately opens a populated 41-frame sample workbench.
  The persistent **Demo — sample data, nothing is saved** banner includes
  reset and exit controls. Demo state uses only
  `demo:gesture-game-replay:session`; it skips license initialization and
  never reads or writes real-workbench fixture data. See `.factory/demo.md`.
- Fixed reduced-motion replay by accumulating sub-100 ms animation deltas and
  moving time in 100 ms steps. Playback no longer freezes.
- Added a styled, deliberate HTTP 404 page plus a Static Web Apps response
  override. `/does-not-exist` returns HTTP 404, its own title, one h1, and
  home/demo links.
- Rewrote first-screen copy and added `.factory/copy-audit.md`.
- Added route-specific social metadata, Twitter metadata, 1200×630 social art,
  Apple touch icon, Demo/Privacy header links, and the standard Param Factory
  footer with version ID on every page.
- Kept the prior bridge validation, license-cache guard, immutable assets,
  CSP, and camera/microphone Permissions-Policy protections intact. The service
  worker cache is now v3 and includes the offline demo shell.

The social image and Apple icon are crops of the product’s existing original
paper-diorama artwork; provenance is recorded in `.factory/design.md`.

## Verification

From a separate clean clone of `7626102`:

```bash
npm ci
npm audit --omit=dev --audit-level=high
npm test
npm run typecheck
npm run build
npm pack --dry-run
```

All passed: audit had zero vulnerabilities; `npm test` passed 31 tests; build
produced `dist/lib` and `dist/site`; the package dry run contained 9 files,
9.4 KB compressed / 45.3 KB unpacked. The clean consumer test installed the
tarball and exercised ESM, CommonJS, and TypeScript imports.

Every command declared in `.factory/claims.json` was then run independently
from that clean clone. All 16 passed. The browser checks use new contexts;
the offline claim uses a dedicated context, warms `/demo`, calls
`setOffline(true)`, reloads, and exports the sample.

Local and live browser checks covered normal sample replay, malformed/video
import recovery, scrubbed download parsing, demo reset/exit isolation,
keyboard controls, 390×844 layout, reduced motion, offline demo reload,
outbound-request recording, and 404. `verify-url.sh` passed live with title,
`lang=en`, one h1, main landmark, image alt text, labelled buttons, and no
root-page console/page errors. Playwright axe checks found zero WCAG 2 A/AA/
2.1 AA violations on live desktop root, live phone demo, and the 404 page.

Live evidence:

- `/`, `/demo`, `/privacy/`, and `/terms/` return 200 with their intended
  titles. `/does-not-exist` returns a designed HTTP 404. Chromium reports the
  expected failed-document 404 console resource message for that deliberate
  status; it is not a product error.
- Fresh phone demo loaded `Sample — anonymous-wave.fixture.json`, reached
  frame 6 under normal playback, had no horizontal overflow, and sent requests
  only to the product origin. Reduced-motion playback reached `0:00.600`.
- After service-worker activation, an offline `/demo` reload restored frame 1
  and left **Export scrubbed** enabled.
- CSP, Permissions-Policy, Referrer-Policy, and nosniff headers are live;
  hashed assets have `public, max-age=31536000, immutable`.
- Current direct budgets: initial JS 25.18 KB (9.42 KB gzip), CSS 17.55 KB
  (4.65 KB gzip), self-hosted fonts 52.72 KB, hero image 41.02 KB, and social
  card image 30.71 KB. The Lighthouse CLI could not complete in this runner
  because the bundled Chromium tab crashed; no new Lighthouse score is claimed.

The active paid offer remains the live **Adapter Pack — $19 one-time** offer.
Its checkout endpoint returned its expected hosted-checkout redirect. Public
offer metadata is at `/work/.evidence/billing-offer.json`; no payment or
provider credential is stored in this repository.

## Earlier findings disposition

| Finding | Current disposition |
| --- | --- |
| Claims manifest and proof missing | Resolved: 16 manifest entries and independently runnable tagged outcome tests. |
| Sample was not an isolated sandbox | Resolved: direct `/demo`, sample banner, reset/exit, namespace, docs, and isolation checks. |
| Reduced-motion replay froze | Resolved: accumulated stepped clock regression test passes locally and live. |
| Unknown URL showed landing page | Resolved: response override serves the styled 404 with HTTP 404. |
| First screen and copy audit failed | Resolved: job/audience/action/facts wording and audited terminology. |
| Social metadata/footer structure missing | Resolved on root, legal pages, and 404. |
| Bridge message validation | Still resolved; trusted/malformed outcomes are tested. |
| License cache and pre-verification storage | Still resolved; delayed-invalid-token and Cache Storage test passes. |
| Immutable caching, CSP, Permissions-Policy | Still resolved and confirmed against live HTTPS headers. |

## Publish and deploy

```bash
npm ci
npm test
npm run build
npm pack
```

Publish `dist/site/` as the static web root. `npm pack` produces the
ready-to-publish library artifact; registry publication remains factory-owned.

## Known limits

- The product deliberately consumes landmarks only. It does not provide camera
  inference, video handling, identity recognition, face identification, or age
  estimation.
- The Adapter Pack is a licensed snippet pack, not detector models or cloud
  fixture storage.
- A fresh Lighthouse score is not recorded because this runner’s Chromium tab
  crashed. Direct asset budgets and browser accessibility/performance-path
  checks are recorded above.
