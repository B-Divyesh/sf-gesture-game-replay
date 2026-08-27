import './style.css';
import {
  compareRules, evaluateRule, FixtureValidationError, frameAt, LandmarkRecorder,
  parseFixture, scrubFixture, stringifyFixture, summarizeFrame,
} from '../src/index';
import type {
  ComparisonOperator, GestureFixture, GestureRule, Landmark, LandmarkAxis,
  LandmarkFrame, LandmarkStream, RecorderFrame, RuleComparison,
} from '../src/index';

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
};

const state = {
  fixture: null as GestureFixture | null,
  name: '',
  time: 0,
  playing: false,
  speed: 1,
  lastAnimationTime: 0,
  comparison: null as RuleComparison | null,
};

const emptyState = byId<HTMLDivElement>('empty-state');
const loadedState = byId<HTMLDivElement>('loaded-state');
const comparisonPanel = byId<HTMLDivElement>('comparison-panel');
const workbenchFrame = byId<HTMLDivElement>('drop-zone');
const fileInput = byId<HTMLInputElement>('fixture-file');
const fixtureName = byId<HTMLElement>('fixture-name');
const fixtureDot = byId<HTMLSpanElement>('fixture-dot');
const status = byId<HTMLParagraphElement>('fixture-status');
const poseCanvas = byId<HTMLCanvasElement>('pose-canvas');
const timelineCanvas = byId<HTMLCanvasElement>('timeline-canvas');
const timeSlider = byId<HTMLInputElement>('time-slider');
const playButton = byId<HTMLButtonElement>('play-button');
const speedSelect = byId<HTMLSelectElement>('speed-select');
const exportButton = byId<HTMLButtonElement>('export-button');
const deleteButton = byId<HTMLButtonElement>('delete-button');

const POSE_CONNECTIONS = [
  [0, 11], [0, 12], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [27, 31],
  [24, 26], [26, 28], [28, 32], [15, 17], [15, 19], [16, 18], [16, 20],
] as const;
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15],
  [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
] as const;

function samplePose(progress: number): Landmark[] {
  const wave = Math.sin(progress * Math.PI * 2);
  const visibility = progress > 0.46 && progress < 0.61 ? 0.28 : 0.96;
  const points = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.9 }));
  const set = (index: number, x: number, y: number, confidence = 0.96) => { points[index] = { x, y, visibility: confidence }; };
  set(0, .5, .13); set(11, .4, .27); set(12, .6, .27); set(23, .44, .53); set(24, .56, .53);
  set(13, .31, .35); set(15, .23, .36 - .22 * Math.max(0, wave), visibility); set(17, .2, .34 - .22 * Math.max(0, wave), visibility);
  set(19, .18, .36 - .22 * Math.max(0, wave), visibility); set(14, .69, .35); set(16, .78, .48); set(18, .8, .5);
  set(20, .82, .48); set(25, .41, .7); set(27, .38, .88); set(31, .34, .91); set(26, .59, .7); set(28, .63, .88); set(32, .68, .91);
  return points;
}

function createSample(): GestureFixture {
  const duration = 4_000;
  return {
    format: 'gesture-replay/v1', duration,
    frames: Array.from({ length: 41 }, (_, index) => ({
      t: index * 100,
      pose: samplePose(index / 40),
    })),
    metadata: { source: 'anonymous-synthetic-sample', consent: true },
  };
}

function setStatus(message: string, error = false): void {
  status.textContent = message;
  status.classList.toggle('error', error);
}

function formatTime(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60_000);
  const seconds = Math.floor(milliseconds / 1_000) % 60;
  const millis = Math.floor(milliseconds % 1_000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

function setFixture(fixture: GestureFixture, name: string): void {
  state.fixture = fixture;
  state.name = name;
  state.time = 0;
  state.playing = false;
  emptyState.hidden = true;
  loadedState.hidden = false;
  comparisonPanel.hidden = false;
  workbenchFrame.dataset.empty = 'false';
  fixtureName.textContent = name;
  fixtureDot.classList.add('live');
  exportButton.disabled = false;
  deleteButton.disabled = false;
  timeSlider.max = String(Math.max(1, fixture.duration));
  timeSlider.value = '0';
  byId<HTMLElement>('duration-readout').textContent = formatTime(fixture.duration);
  playButton.innerHTML = '<span aria-hidden="true">▶</span>';
  playButton.setAttribute('aria-label', 'Play replay');
  updateComparison();
  render();
  setStatus(`Loaded ${fixture.frames.length} frames over ${formatTime(fixture.duration)}. Data remains in this tab.`);
}

function clearFixture(): void {
  state.fixture = null;
  state.playing = false;
  state.time = 0;
  state.comparison = null;
  emptyState.hidden = false;
  loadedState.hidden = true;
  comparisonPanel.hidden = true;
  workbenchFrame.dataset.empty = 'true';
  fixtureName.textContent = 'No trace loaded';
  fixtureDot.classList.remove('live');
  exportButton.disabled = true;
  deleteButton.disabled = true;
  fileInput.value = '';
  setStatus('Fixture removed from memory.');
}

function ruleFrom(prefix: 'a' | 'b'): GestureRule {
  const stream = byId<HTMLSelectElement>(`${prefix}-stream`).value as LandmarkStream;
  const axis = byId<HTMLSelectElement>(`${prefix}-axis`).value as LandmarkAxis;
  const op = byId<HTMLSelectElement>(`${prefix}-op`).value as ComparisonOperator;
  return {
    id: prefix,
    label: prefix === 'a' ? 'Baseline rule' : 'Candidate rule',
    all: [{
      stream,
      axis,
      op,
      index: Math.max(0, Number.parseInt(byId<HTMLInputElement>(`${prefix}-index`).value, 10) || 0),
      value: Number.parseFloat(byId<HTMLInputElement>(`${prefix}-value`).value) || 0,
    }],
    holdForMs: Math.max(0, Number.parseFloat(byId<HTMLInputElement>(`${prefix}-hold`).value) || 0),
  };
}

function updateComparison(): void {
  if (!state.fixture) return;
  try {
    state.comparison = compareRules(state.fixture, ruleFrom('a'), ruleFrom('b'));
    const duration = state.comparison.disagreementDuration;
    byId<HTMLElement>('comparison-summary').textContent = duration
      ? `${state.comparison.disagreements.length} disagreement ${state.comparison.disagreements.length === 1 ? 'interval' : 'intervals'} · ${formatTime(duration)} total`
      : 'The rules agree at every recorded frame.';
    byId<HTMLElement>('timeline-description').textContent = duration
      ? `Rule A and rule B disagree for ${formatTime(duration)} across ${state.comparison.disagreements.length} intervals. The canvas contains confidence, rule A, rule B, and disagreement tracks.`
      : 'Rule A and rule B agree at every recorded frame. The canvas contains confidence and both rule tracks.';
    drawTimeline();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Could not evaluate these rules.', true);
  }
}

function canvasPoint(point: Landmark, width: number, height: number): [number, number] {
  const margin = 30;
  return [margin + point.x * (width - margin * 2), margin + point.y * (height - margin * 2)];
}

function drawStream(
  context: CanvasRenderingContext2D, points: Landmark[] | undefined,
  connections: readonly (readonly [number, number])[], width: number, height: number, color: string,
): void {
  if (!points) return;
  context.lineWidth = 7;
  context.lineCap = 'round';
  context.strokeStyle = color;
  connections.forEach(([from, to]) => {
    const a = points[from]; const b = points[to];
    if (!a || !b) return;
    const [ax, ay] = canvasPoint(a, width, height); const [bx, by] = canvasPoint(b, width, height);
    context.globalAlpha = Math.min(a.visibility ?? a.presence ?? 1, b.visibility ?? b.presence ?? 1) < .5 ? .28 : .9;
    context.setLineDash(context.globalAlpha < .5 ? [8, 8] : []);
    context.beginPath(); context.moveTo(ax, ay); context.lineTo(bx, by); context.stroke();
  });
  context.setLineDash([]);
  points.forEach((point) => {
    const [x, y] = canvasPoint(point, width, height);
    const low = (point.visibility ?? point.presence ?? 1) < .5;
    context.globalAlpha = low ? .55 : 1;
    context.fillStyle = low ? '#f7f0df' : '#d59a16';
    context.strokeStyle = '#202722'; context.lineWidth = 2;
    context.beginPath(); context.arc(x, y, low ? 5 : 7, 0, Math.PI * 2); context.fill(); context.stroke();
  });
  context.globalAlpha = 1;
}

function drawPose(frame: LandmarkFrame | null): void {
  const context = poseCanvas.getContext('2d');
  if (!context) return;
  const { width, height } = poseCanvas;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#18312e'; context.fillRect(0, 0, width, height);
  context.strokeStyle = '#f7f0df18'; context.lineWidth = 1;
  for (let y = 70; y < height; y += 70) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
  if (!frame) return;
  drawStream(context, frame.pose, POSE_CONNECTIONS, width, height, '#75b8a9');
  drawStream(context, frame.leftHand, HAND_CONNECTIONS, width, height, '#75b8a9');
  drawStream(context, frame.rightHand, HAND_CONNECTIONS, width, height, '#dc7765');
}

function trackX(t: number, duration: number, left: number, width: number): number {
  return left + (duration ? t / duration : 0) * width;
}

function drawTimeline(): void {
  if (!state.fixture || !state.comparison) return;
  const context = timelineCanvas.getContext('2d');
  if (!context) return;
  const { width, height } = timelineCanvas;
  const left = 128; const right = 24; const trackWidth = width - left - right;
  context.clearRect(0, 0, width, height); context.fillStyle = '#fffaf0'; context.fillRect(0, 0, width, height);
  context.font = '18px Atkinson, Arial'; context.textBaseline = 'middle'; context.fillStyle = '#202722';
  const rows = [{ label: 'Confidence', y: 35 }, { label: 'Rule A', y: 92 }, { label: 'Rule B', y: 137 }, { label: 'Disagree', y: 182 }];
  rows.forEach(({ label, y }) => { context.fillText(label, 14, y); context.fillStyle = '#e9ddbe'; context.fillRect(left, y - 13, trackWidth, 26); context.fillStyle = '#202722'; });
  context.strokeStyle = '#136f63'; context.lineWidth = 4; context.beginPath();
  state.fixture.frames.forEach((frame, index) => {
    const confidence = summarizeFrame(frame).mean ?? 0;
    const x = trackX(frame.t, state.fixture!.duration, left, trackWidth); const y = 48 - confidence * 26;
    if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
  });
  context.stroke();
  const paintSegments = (segments: { start: number; end: number }[], y: number, color: string) => {
    context.fillStyle = color;
    segments.forEach((segment) => context.fillRect(trackX(segment.start, state.fixture!.duration, left, trackWidth), y - 13, Math.max(2, trackX(segment.end, state.fixture!.duration, left, trackWidth) - trackX(segment.start, state.fixture!.duration, left, trackWidth)), 26));
  };
  paintSegments(state.comparison.a.segments, 92, '#136f63');
  paintSegments(state.comparison.b.segments, 137, '#c84e3b');
  paintSegments(state.comparison.disagreements, 182, '#d59a16');
  const playhead = trackX(state.time, state.fixture.duration, left, trackWidth);
  context.strokeStyle = '#202722'; context.lineWidth = 3; context.beginPath(); context.moveTo(playhead, 10); context.lineTo(playhead, height - 15); context.stroke();
  context.fillStyle = '#202722'; context.beginPath(); context.moveTo(playhead - 7, 8); context.lineTo(playhead + 7, 8); context.lineTo(playhead, 18); context.closePath(); context.fill();
}

function render(): void {
  if (!state.fixture) return;
  const frame = frameAt(state.fixture, state.time);
  drawPose(frame);
  timeSlider.value = String(state.time);
  byId<HTMLElement>('time-readout').textContent = formatTime(state.time);
  let sourceIndex = 0;
  for (let index = 0; index < state.fixture.frames.length; index += 1) {
    if ((state.fixture.frames[index]?.t ?? Infinity) <= state.time) sourceIndex = index;
    else break;
  }
  byId<HTMLElement>('frame-readout').textContent = `Frame ${sourceIndex + 1} of ${state.fixture.frames.length}`;
  if (frame) {
    const summary = summarizeFrame(frame);
    byId<HTMLElement>('confidence-value').textContent = summary.mean === null ? 'Not supplied' : `${Math.round(summary.mean * 100)}%`;
    byId<HTMLElement>('occluded-value').textContent = summary.observed ? `${summary.occluded} of ${summary.observed}` : 'Not supplied';
    byId<HTMLElement>('stream-value').textContent = [frame.pose && 'pose', frame.leftHand && 'left hand', frame.rightHand && 'right hand'].filter(Boolean).join(', ') || 'None';
    byId<HTMLElement>('frame-json').textContent = JSON.stringify(frame, null, 2);
  }
  drawTimeline();
}

function animate(timestamp: number): void {
  if (!state.playing || !state.fixture) return;
  if (!state.lastAnimationTime) state.lastAnimationTime = timestamp;
  const elapsed = timestamp - state.lastAnimationTime;
  state.lastAnimationTime = timestamp;
  state.time = Math.min(state.fixture.duration, state.time + elapsed * state.speed);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) state.time = Math.round(state.time / 100) * 100;
  if (state.time >= state.fixture.duration) {
    state.playing = false;
    playButton.innerHTML = '<span aria-hidden="true">▶</span>';
    playButton.setAttribute('aria-label', 'Play replay');
  }
  render();
  if (state.playing) requestAnimationFrame(animate);
}

function togglePlayback(): void {
  if (!state.fixture) return;
  state.playing = !state.playing;
  if (state.playing && state.time >= state.fixture.duration) state.time = 0;
  state.lastAnimationTime = 0;
  playButton.innerHTML = state.playing ? '<span aria-hidden="true">Ⅱ</span>' : '<span aria-hidden="true">▶</span>';
  playButton.setAttribute('aria-label', state.playing ? 'Pause replay' : 'Play replay');
  if (state.playing) requestAnimationFrame(animate);
}

async function importFile(file: File): Promise<void> {
  if (file.size > 20 * 1024 * 1024) { setStatus('That fixture is over 20 MB. Split it into shorter traces and try again.', true); return; }
  setStatus(`Reading ${file.name}…`);
  try { setFixture(parseFixture(await file.text()), file.name); }
  catch (error) {
    const message = error instanceof FixtureValidationError ? error.issues[0] : error instanceof Error ? error.message : 'Unknown file error.';
    setStatus(`Could not load ${file.name}: ${message} Fix the JSON and try again.`, true);
  }
}

document.querySelectorAll<HTMLButtonElement>('[data-action="load-sample"]').forEach((button) => button.addEventListener('click', () => {
  setFixture(createSample(), 'anonymous-wave.fixture.json');
  document.getElementById('workbench')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}));
fileInput.addEventListener('change', () => { const file = fileInput.files?.[0]; if (file) void importFile(file); });
for (const eventName of ['dragenter', 'dragover']) workbenchFrame.addEventListener(eventName, (event) => { event.preventDefault(); workbenchFrame.classList.add('dragging'); });
for (const eventName of ['dragleave', 'drop']) workbenchFrame.addEventListener(eventName, (event) => { event.preventDefault(); workbenchFrame.classList.remove('dragging'); });
workbenchFrame.addEventListener('drop', (event) => { const file = event.dataTransfer?.files[0]; if (file) void importFile(file); });
playButton.addEventListener('click', togglePlayback);
timeSlider.addEventListener('input', () => { state.time = Number(timeSlider.value); state.playing = false; render(); });
speedSelect.addEventListener('change', () => { state.speed = Number(speedSelect.value); });
document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('.rule-fields input, .rule-fields select').forEach((input) => input.addEventListener('input', updateComparison));
deleteButton.addEventListener('click', () => { if (state.fixture && window.confirm(`Remove “${state.name}” from this tab? Any unexported trace will be lost.`)) clearFixture(); });
exportButton.addEventListener('click', () => {
  if (!state.fixture) return;
  const blob = new Blob([stringifyFixture(scrubFixture(state.fixture))], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = state.name.replace(/(?:\.fixture)?\.json$/i, '') + '.scrubbed.fixture.json'; link.click();
  URL.revokeObjectURL(url); setStatus('Exported a scrubbed copy: time normalized, values rounded, source notes and dates removed.');
});
document.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement;
  if (!state.fixture || /INPUT|SELECT|TEXTAREA|BUTTON/.test(target.tagName)) return;
  if (event.code === 'Space') { event.preventDefault(); togglePlayback(); }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); state.time = Math.max(0, Math.min(state.fixture.duration, state.time + (event.key === 'ArrowLeft' ? -100 : 100))); render(); }
  if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); state.time = event.key === 'Home' ? 0 : state.fixture.duration; render(); }
});
byId<HTMLButtonElement>('bridge-code-button').addEventListener('click', (event) => {
  const code = byId<HTMLPreElement>('bridge-code'); code.hidden = !code.hidden;
  (event.currentTarget as HTMLButtonElement).textContent = code.hidden ? 'Show code' : 'Hide code';
});

let recorder: LandmarkRecorder | null = null;
let recordedFrames = 0;
const recordButton = byId<HTMLButtonElement>('record-button');
recordButton.addEventListener('click', () => {
  if (!recorder) {
    recorder = new LandmarkRecorder({ source: 'local-window-bridge' }); recordedFrames = 0; recorder.start(performance.now());
    recordButton.textContent = 'Stop recording'; recordButton.setAttribute('aria-pressed', 'true');
    setStatus('Listening for local gesture-replay:frame messages. No camera or pixels are accessed.');
  } else {
    if (!recordedFrames) { recorder.clear(); setStatus('No landmark messages arrived. Start your detector bridge, then record again.', true); }
    else setFixture(recorder.stop(performance.now()), `bridge-${new Date().toISOString().slice(0, 19).replaceAll(':', '-')}.fixture.json`);
    recorder = null; recordButton.textContent = 'Record bridge'; recordButton.setAttribute('aria-pressed', 'false');
  }
});
window.addEventListener('message', (event: MessageEvent<unknown>) => {
  if (!recorder || event.source !== window || event.origin !== location.origin || typeof event.data !== 'object' || event.data === null) return;
  const message = event.data as { type?: unknown; frame?: unknown };
  if (message.type !== 'gesture-replay:frame' || typeof message.frame !== 'object' || message.frame === null) return;
  try { recorder.addFrame(message.frame as RecorderFrame); recordedFrames += 1; setStatus(`Recording landmarks… ${recordedFrames} frames captured.`); }
  catch (error) { setStatus(`Skipped a bridge frame: ${error instanceof Error ? error.message : 'invalid data'}`, true); }
});

async function copyText(text: string, button: HTMLButtonElement, original: string): Promise<void> {
  try { await navigator.clipboard.writeText(text); button.textContent = 'Copied'; setTimeout(() => { button.textContent = original; }, 1_500); }
  catch { setStatus('Clipboard access was blocked. Select and copy the text manually.', true); }
}
byId<HTMLButtonElement>('copy-install').addEventListener('click', (event) => void copyText('npm install gesture-game-replay', event.currentTarget as HTMLButtonElement, 'Copy install command'));

const ADAPTERS: Record<string, string> = {
  mediapipe: `const recorder = new LandmarkRecorder({ source: 'mediapipe-tasks-vision' });\nrecorder.start(performance.now());\n// Inside PoseLandmarker.detectForVideo callback:\nrecorder.addFrame({\n  timestamp: performance.now(),\n  pose: result.landmarks[0]\n});`,
  tfjs: `const recorder = new LandmarkRecorder({ source: 'tfjs-pose-detection' });\nrecorder.start(performance.now());\nconst pose = poses[0];\nrecorder.addFrame({\n  timestamp: performance.now(),\n  pose: pose.keypoints.map(p => ({\n    x: p.x / video.videoWidth, y: p.y / video.videoHeight,\n    visibility: p.score\n  }))\n});`,
  manifest: `const manifest = fixtures.map(({ name, fixture }) => ({\n  name, format: fixture.format,\n  frames: fixture.frames.length,\n  duration: fixture.duration,\n  sha256: await digest(stringifyFixture(scrubFixture(fixture)))\n}));`,
};
const PRODUCT_SLUG = 'gesture-game-replay';
const LICENSE_KEY = `sb_license:${PRODUCT_SLUG}`;
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
const VERIFY_URL = `https://api.sociobot.in/api/v1/products/${PRODUCT_SLUG}/verify`;
const licenseStatus = byId<HTMLParagraphElement>('license-status');

function storageGet(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function storageSet(key: string, value: string): void { try { localStorage.setItem(key, value); } catch { licenseStatus.textContent = 'This browser blocked local storage; the unlock will last only for this page.'; } }
function showUnlocked(): void {
  byId<HTMLDivElement>('locked-license').hidden = true; byId<HTMLDivElement>('unlocked-license').hidden = false;
  updateAdapter();
}
function showLocked(): void { byId<HTMLDivElement>('locked-license').hidden = false; byId<HTMLDivElement>('unlocked-license').hidden = true; }
function updateAdapter(): void { byId<HTMLElement>('adapter-code').querySelector('code')!.textContent = ADAPTERS[byId<HTMLSelectElement>('adapter-select').value] ?? ''; }
async function verifyLicense(token: string, announce = true): Promise<boolean> {
  if (announce) licenseStatus.textContent = 'Checking license…';
  try {
    const response = await fetch(`${VERIFY_URL}?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('The license service did not respond.');
    const result = await response.json() as { valid?: boolean; reason?: string };
    storageSet(VERDICT_KEY, JSON.stringify({ valid: result.valid === true, checkedAt: Date.now() }));
    if (result.valid) { storageSet(LICENSE_KEY, token); showUnlocked(); licenseStatus.textContent = 'License active on this device.'; return true; }
    showLocked(); licenseStatus.textContent = `License no longer active (${result.reason ?? 'invalid'}). You can buy or restore another license.`; return false;
  } catch {
    licenseStatus.textContent = 'Could not reach license verification. The free workbench still works; try again when online.';
    return false;
  }
}
function initializeLicense(): void {
  const url = new URL(location.href); const returned = url.searchParams.get('license');
  if (returned) { storageSet(LICENSE_KEY, returned); url.searchParams.delete('license'); history.replaceState({}, '', url); void verifyLicense(returned); return; }
  const token = storageGet(LICENSE_KEY); if (!token) return;
  try {
    const cached = JSON.parse(storageGet(VERDICT_KEY) ?? '{}') as { valid?: boolean; checkedAt?: number };
    if (cached.valid) showUnlocked();
    if (!cached.checkedAt || Date.now() - cached.checkedAt > 86_400_000) void verifyLicense(token, false);
  } catch { void verifyLicense(token, false); }
}
byId<HTMLButtonElement>('restore-toggle').addEventListener('click', (event) => {
  const form = byId<HTMLFormElement>('restore-form'); form.hidden = !form.hidden;
  (event.currentTarget as HTMLButtonElement).setAttribute('aria-expanded', String(!form.hidden));
  if (!form.hidden) byId<HTMLInputElement>('license-input').focus();
});
byId<HTMLFormElement>('restore-form').addEventListener('submit', (event) => {
  event.preventDefault(); const token = byId<HTMLInputElement>('license-input').value.trim();
  if (!token) { licenseStatus.textContent = 'Paste the license token from your receipt.'; return; }
  storageSet(LICENSE_KEY, token); void verifyLicense(token);
});
byId<HTMLSelectElement>('adapter-select').addEventListener('change', updateAdapter);
byId<HTMLButtonElement>('copy-adapter').addEventListener('click', (event) => void copyText(ADAPTERS[byId<HTMLSelectElement>('adapter-select').value] ?? '', event.currentTarget as HTMLButtonElement, 'Copy adapter'));
initializeLicense();

const offlineBanner = byId<HTMLDivElement>('offline-banner');
function updateConnection(): void { offlineBanner.hidden = navigator.onLine; }
window.addEventListener('online', updateConnection); window.addEventListener('offline', updateConnection); updateConnection();
if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js'); });
