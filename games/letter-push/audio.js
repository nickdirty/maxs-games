// Web Audio helpers — synthesized sounds, no audio files. Lazy AudioContext.

let ctx = null;

function ensureCtx() {
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone({ type = 'sine', freqStart, freqEnd, dur = 0.18, peak = 0.15, attack = 0.005, delay = 0 }) {
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freqStart, t0);
  if (freqEnd != null && freqEnd !== freqStart) {
    o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export function playStep() {
  tone({ type: 'sine', freqStart: 320, freqEnd: 320, dur: 0.05, peak: 0.06 });
}

export function playPush() {
  tone({ type: 'triangle', freqStart: 220, freqEnd: 180, dur: 0.10, peak: 0.10 });
}

export function playFlip() {
  tone({ type: 'sawtooth', freqStart: 600, freqEnd: 900, dur: 0.12, peak: 0.10 });
  tone({ type: 'sine', freqStart: 900, freqEnd: 600, dur: 0.10, peak: 0.08, delay: 0.05 });
}

export function playBlocked() {
  tone({ type: 'square', freqStart: 200, freqEnd: 160, dur: 0.08, peak: 0.05 });
}

export function playWin() {
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((f, i) => {
    tone({ type: 'triangle', freqStart: f, dur: 0.32, peak: 0.18, delay: i * 0.10 });
  });
}

// Web Speech API — uses the OS's local TTS engine, no network calls.
// Falls back to silence on unsupported browsers. Always cancels any
// in-flight utterance so rapid flips don't queue up.

let selectedVoiceName = null;

export function setSelectedVoiceName(name) {
  selectedVoiceName = name || null;
}
export function getSelectedVoiceName() { return selectedVoiceName; }

function ttsAvailable() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getEnglishVoices() {
  if (!ttsAvailable()) return [];
  return window.speechSynthesis.getVoices()
    .filter((v) => (v.lang || '').toLowerCase().startsWith('en'));
}

// Default voice selection. "Google US English" is the friendly Android
// default and what we want unless the user picks something else; if that
// specific voice isn't installed, fall back to a heuristic (prefer en-US,
// female-sounding, enhanced/network voices).
// Returns null if no voices are available yet (voices may load async on
// Android — call onVoicesChanged() to know when to retry).
export function pickDefaultVoice() {
  const voices = getEnglishVoices();
  if (voices.length === 0) return null;
  const googleUS = voices.find((v) => v.name === 'Google US English');
  if (googleUS) return googleUS;
  function score(v) {
    let s = 0;
    const lang = (v.lang || '').toLowerCase();
    const name = (v.name || '').toLowerCase();
    if (lang === 'en-us') s += 10;
    else if (lang.startsWith('en-')) s += 3;
    if (name.includes('google')) s += 5;
    // Explicit female keywords or known female voice IDs.
    if (/\bfemale\b|\bwoman\b|\bgirl\b/.test(name)) s += 10;
    if (/wavenet-[cefgh]|standard-[ce]|studio-o/.test(name)) s += 8;
    if (/en-us-x-(iol|tpf|sfg|sfb)/.test(name)) s += 8;
    // Enhanced / premium / neural voices tend to sound much better.
    if (/enhanced|premium|wavenet|network|natural|neural|studio/.test(name)) s += 4;
    if (v.localService === false) s += 2;
    return s;
  }
  return voices.slice().sort((a, b) => score(b) - score(a))[0];
}

export function getEffectiveVoice() {
  if (!ttsAvailable()) return null;
  if (selectedVoiceName) {
    const v = window.speechSynthesis.getVoices().find((x) => x.name === selectedVoiceName);
    if (v) return v;
  }
  return pickDefaultVoice();
}

// Some browsers populate voices asynchronously. Subscribe to learn when
// they're ready (and when they change — Chrome can emit this multiple times).
export function onVoicesChanged(cb) {
  if (!ttsAvailable()) return () => {};
  const handler = () => cb();
  window.speechSynthesis.addEventListener('voiceschanged', handler);
  // If voices are already loaded, fire once immediately.
  if (window.speechSynthesis.getVoices().length > 0) cb();
  return () => window.speechSynthesis.removeEventListener('voiceschanged', handler);
}

export function speak(text, { rate = 0.9, pitch = 1.0, voice } = {}) {
  if (!ttsAvailable()) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = pitch;
    u.volume = 1.0;
    u.lang = 'en-US';
    const v = voice ?? getEffectiveVoice();
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch { /* degrade silently */ }
}
