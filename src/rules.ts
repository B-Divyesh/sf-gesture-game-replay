import type {
  GestureFixture, GestureRule, LandmarkFrame, RuleComparison, RuleDisagreement,
  RuleEvaluation, RulePredicate,
} from './types';

function compare(actual: number, op: RulePredicate['op'], expected: number): boolean {
  if (op === 'lt') return actual < expected;
  if (op === 'lte') return actual <= expected;
  if (op === 'gt') return actual > expected;
  return actual >= expected;
}

export function predicatePasses(frame: LandmarkFrame, predicate: RulePredicate): boolean {
  const point = frame[predicate.stream]?.[predicate.index];
  const actual = point?.[predicate.axis];
  return typeof actual === 'number' && Number.isFinite(actual) && compare(actual, predicate.op, predicate.value);
}

export function evaluateRule(fixture: GestureFixture, rule: GestureRule): RuleEvaluation {
  if (!rule.id.trim() || !rule.label.trim()) throw new TypeError('A rule requires an id and label.');
  if (!rule.all.length) throw new TypeError('A rule requires at least one predicate.');
  const hold = Math.max(0, rule.holdForMs ?? 0);
  let candidateStart: number | null = null;
  const frames = fixture.frames.map((frame) => {
    const raw = rule.all.every((predicate) => predicatePasses(frame, predicate));
    if (!raw) candidateStart = null;
    else if (candidateStart === null) candidateStart = frame.t;
    return { t: frame.t, raw, active: raw && frame.t - (candidateStart ?? frame.t) >= hold };
  });

  const segments: RuleEvaluation['segments'] = [];
  let start: number | null = null;
  frames.forEach((frame, index) => {
    if (frame.active && start === null) start = frame.t;
    const next = frames[index + 1];
    if (start !== null && (!next || !next.active)) {
      segments.push({ start, end: next?.t ?? fixture.duration });
      start = null;
    }
  });
  return {
    rule,
    frames,
    segments,
    activeDuration: segments.reduce((total, segment) => total + segment.end - segment.start, 0),
  };
}

export function compareRules(fixture: GestureFixture, a: GestureRule, b: GestureRule): RuleComparison {
  const resultA = evaluateRule(fixture, a);
  const resultB = evaluateRule(fixture, b);
  const disagreements: RuleDisagreement[] = [];
  let open: RuleDisagreement | null = null;
  fixture.frames.forEach((frame, index) => {
    const activeA = resultA.frames[index]?.active ?? false;
    const activeB = resultB.frames[index]?.active ?? false;
    if (activeA !== activeB && !open) open = { start: frame.t, end: frame.t, a: activeA, b: activeB };
    const next = fixture.frames[index + 1];
    if (open && (!next || (resultA.frames[index + 1]?.active ?? false) === (resultB.frames[index + 1]?.active ?? false))) {
      open.end = next?.t ?? fixture.duration;
      disagreements.push(open);
      open = null;
    }
  });
  return {
    a: resultA,
    b: resultB,
    disagreements,
    disagreementDuration: disagreements.reduce((total, segment) => total + segment.end - segment.start, 0),
  };
}
