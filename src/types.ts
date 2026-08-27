export const FORMAT_VERSION = 'gesture-replay/v1' as const;

export type LandmarkStream = 'pose' | 'leftHand' | 'rightHand';
export type LandmarkAxis = 'x' | 'y' | 'z' | 'visibility' | 'presence';
export type ComparisonOperator = 'lt' | 'lte' | 'gt' | 'gte';

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
}

export interface LandmarkFrame {
  /** Milliseconds from the beginning of the fixture. */
  t: number;
  pose?: Landmark[];
  leftHand?: Landmark[];
  rightHand?: Landmark[];
}

export interface FixtureMetadata {
  source?: string;
  notes?: string;
  createdAt?: string;
  consent?: boolean;
  deleteAfter?: string;
}

export interface GestureFixture {
  format: typeof FORMAT_VERSION;
  duration: number;
  frames: LandmarkFrame[];
  metadata?: FixtureMetadata;
}

export interface RecorderFrame {
  /** A monotonic timestamp, commonly performance.now(). */
  timestamp: number;
  pose?: readonly Landmark[];
  leftHand?: readonly Landmark[];
  rightHand?: readonly Landmark[];
}

export interface RecorderOptions {
  source?: string;
  notes?: string;
  consent?: boolean;
  deleteAfter?: string;
}

export interface RulePredicate {
  stream: LandmarkStream;
  index: number;
  axis: LandmarkAxis;
  op: ComparisonOperator;
  value: number;
}

export interface GestureRule {
  id: string;
  label: string;
  /** Every predicate must pass. */
  all: readonly RulePredicate[];
  /** Optional consecutive time required before activation. */
  holdForMs?: number;
}

export interface ActiveSegment {
  start: number;
  end: number;
}

export interface RuleFrameResult {
  t: number;
  raw: boolean;
  active: boolean;
}

export interface RuleEvaluation {
  rule: GestureRule;
  frames: RuleFrameResult[];
  segments: ActiveSegment[];
  activeDuration: number;
}

export interface RuleDisagreement extends ActiveSegment {
  a: boolean;
  b: boolean;
}

export interface RuleComparison {
  a: RuleEvaluation;
  b: RuleEvaluation;
  disagreements: RuleDisagreement[];
  disagreementDuration: number;
}

export interface FrameConfidence {
  mean: number | null;
  observed: number;
  occluded: number;
  total: number;
}

export interface ScrubOptions {
  precision?: number;
  keepSource?: boolean;
  keepNotes?: boolean;
  keepDates?: boolean;
}
