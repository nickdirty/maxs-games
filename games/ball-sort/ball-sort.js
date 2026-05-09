import { playPick, playPour, playWin, playBlocked } from './audio.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STORE_KEY = 'maxs-games:ball-sort';
const CAPACITY = 4; // balls per tube

// Each color also gets a unique glyph so balls are distinguishable without
// relying on color alone (basic colorblind hygiene + helps beginners).
const PALETTE = [
  { color: '#e84c4c', glyph: 'dot' },
  { color: '#4682e6', glyph: 'star' },
  { color: '#f0c83c', glyph: 'sun' },
  { color: '#5cb85c', glyph: 'leaf' },
  { color: '#9b59b6', glyph: 'diamond' },
  { color: '#ff8c42', glyph: 'ring' },
  { color: '#ec407a', glyph: 'heart' },
  { color: '#26c6da', glyph: 'wave' },
];

const SUN_RAYS = [0, 45, 90, 135, 180, 225, 270, 315]
  .map((a) => {
    const r = (a * Math.PI) / 180;
    const x1 = (Math.cos(r) * 5.5).toFixed(2);
    const y1 = (Math.sin(r) * 5.5).toFixed(2);
    const x2 = (Math.cos(r) * 8.5).toFixed(2);
    const y2 = (Math.sin(r) * 8.5).toFixed(2);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  })
  .join('');

const GLYPHS = {
  dot:     '<circle r="5.5" fill="#fff"/>',
  star:    '<path d="M0,-9 L2.6,-2.8 L9,-2.8 L3.7,1.2 L5.7,8 L0,4 L-5.7,8 L-3.7,1.2 L-9,-2.8 L-2.6,-2.8 Z" fill="#fff"/>',
  sun:     `<g fill="#fff" stroke="#fff" stroke-width="1.6" stroke-linecap="round"><circle r="3.5" stroke="none"/>${SUN_RAYS}</g>`,
  leaf:    '<path d="M0,-8.5 C-7,-3 -7,5 0,8.5 C7,5 7,-3 0,-8.5 Z" fill="#fff"/>',
  diamond: '<path d="M0,-8 L7,0 L0,8 L-7,0 Z" fill="#fff"/>',
  ring:    '<circle r="6" fill="none" stroke="#fff" stroke-width="2.5"/>',
  heart:   '<path d="M0,5 C-7,-1 -7,-9 -3,-9 C-1,-9 0,-7 0,-5 C0,-7 1,-9 3,-9 C7,-9 7,-1 0,5 Z" fill="#fff"/>',
  wave:    '<path d="M-8,1 Q-4,-5 0,1 T8,1" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>',
};

// ---------------------------------------------------------------------------
// Difficulty
// ---------------------------------------------------------------------------
// Difficulty 1..12 maps to (colors, empty tubes, scramble depth). The kid's
// shown level number is independent — we just keep nudging difficulty up/down
// based on how the last few levels went.
const TIERS = {
  1:  { colors: 3, empties: 1, scramble: 8  },
  2:  { colors: 3, empties: 1, scramble: 12 },
  3:  { colors: 4, empties: 2, scramble: 14 },
  4:  { colors: 4, empties: 1, scramble: 18 },
  5:  { colors: 5, empties: 2, scramble: 22 },
  6:  { colors: 5, empties: 1, scramble: 26 },
  7:  { colors: 6, empties: 2, scramble: 30 },
  8:  { colors: 6, empties: 1, scramble: 34 },
  9:  { colors: 7, empties: 2, scramble: 40 },
  10: { colors: 7, empties: 2, scramble: 46 },
  11: { colors: 8, empties: 2, scramble: 50 },
  12: { colors: 8, empties: 2, scramble: 56 },
};
const MAX_TIER = 12;

function levelConfig(d) {
  const tier = TIERS[Math.max(1, Math.min(MAX_TIER, d))];
  return { ...tier, capacity: CAPACITY };
}

function nextDifficulty(history, current) {
  // Need 3 consecutive efficient solves to move up,
  // 2 consecutive struggles to move down. Reset window after a step
  // so we require fresh evidence at the new level.
  const last3 = history.slice(-3);
  if (
    last3.length === 3 &&
    last3.every((o) => o.solved && o.moves <= o.scrambleDepth * 1.6)
  ) {
    return { difficulty: Math.min(current + 1, MAX_TIER), reset: true };
  }
  const last2 = history.slice(-2);
  if (
    last2.length === 2 &&
    last2.every((o) => !o.solved || o.moves > o.scrambleDepth * 3.5)
  ) {
    return { difficulty: Math.max(current - 1, 1), reset: true };
  }
  return { difficulty: current, reset: false };
}

// ---------------------------------------------------------------------------
// Puzzle generation
// ---------------------------------------------------------------------------
function makeSolved(cfg) {
  const tubes = [];
  for (let c = 0; c < cfg.colors; c++) tubes.push(Array(cfg.capacity).fill(c));
  for (let i = 0; i < cfg.empties; i++) tubes.push([]);
  return tubes;
}

function listValidMoves(tubes, cap) {
  const moves = [];
  for (let i = 0; i < tubes.length; i++) {
    const src = tubes[i];
    if (src.length === 0) continue;
    const top = src[src.length - 1];
    for (let j = 0; j < tubes.length; j++) {
      if (i === j) continue;
      const dst = tubes[j];
      if (dst.length >= cap) continue;
      if (dst.length === 0 || dst[dst.length - 1] === top) {
        moves.push({ from: i, to: j });
      }
    }
  }
  return moves;
}

function isUniformTube(t, cap) {
  if (t.length !== cap) return false;
  const c = t[0];
  for (const x of t) if (x !== c) return false;
  return true;
}

function isSolved(tubes, cap) {
  for (const t of tubes) {
    if (t.length === 0) continue;
    if (!isUniformTube(t, cap)) return false;
  }
  return true;
}

function scramble(tubes, n, cap) {
  // Random valid moves from solved. Two anti-degenerate filters:
  //  - skip the move that exactly undoes the previous one
  //  - prefer moves that touch a non-uniform tube (more "interesting")
  let last = null;
  for (let i = 0; i < n; i++) {
    let candidates = listValidMoves(tubes, cap).filter(
      (m) => !(last && m.from === last.to && m.to === last.from)
    );
    if (candidates.length === 0) candidates = listValidMoves(tubes, cap);
    if (candidates.length === 0) break;
    const interesting = candidates.filter(
      (m) => !isUniformTube(tubes[m.from], cap) || tubes[m.to].length > 0
    );
    const pool = interesting.length > 0 ? interesting : candidates;
    const m = pool[Math.floor(Math.random() * pool.length)];
    tubes[m.to].push(tubes[m.from].pop());
    last = m;
  }
}

function generateLevel(cfg) {
  let tubes;
  for (let attempt = 0; attempt < 8; attempt++) {
    tubes = makeSolved(cfg);
    scramble(tubes, cfg.scramble, cfg.capacity);
    if (!isSolved(tubes, cfg.capacity)) return tubes;
  }
  return tubes;
}

// ---------------------------------------------------------------------------
// State + persistence
// ---------------------------------------------------------------------------
const state = {
  level: 1,         // displayed (just an incrementing counter for the kid)
  difficulty: 1,    // hidden — drives generation
  history: [],      // last few outcomes
  tubes: [],
  original: [],
  selected: null,
  moves: 0,
  scrambleDepth: 0,
};

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function savePersisted() {
  try {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({
        level: state.level,
        difficulty: state.difficulty,
        history: state.history,
      })
    );
  } catch {
    /* localStorage may be disabled — game still works in-memory */
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
const tubesEl = document.getElementById('tubes');
const levelNumEl = document.getElementById('level-num');
const resetBtn = document.getElementById('reset-btn');
const winScreen = document.getElementById('win-screen');
const nextBtn = document.getElementById('next-btn');

function ballHTML(colorIdx) {
  const p = PALETTE[colorIdx % PALETTE.length];
  return (
    `<div class="ball" data-color="${colorIdx}" style="background-color:${p.color}">` +
      `<svg viewBox="-10 -10 20 20" aria-hidden="true">${GLYPHS[p.glyph]}</svg>` +
    `</div>`
  );
}

function tubeEl(i) {
  return tubesEl.children[i];
}

function render() {
  tubesEl.innerHTML = '';
  fitTubeSize(state.tubes.length);
  state.tubes.forEach((t, i) => {
    const tube = document.createElement('div');
    tube.className = 'tube';
    tube.dataset.idx = String(i);
    // First DOM child = visually bottom (flex column-reverse).
    let html = '';
    for (const c of t) html += ballHTML(c);
    tube.innerHTML = html;
    tubesEl.appendChild(tube);
  });
  levelNumEl.textContent = String(state.level);
}

function fitTubeSize(nTubes) {
  // Pick a tube width that lets all tubes fit either in 1 row or 2.
  // Tube height ~= 3.6 * width + 14, so width is bounded by both
  // available height and available width.
  const w = document.documentElement.clientWidth;
  const h = document.documentElement.clientHeight;
  const reserveTop = 80;   // topbar + safe-area top
  const reserveBot = 24;
  const sidePad = 32;
  const gapH = 18;
  const gapV = 18;
  const ratio = 3.6;
  const fixedH = 14;

  function fitForRows(rows) {
    const perRow = Math.ceil(nTubes / rows);
    const wByWidth = (w - sidePad - gapH * (perRow - 1)) / perRow;
    const wByHeight = ((h - reserveTop - reserveBot - gapV * (rows - 1)) / rows - fixedH) / ratio;
    return Math.floor(Math.min(wByWidth, wByHeight));
  }

  let best = 0;
  for (let rows = 1; rows <= 2; rows++) {
    const tw = fitForRows(rows);
    if (tw > best) best = tw;
  }
  best = Math.max(48, Math.min(96, best));
  tubesEl.style.setProperty('--tube-w', best + 'px');
}

function updateSelectionVisual() {
  for (const t of tubesEl.children) t.classList.remove('selected');
  if (state.selected !== null) tubeEl(state.selected).classList.add('selected');
}

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------
let isAnimating = false;

tubesEl.addEventListener('click', (e) => {
  if (isAnimating) return;
  const tube = e.target.closest('.tube');
  if (!tube || !tubesEl.contains(tube)) return;
  const idx = Number(tube.dataset.idx);
  if (Number.isNaN(idx)) return;
  handleTubeTap(idx);
});

function canMove(from, to) {
  if (from === to) return false;
  const src = state.tubes[from];
  const dst = state.tubes[to];
  if (src.length === 0) return false;
  if (dst.length >= CAPACITY) return false;
  return dst.length === 0 || dst[dst.length - 1] === src[src.length - 1];
}

function handleTubeTap(idx) {
  if (state.selected === null) {
    if (state.tubes[idx].length === 0) {
      // tapping empty tube with nothing selected: ignore (no audio noise)
      return;
    }
    state.selected = idx;
    updateSelectionVisual();
    playPick();
    return;
  }

  if (state.selected === idx) {
    state.selected = null;
    updateSelectionVisual();
    return;
  }

  if (canMove(state.selected, idx)) {
    doMove(state.selected, idx);
    return;
  }

  // Invalid: brief shake + sound. If the destination has balls of its own,
  // switch the selection to it (more forgiving for a kid).
  const t = tubeEl(idx);
  t.classList.remove('flash-bad');
  // force reflow so re-adding the class restarts the animation
  void t.offsetWidth;
  t.classList.add('flash-bad');
  playBlocked();
  if (state.tubes[idx].length > 0) {
    state.selected = idx;
  } else {
    state.selected = null;
  }
  updateSelectionVisual();
}

async function doMove(from, to) {
  state.selected = null;
  updateSelectionVisual();
  const srcTube = tubeEl(from);
  const dstTube = tubeEl(to);
  const ballEl = srcTube.lastElementChild;
  if (!ballEl) return;

  // Update model up-front; we'll animate the DOM via FLIP.
  const color = state.tubes[from].pop();
  state.tubes[to].push(color);
  state.moves++;

  isAnimating = true;
  try {
    await animateMove(ballEl, dstTube);
  } finally {
    isAnimating = false;
  }
  playPour();

  if (isSolved(state.tubes, CAPACITY)) {
    onWin();
  }
}

async function animateMove(ballEl, dstTube) {
  // FLIP: snapshot start rect → reparent → snapshot end rect → animate inverse to identity.
  const startRect = ballEl.getBoundingClientRect();
  dstTube.appendChild(ballEl);
  const endRect = ballEl.getBoundingClientRect();
  const dx = startRect.left - endRect.left;
  const dy = startRect.top - endRect.top;

  // Lift apex above whichever rect is higher (smaller y) so the ball arcs over the rims.
  const apexY = Math.min(startRect.top, endRect.top) - Math.max(60, startRect.height * 0.9);
  const apexDy = apexY - endRect.top;

  ballEl.classList.add('flying');
  try {
    const anim = ballEl.animate(
      [
        { transform: `translate(${dx}px, ${dy}px)`, offset: 0 },
        { transform: `translate(${dx}px, ${apexDy}px)`, offset: 0.30, easing: 'ease-out' },
        { transform: `translate(0px, ${apexDy}px)`,    offset: 0.65, easing: 'ease-in-out' },
        { transform: `translate(0px, 0px)`,            offset: 1,    easing: 'ease-in' },
      ],
      { duration: 380 }
    );
    await anim.finished;
  } catch {
    // Animation may be cancelled (e.g., DOM reset). Swallow.
  } finally {
    ballEl.classList.remove('flying');
  }
}

// ---------------------------------------------------------------------------
// Outcome plumbing
// ---------------------------------------------------------------------------
function recordOutcome(solved) {
  state.history.push({
    solved,
    moves: state.moves,
    scrambleDepth: state.scrambleDepth,
  });
  if (state.history.length > 8) state.history.shift();
  const { difficulty, reset } = nextDifficulty(state.history, state.difficulty);
  state.difficulty = difficulty;
  if (reset) state.history = [];
  savePersisted();
}

function onWin() {
  // small delay so the final pour visually settles before the overlay
  setTimeout(() => {
    playWin();
    winScreen.hidden = false;
    recordOutcome(true);
    state.level += 1;
    savePersisted();
  }, 220);
}

nextBtn.addEventListener('click', () => {
  winScreen.hidden = true;
  startLevel();
});

resetBtn.addEventListener('click', () => {
  if (winScreen.hidden === false) return;
  // Restore the original puzzle. Only count it as a "this was hard" signal
  // if the kid actually made some moves before giving up.
  if (state.moves >= 3) recordOutcome(false);
  state.tubes = state.original.map((t) => [...t]);
  state.moves = 0;
  state.selected = null;
  render();
});

function startLevel() {
  const cfg = levelConfig(state.difficulty);
  state.tubes = generateLevel(cfg);
  state.original = state.tubes.map((t) => [...t]);
  state.scrambleDepth = cfg.scramble;
  state.moves = 0;
  state.selected = null;
  render();
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
function init() {
  const stored = loadPersisted();
  if (stored) {
    state.level = stored.level ?? 1;
    state.difficulty = stored.difficulty ?? 1;
    state.history = Array.isArray(stored.history) ? stored.history : [];
  }
  startLevel();
}

let resizeRAF = 0;
window.addEventListener('resize', () => {
  if (resizeRAF) cancelAnimationFrame(resizeRAF);
  resizeRAF = requestAnimationFrame(() => {
    fitTubeSize(state.tubes.length);
  });
});

init();
