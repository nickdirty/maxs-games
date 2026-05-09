// Web Audio helpers — all sounds are synthesized, no audio files.
// AudioContext is lazy-initialized + resumed on first user gesture
// (browser autoplay policy).

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

export function playPick() {
  tone({ type: 'triangle', freqStart: 880, freqEnd: 880, dur: 0.10, peak: 0.10 });
}

export function playPour() {
  tone({ type: 'sine', freqStart: 540, freqEnd: 280, dur: 0.22, peak: 0.18 });
}

export function playBlocked() {
  tone({ type: 'square', freqStart: 200, freqEnd: 160, dur: 0.10, peak: 0.07 });
}

export function playWin() {
  // C E G C arpeggio
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((f, i) => {
    tone({ type: 'triangle', freqStart: f, dur: 0.32, peak: 0.18, delay: i * 0.10 });
  });
}
