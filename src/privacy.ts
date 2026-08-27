import type { FixtureMetadata, GestureFixture, Landmark, ScrubOptions } from './types';

const round = (value: number, precision: number) => Number(value.toFixed(precision));

function scrubPoint(point: Landmark, precision: number): Landmark {
  return Object.fromEntries(Object.entries(point).map(([key, value]) => [key, round(value, precision)])) as unknown as Landmark;
}

export function scrubFixture(fixture: GestureFixture, options: ScrubOptions = {}): GestureFixture {
  const precision = Math.max(0, Math.min(8, Math.floor(options.precision ?? 4)));
  const offset = fixture.frames[0]?.t ?? 0;
  const metadata: FixtureMetadata = {
    ...(options.keepSource && fixture.metadata?.source ? { source: fixture.metadata.source } : {}),
    ...(options.keepNotes && fixture.metadata?.notes ? { notes: fixture.metadata.notes } : {}),
    ...(fixture.metadata?.consent === undefined ? {} : { consent: fixture.metadata.consent }),
    ...(options.keepDates && fixture.metadata?.createdAt ? { createdAt: fixture.metadata.createdAt } : {}),
    ...(options.keepDates && fixture.metadata?.deleteAfter ? { deleteAfter: fixture.metadata.deleteAfter } : {}),
  };
  return {
    format: fixture.format,
    duration: round(Math.max(0, fixture.duration - offset), precision),
    frames: fixture.frames.map((frame) => ({
      t: round(frame.t - offset, precision),
      ...(frame.pose ? { pose: frame.pose.map((point) => scrubPoint(point, precision)) } : {}),
      ...(frame.leftHand ? { leftHand: frame.leftHand.map((point) => scrubPoint(point, precision)) } : {}),
      ...(frame.rightHand ? { rightHand: frame.rightHand.map((point) => scrubPoint(point, precision)) } : {}),
    })),
    ...(Object.keys(metadata).length ? { metadata } : {}),
  };
}

export function stringifyFixture(fixture: GestureFixture, space = 2): string {
  return JSON.stringify(fixture, null, Math.max(0, Math.min(10, space)));
}
