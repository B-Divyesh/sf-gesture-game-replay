import { FORMAT_VERSION } from './types';
import type { GestureFixture, Landmark, LandmarkFrame } from './types';

export class FixtureValidationError extends TypeError {
  constructor(public readonly issues: string[]) {
    super(`Invalid gesture fixture: ${issues.join(' ')}`);
    this.name = 'FixtureValidationError';
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateLandmark(value: unknown, path: string, issues: string[]): value is Landmark {
  if (!record(value)) { issues.push(`${path} must be an object.`); return false; }
  if (!finite(value.x) || !finite(value.y)) issues.push(`${path} requires finite x and y.`);
  for (const key of ['z', 'visibility', 'presence'] as const) {
    if (value[key] !== undefined && !finite(value[key])) issues.push(`${path}.${key} must be finite.`);
  }
  return true;
}

function validateFrame(value: unknown, index: number, issues: string[]): value is LandmarkFrame {
  const path = `frames[${index}]`;
  if (!record(value)) { issues.push(`${path} must be an object.`); return false; }
  if (!finite(value.t) || value.t < 0) issues.push(`${path}.t must be a non-negative finite number.`);
  let hasStream = false;
  for (const stream of ['pose', 'leftHand', 'rightHand'] as const) {
    if (value[stream] !== undefined) {
      hasStream = true;
      if (!Array.isArray(value[stream])) issues.push(`${path}.${stream} must be an array.`);
      else value[stream].forEach((point, pointIndex) => validateLandmark(point, `${path}.${stream}[${pointIndex}]`, issues));
    }
  }
  if (!hasStream) issues.push(`${path} must contain a landmark stream.`);
  return true;
}

export function validateFixture(value: unknown): value is GestureFixture {
  const issues: string[] = [];
  if (!record(value)) throw new FixtureValidationError(['Root must be an object.']);
  if (value.format !== FORMAT_VERSION) issues.push(`format must be "${FORMAT_VERSION}".`);
  if (!finite(value.duration) || value.duration < 0) issues.push('duration must be a non-negative finite number.');
  if (!Array.isArray(value.frames)) issues.push('frames must be an array.');
  else {
    value.frames.forEach((frame, index) => validateFrame(frame, index, issues));
    for (let i = 1; i < value.frames.length; i += 1) {
      const previous = value.frames[i - 1];
      const current = value.frames[i];
      if (record(previous) && record(current) && finite(previous.t) && finite(current.t) && current.t < previous.t) {
        issues.push(`frames[${i}].t must not precede the previous frame.`);
      }
    }
    const last = value.frames.at(-1);
    if (record(last) && finite(last.t) && finite(value.duration) && last.t > value.duration) {
      issues.push('duration must include the final frame.');
    }
  }
  if (value.metadata !== undefined && !record(value.metadata)) issues.push('metadata must be an object.');
  if (issues.length) throw new FixtureValidationError(issues);
  return true;
}

export function parseFixture(json: string): GestureFixture {
  let value: unknown;
  try { value = JSON.parse(json); }
  catch { throw new FixtureValidationError(['The file is not valid JSON.']); }
  validateFixture(value);
  return value as GestureFixture;
}
