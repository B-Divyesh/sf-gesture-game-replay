import { FORMAT_VERSION } from './types';
import type { GestureFixture, Landmark, LandmarkFrame, RecorderFrame, RecorderOptions } from './types';

function cloneLandmarks(points: readonly Landmark[] | undefined): Landmark[] | undefined {
  return points?.map(({ x, y, z, visibility, presence }) => ({
    x, y,
    ...(z === undefined ? {} : { z }),
    ...(visibility === undefined ? {} : { visibility }),
    ...(presence === undefined ? {} : { presence }),
  }));
}

export class LandmarkRecorder {
  private readonly options: RecorderOptions;
  private startedAt: number | null = null;
  private lastTimestamp = -Infinity;
  private frames: LandmarkFrame[] = [];

  constructor(options: RecorderOptions = {}) {
    this.options = { ...options };
  }

  get isRecording(): boolean { return this.startedAt !== null; }

  start(timestamp = 0): void {
    if (!Number.isFinite(timestamp)) throw new TypeError('Start timestamp must be finite.');
    this.startedAt = timestamp;
    this.lastTimestamp = timestamp;
    this.frames = [];
  }

  addFrame(frame: RecorderFrame): void {
    if (this.startedAt === null) throw new Error('Start the recorder before adding frames.');
    if (!Number.isFinite(frame.timestamp)) throw new TypeError('Frame timestamp must be finite.');
    if (frame.timestamp < this.lastTimestamp) throw new RangeError('Frame timestamps must be monotonic.');
    if (!frame.pose && !frame.leftHand && !frame.rightHand) {
      throw new TypeError('A frame must include at least one landmark stream.');
    }

    this.lastTimestamp = frame.timestamp;
    this.frames.push({
      t: frame.timestamp - this.startedAt,
      ...(frame.pose ? { pose: cloneLandmarks(frame.pose) } : {}),
      ...(frame.leftHand ? { leftHand: cloneLandmarks(frame.leftHand) } : {}),
      ...(frame.rightHand ? { rightHand: cloneLandmarks(frame.rightHand) } : {}),
    });
  }

  stop(timestamp = this.lastTimestamp): GestureFixture {
    if (this.startedAt === null) throw new Error('The recorder is not running.');
    if (!Number.isFinite(timestamp) || timestamp < this.lastTimestamp) {
      throw new RangeError('Stop timestamp cannot be before the last frame.');
    }
    const duration = Math.max(0, timestamp - this.startedAt);
    const metadata = {
      ...(this.options.source ? { source: this.options.source } : {}),
      ...(this.options.notes ? { notes: this.options.notes } : {}),
      ...(this.options.consent === undefined ? {} : { consent: this.options.consent }),
      ...(this.options.deleteAfter ? { deleteAfter: this.options.deleteAfter } : {}),
      createdAt: new Date().toISOString(),
    };
    const fixture: GestureFixture = {
      format: FORMAT_VERSION,
      duration,
      frames: this.frames.map((frame) => ({ ...frame })),
      ...(Object.keys(metadata).length ? { metadata } : {}),
    };
    this.startedAt = null;
    return fixture;
  }

  clear(): void {
    this.startedAt = null;
    this.lastTimestamp = -Infinity;
    this.frames = [];
  }
}
