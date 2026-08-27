import type { FrameConfidence, Landmark, LandmarkFrame } from './types';

export function summarizeFrame(frame: LandmarkFrame, occlusionThreshold = 0.5): FrameConfidence {
  const points: Landmark[] = [...(frame.pose ?? []), ...(frame.leftHand ?? []), ...(frame.rightHand ?? [])];
  const confidence = points.flatMap((point) => point.visibility ?? point.presence ?? []);
  return {
    mean: confidence.length ? confidence.reduce((sum, value) => sum + value, 0) / confidence.length : null,
    observed: confidence.length,
    occluded: confidence.filter((value) => value < occlusionThreshold).length,
    total: points.length,
  };
}
