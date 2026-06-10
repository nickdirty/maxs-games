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

export function playPickup() {
  tone({ type: 'triangle', freqStart: 560, freqEnd: 700, dur: 0.10, peak: 0.10 });
}

export function playUnlock() {
  tone({ type: 'triangle', freqStart: 440, freqEnd: 440, dur: 0.08, peak: 0.10 });
  tone({ type: 'triangle', freqStart: 660, freqEnd: 660, dur: 0.08, peak: 0.10, delay: 0.08 });
  tone({ type: 'triangle', freqStart: 880, freqEnd: 880, dur: 0.14, peak: 0.10, delay: 0.16 });
}

export function playLocked() {
  // gentle "not this one" — an invitation to look again, not a buzzer
  tone({ type: 'sine', freqStart: 340, freqEnd: 300, dur: 0.14, peak: 0.07 });
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
