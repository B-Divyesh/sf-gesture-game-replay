import type { Landmark, RecorderFrame } from '../src/types';

/**
 * The viewer is deliberately not a general-purpose message sink. A detector
 * must run on one of these first-party origins and open/embed the viewer so
 * the receiving window can bind the message source for the recording session.
 */
export const TRUSTED_BRIDGE_ORIGINS = Object.freeze([
  'https://gesture-game-replay.sociobot.in',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
] as const);

const STREAMS = ['pose', 'leftHand', 'rightHand'] as const;
const LANDMARK_KEYS = new Set(['x', 'y', 'z', 'visibility', 'presence']);
const FRAME_KEYS = new Set(['timestamp', ...STREAMS]);
const MESSAGE_KEYS = new Set(['type', 'frame']);
const MAX_LANDMARKS_PER_STREAM = 100;

type SafeRecord = Record<string, unknown>;

export type BridgePayloadResult =
  | { ok: true; frame: RecorderFrame }
  | { ok: false; reason: string };
type BridgeFailure = Extract<BridgePayloadResult, { ok: false }>;

function isPlainRecord(value: unknown): value is SafeRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyKeys(value: SafeRecord, allowed: Set<string>): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function readFinite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function validateLandmark(value: unknown, path: string): Landmark | BridgeFailure {
  if (!isPlainRecord(value) || !hasOnlyKeys(value, LANDMARK_KEYS)) {
    return { ok: false, reason: `${path} must be a landmark object with supported fields.` };
  }
  const x = readFinite(value.x);
  const y = readFinite(value.y);
  if (x === null || y === null) return { ok: false, reason: `${path} requires finite x and y values.` };
  const landmark: Landmark = { x, y };
  for (const key of ['z', 'visibility', 'presence'] as const) {
    if (value[key] === undefined) continue;
    const number = readFinite(value[key]);
    if (number === null) return { ok: false, reason: `${path}.${key} must be finite when supplied.` };
    landmark[key] = number;
  }
  return landmark;
}

function isFailure(value: Landmark | BridgeFailure): value is BridgeFailure {
  return 'ok' in value && value.ok === false;
}

/** Validate and copy the complete, intentionally tiny bridge protocol. */
export function validateBridgePayload(value: unknown): BridgePayloadResult {
  try {
    if (!isPlainRecord(value) || !hasOnlyKeys(value, MESSAGE_KEYS) || value.type !== 'gesture-replay:frame') {
      return { ok: false, reason: 'Expected a gesture-replay:frame message.' };
    }
    if (!isPlainRecord(value.frame) || !hasOnlyKeys(value.frame, FRAME_KEYS)) {
      return { ok: false, reason: 'The bridge frame contains unsupported fields.' };
    }
    const timestamp = readFinite(value.frame.timestamp);
    if (timestamp === null || timestamp < 0) return { ok: false, reason: 'Frame timestamp must be a non-negative finite number.' };

    const frame: RecorderFrame = { timestamp };
    let streamCount = 0;
    for (const stream of STREAMS) {
      const incoming = value.frame[stream];
      if (incoming === undefined) continue;
      if (!Array.isArray(incoming) || incoming.length > MAX_LANDMARKS_PER_STREAM) {
        return { ok: false, reason: `${stream} must contain at most ${MAX_LANDMARKS_PER_STREAM} landmarks.` };
      }
      const landmarks: Landmark[] = [];
      for (let index = 0; index < incoming.length; index += 1) {
        const landmark = validateLandmark(incoming[index], `${stream}[${index}]`);
        if (isFailure(landmark)) return landmark;
        landmarks.push(landmark);
      }
      frame[stream] = landmarks;
      streamCount += 1;
    }
    return streamCount ? { ok: true, frame } : { ok: false, reason: 'Frame must include pose, leftHand, or rightHand landmarks.' };
  } catch {
    // Synthetic MessageEvents can carry hostile accessors; keep the viewer recoverable.
    return { ok: false, reason: 'Bridge data could not be read safely.' };
  }
}

export function isTrustedBridgeOrigin(origin: string): boolean {
  return (TRUSTED_BRIDGE_ORIGINS as readonly string[]).includes(origin);
}

export function isTrustedBridgeSource(
  source: MessageEventSource | null,
  opener: Window | null,
): boolean {
  return source !== null && source === opener;
}
