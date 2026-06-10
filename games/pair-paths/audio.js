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

export function playStart() {
  tone({ type: 'sine', freqStart: 440, freqEnd: 440, dur: 0.06, peak: 0.07 });
}

export function playConnect() {
  tone({ type: 'triangle', freqStart: 660, freqEnd: 660, dur: 0.10, peak: 0.12 });
  tone({ type: 'triangle', freqStart: 880, freqEnd: 880, dur: 0.16, peak: 0.12, delay: 0.09 });
}

export function playHint() {
  // all pairs linked but holes remain — a soft nudge, not a buzzer
  tone({ type: 'sine', freqStart: 500, freqEnd: 420, dur: 0.16, peak: 0.07 });
}

export function playWin() {
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((f, i) => {
    tone({ type: 'triangle', freqStart: f, dur: 0.32, peak: 0.18, delay: i * 0.10 });
  });
}
