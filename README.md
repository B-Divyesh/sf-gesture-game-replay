# Gesture Replay Kit

Record landmarks, not people. Gesture Replay Kit is a tiny, dependency-free TypeScript library and local viewer for makers tuning webcam-controlled games and classroom toys. It turns MediaPipe-style pose/hand results into deterministic, shareable fixtures without retaining camera frames.

The free library includes recording, validation, replay, rule evaluation, comparison, and privacy-scrubbed JSON export. The local viewer at <https://gesture-game-replay.sociobot.in> imports those fixtures, visualizes confidence and occlusion, compares thresholds, and keeps all trace data in your browser tab.

## Install

```bash
npm install gesture-game-replay
```

Requires an evergreen browser or Node.js 18+. The package ships ESM, CommonJS, and TypeScript declarations with no runtime dependencies.

## Record a fixture

Pass only the landmark arrays returned by your detector. The recorder never accepts or stores video frames.

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

Rules compare normalized landmark coordinates (`0…1`) or confidence values. `holdForMs` removes one-frame spikes; results are deterministic for the same fixture and rule.

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

The documented examples are covered by tests. No telemetry, cloud storage, camera access, or runtime CDN is used. See [privacy](https://gesture-game-replay.sociobot.in/privacy/) and [terms](https://gesture-game-replay.sociobot.in/terms/).

For static deployment, run `npm run build` and publish `dist/site/` as the web root; `dist/site/index.html` is the entry point. Registry publishing is intentionally left to the factory: verify the package with `npm pack --dry-run`, then publish through the authorized release workflow.

## License

MIT © 2026 Sociobot (Param Factory). Font licenses are included alongside the self-hosted font files.
