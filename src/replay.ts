import type { GestureFixture, Landmark, LandmarkFrame } from './types';

function mix(a: number | undefined, b: number | undefined, ratio: number): number | undefined {
  if (a === undefined || b === undefined) return a ?? b;
  return a + (b - a) * ratio;
}

function interpolatePoints(a: Landmark[] | undefined, b: Landmark[] | undefined, ratio: number): Landmark[] | undefined {
  if (!a || !b || a.length !== b.length) return a ?? b;
  return a.map((point, index) => {
    const next = b[index] as Landmark;
    const z = mix(point.z, next.z, ratio);
    const visibility = mix(point.visibility, next.visibility, ratio);
    const presence = mix(point.presence, next.presence, ratio);
    return {
      x: mix(point.x, next.x, ratio) as number,
      y: mix(point.y, next.y, ratio) as number,
      ...(z === undefined ? {} : { z }),
      ...(visibility === undefined ? {} : { visibility }),
      ...(presence === undefined ? {} : { presence }),
    };
  });
}

export function frameAt(fixture: GestureFixture, time: number): LandmarkFrame | null {
  if (!fixture.frames.length) return null;
  const clamped = Math.max(0, Math.min(time, fixture.duration));
  let low = 0;
  let high = fixture.frames.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if ((fixture.frames[mid]?.t ?? 0) <= clamped) low = mid;
    else high = mid - 1;
  }
  const before = fixture.frames[low] as LandmarkFrame;
  const after = fixture.frames[low + 1];
  if (!after || after.t === before.t || clamped <= before.t) return { ...before, t: clamped };
  const ratio = (clamped - before.t) / (after.t - before.t);
  return {
    t: clamped,
    ...(before.pose || after.pose ? { pose: interpolatePoints(before.pose, after.pose, ratio) } : {}),
    ...(before.leftHand || after.leftHand ? { leftHand: interpolatePoints(before.leftHand, after.leftHand, ratio) } : {}),
    ...(before.rightHand || after.rightHand ? { rightHand: interpolatePoints(before.rightHand, after.rightHand, ratio) } : {}),
  };
}

export class ReplayClock {
  time = 0;
  speed = 1;
  playing = false;

  constructor(public readonly duration: number) {}

  play(): void { this.playing = true; }
  pause(): void { this.playing = false; }
  seek(time: number): number { this.time = Math.max(0, Math.min(time, this.duration)); return this.time; }
  setSpeed(speed: number): void {
    if (!Number.isFinite(speed) || speed <= 0) throw new RangeError('Replay speed must be greater than zero.');
    this.speed = speed;
  }
  tick(elapsedMs: number): number {
    if (!this.playing) return this.time;
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) throw new RangeError('Elapsed time must be non-negative.');
    this.time = Math.min(this.duration, this.time + elapsedMs * this.speed);
    if (this.time >= this.duration) this.playing = false;
    return this.time;
  }
}
