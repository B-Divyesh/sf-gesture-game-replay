# Gesture Replay Kit

Gesture Replay Kit helps game and classroom-toy makers replay landmark traces and tune gesture rules without keeping video. It is a TypeScript library with a local browser viewer for MediaPipe-style pose and hand results.

Try the [41-frame sample sandbox](https://gesture-game-replay.sociobot.in/demo) first. It opens without an account and shows a populated workbench. You can replay a wave, compare two rules, and export a scrubbed fixture. Demo data uses a separate `demo:` browser-storage namespace and never becomes real workbench data.

The free library records landmarks, validates fixtures, replays frames, compares rules, and exports scrubbed JSON. The local viewer at <https://gesture-game-replay.sociobot.in> imports those fixtures, shows confidence and occlusion, and compares thresholds. Fixture data stays in browser-tab memory.

## Install

```bash
npm install gesture-game-replay
```

Requires an evergreen browser or Node.js 18+. The package ships ESM, CommonJS, and TypeScript declarations with no runtime dependencies.

## Record a fixture

Pass only the landmark arrays returned by your detector. The recorder does not accept or store video frames.

```ts
import { LandmarkRecorder } from 'gesture-game-replay';

const recorder = new LandmarkRecorder({ source: 'mediapipe-pose' });
recorder.start(1_000);
recorder.addFrame({
  timestamp: 1_016,
  pose: [{ x: 0.42, y: 0.24, visibility: 0.98 }],
});
const fixture = recorder.stop(1_032);
```

## Replay and compare rules

Rules compare normalized landmark coordinates (`0…1`) or confidence values. `holdForMs` removes one-frame spikes. The same fixture and rule return the same result.

```ts
import { compareRules, frameAt } from 'gesture-game-replay';

const raised = {
  id: 'raised',
  label: 'Hand raised',
  all: [{ stream: 'pose', index: 0, axis: 'y', op: 'lt', value: 0.35 }],
  holdForMs: 80,
} as const;

const strict = {
  ...raised,
  id: 'raised-strict',
  label: 'Hand raised (strict)',
  all: [
    ...raised.all,
    { stream: 'pose', index: 0, axis: 'visibility', op: 'gte', value: 0.9 },
  ],
} as const;

const atHalfSecond = frameAt(fixture, 500);
const comparison = compareRules(fixture, raised, strict);
console.log(atHalfSecond, comparison.disagreements);
```

## Export a scrubbed fixture

Scrubbing normalizes time to zero, rounds coordinates, removes optional notes/source metadata, and returns a fresh object. Core export is always free in the viewer.

```ts
import { scrubFixture, stringifyFixture } from 'gesture-game-replay';

const safeCopy = scrubFixture(fixture, { precision: 4 });
const json = stringifyFixture(safeCopy);
```

Landmark traces can still be biometric data. Get consent, collect only the joints you need, set a deletion policy, and never use this package for identity, face, or age inference.

## Format

Fixtures use the versioned `gesture-replay/v1` JSON format. See [`docs/format.md`](docs/format.md) for the complete schema and validation behavior.

## Develop, test, and package

```bash
npm ci
npm test
npm run build       # library -> dist/lib; static site -> dist/site
npm pack            # ready-to-publish tarball; factory owns publishing
npm run dev         # local viewer
```

`npm test` builds the site and runs unit, browser-sandbox, and packed-consumer checks. Every public product claim is listed in [`.factory/claims.json`](.factory/claims.json) and can be run independently with its documented command. No telemetry, cloud storage, camera access, or runtime CDN is used. See [privacy](https://gesture-game-replay.sociobot.in/privacy/) and [terms](https://gesture-game-replay.sociobot.in/terms/).

## Viewer bridge and Adapter Pack

The optional viewer bridge accepts only complete landmark messages from an explicit first-party allowlist and from the detector window that opened the viewer. Invalid or untrusted messages are discarded with an on-page recovery message; importing JSON always remains available. The $19 Adapter Pack uses the registered live Sociobot checkout at `https://api.sociobot.in/api/v1/products/gesture-game-replay/checkout`. Checkout-return and pasted tokens are verified before local storage; the service worker never caches license-bearing URLs or responses.

For static deployment, run `npm run build` and publish `dist/site/` as the web root; `dist/site/index.html` is the entry point. Registry publishing is intentionally left to the factory: verify the package with `npm pack --dry-run`, then publish through the authorized release workflow.

## License

MIT © 2026 Sociobot (Param Factory). Font licenses are included alongside the self-hosted font files.
