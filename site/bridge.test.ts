import { describe, expect, it } from 'vitest';
import { isTrustedBridgeOrigin, validateBridgePayload } from './bridge';

describe('browser bridge security regression', () => {
  it('accepts only the explicit first-party production and development origins', () => {
    expect(isTrustedBridgeOrigin('https://gesture-game-replay.sociobot.in')).toBe(true);
    expect(isTrustedBridgeOrigin('https://untrusted.example')).toBe(false);
    expect(isTrustedBridgeOrigin('https://preview.gesture-game-replay.sociobot.in')).toBe(false);
  });

  it('copies a complete valid payload and rejects malformed landmarks before recording', () => {
    const pose = [{ x: 0.42, y: 0.24, visibility: 0.98 }];
    const valid = validateBridgePayload({ type: 'gesture-replay:frame', frame: { timestamp: 16, pose } });
    expect(valid).toEqual({ ok: true, frame: { timestamp: 16, pose } });
    if (valid.ok) {
      pose[0]!.x = 99;
      expect(valid.frame.pose?.[0]?.x).toBe(0.42);
    }

    expect(validateBridgePayload({ type: 'gesture-replay:frame', frame: { timestamp: 17, pose: [{}] } })).toMatchObject({ ok: false });
    expect(validateBridgePayload({ type: 'gesture-replay:frame', frame: { timestamp: 17, pose: [], video: 'never accepted' } })).toMatchObject({ ok: false });
    expect(validateBridgePayload({ type: 'gesture-replay:frame', frame: { timestamp: Number.NaN, pose: [] } })).toMatchObject({ ok: false });
  });
});
