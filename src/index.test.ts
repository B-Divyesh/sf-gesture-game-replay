import { describe, expect, it } from 'vitest';
import {
  compareRules, evaluateRule, FixtureValidationError, frameAt, LandmarkRecorder,
  parseFixture, ReplayClock, scrubFixture, stringifyFixture, summarizeFrame,
} from './index';
import type { GestureFixture, GestureRule } from './index';

const fixture: GestureFixture = {
  format: 'gesture-replay/v1',
  duration: 300,
  frames: [
    { t: 0, pose: [{ x: 0.4, y: 0.5, visibility: 1 }] },
    { t: 100, pose: [{ x: 0.4, y: 0.3, visibility: 0.8 }] },
    { t: 200, pose: [{ x: 0.4, y: 0.2, visibility: 0.95 }] },
    { t: 300, pose: [{ x: 0.4, y: 0.6, visibility: 0.4 }] },
  ],
  metadata: { source: 'test', notes: 'remove me', consent: true, createdAt: '2026-01-01' },
};

const raised: GestureRule = {
  id: 'raised', label: 'Hand raised', holdForMs: 80,
  all: [{ stream: 'pose', index: 0, axis: 'y', op: 'lt', value: 0.35 }],
};

describe('LandmarkRecorder', () => {
  it('records the README example without retaining input references', () => {
    const recorder = new LandmarkRecorder({ source: 'mediapipe-pose' });
    const pose = [{ x: 0.42, y: 0.24, visibility: 0.98 }];
    recorder.start(1_000);
    recorder.addFrame({ timestamp: 1_016, pose });
    pose[0]!.x = 1;
    const recorded = recorder.stop(1_032);
    expect(recorded.duration).toBe(32);
    expect(recorded.frames[0]?.pose?.[0]?.x).toBe(0.42);
    expect(recorded.metadata?.source).toBe('mediapipe-pose');
  });

  it('rejects missing streams and timestamps that run backward', () => {
    const recorder = new LandmarkRecorder();
    recorder.start(10);
    expect(() => recorder.addFrame({ timestamp: 11 })).toThrow(/landmark stream/);
    recorder.addFrame({ timestamp: 12, pose: [] });
    expect(() => recorder.addFrame({ timestamp: 11, pose: [] })).toThrow(/monotonic/);
  });
});

describe('replay', () => {
  it('interpolates matching landmark streams', () => {
    expect(frameAt(fixture, 150)?.pose?.[0]).toMatchObject({ y: 0.25, visibility: 0.875 });
    expect(frameAt({ ...fixture, frames: [] }, 1)).toBeNull();
  });

  it('advances at a chosen speed and stops at the end', () => {
    const clock = new ReplayClock(100);
    clock.setSpeed(2);
    clock.play();
    expect(clock.tick(25)).toBe(50);
    expect(clock.tick(30)).toBe(100);
    expect(clock.playing).toBe(false);
  });
});

describe('rules', () => {
  it('applies hold time and produces stable segments', () => {
    const result = evaluateRule(fixture, raised);
    expect(result.frames.map(({ active }) => active)).toEqual([false, false, true, false]);
    expect(result.segments).toEqual([{ start: 200, end: 300 }]);
  });

  it('reports disagreements between thresholds', () => {
    const strict: GestureRule = {
      ...raised, id: 'strict', label: 'Strict',
      all: [...raised.all, { stream: 'pose', index: 0, axis: 'visibility', op: 'gte', value: 0.99 }],
    };
    expect(compareRules(fixture, raised, strict).disagreements).toEqual([
      { start: 200, end: 300, a: true, b: false },
    ]);
  });
});

describe('validation, inspection, and privacy', () => {
  it('parses a serialized fixture and explains malformed input', () => {
    expect(parseFixture(stringifyFixture(fixture))).toEqual(fixture);
    expect(() => parseFixture('{')).toThrow(FixtureValidationError);
    expect(() => parseFixture('{"format":"wrong","frames":[]}')).toThrow(/format/);
  });

  it('summarizes occlusion and scrubs metadata, dates, precision, and time', () => {
    expect(summarizeFrame(fixture.frames[3]!)).toEqual({ mean: 0.4, observed: 1, occluded: 1, total: 1 });
    const scrubbed = scrubFixture({ ...fixture, duration: 310, frames: fixture.frames.map((f) => ({ ...f, t: f.t + 10 })) }, { precision: 2 });
    expect(scrubbed.frames[0]?.t).toBe(0);
    expect(scrubbed.duration).toBe(300);
    expect(scrubbed.metadata).toEqual({ consent: true });
    expect(scrubbed).not.toBe(fixture);
  });
});
