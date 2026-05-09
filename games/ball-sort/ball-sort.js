import { playPick, playPour, playWin, playBlocked } from './audio.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STORE_KEY = 'maxs-games:ball-sort';
const CAPACITY = 4; // balls per tube

const PALETTE = [
  '#e84c4c',
  '#4682e6',
  '#f0c83c',
  '#5cb85c',
  '#9b59b6',
  '#ff8c42',
  '#ec407a',
  '#26c6da',
];

// ---------------------------------------------------------------------------
// Difficulty
// ---------------------------------------------------------------------------
// Each tier maps to (colors, empties, target optimal-solve range).
// Difficulty (1..12) is hidden; the displayed level number just increments.
// Generation does a random fill and validates with a BFS solver; we accept
// the puzzle if the optimal solution length lands in [minMoves, maxMoves].
// All tiers use 2 empties — with only 1 empty, low-color puzzles are
// trivially equivalent to solved no matter how long you scramble.
const TIERS = {
  1:  { colors: 3, empties: 2, minMoves: 4,  maxMoves: 10 },
  2:  { colors: 3, empties: 2, minMoves: 8,  maxMoves: 14 },
  3:  { colors: 4, empties: 2, minMoves: 10, maxMoves: 16 },
  4:  { colors: 4, empties: 2, minMoves: 14, maxMoves: 22 },
  5:  { colors: 5, empties: 2, minMoves: 16, maxMoves: 24 },
  6:  { colors: 5, empties: 2, minMoves: 20, maxMoves: 30 },
  7:  { colors: 6, empties: 2, minMoves: 22, maxMoves: 34 },
  8:  { colors: 6, empties: 2, minMoves: 28, maxMoves: 40 },
  9:  { colors: 7, empties: 2, minMoves: 30, maxMoves: 44 },
  10: { colors: 7, empties: 2, minMoves: 34, maxMoves: 50 },
  11: { colors: 8, empties: 2, minMoves: 36, maxMoves: 54 },
  12: { colors: 8, empties: 2, minMoves: 40, maxMoves: 60 },
};
const MAX_TIER = 12;

function levelConfig(d) {
  const tier = TIERS[Math.max(1, Math.min(MAX_TIER, d))];
  return { ...tier, capacity: CAPACITY };
}

function nextDifficulty(history, current) {
  // 3 consecutive efficient solves → bump up. 2 consecutive struggles → bump
  // down. Window resets after a step so we re-evidence at the new tier.
  const eff = (o) => o.solved && o.optimalMoves > 0 && o.moves <= o.optimalMoves * 1.8;
  const struggle = (o) => !o.solved || (o.optimalMoves > 0 && o.moves > o.optimalMoves * 4);
  const last3 = history.slice(-3);
  if (last3.length === 3 && last3.every(eff)) {
    return { difficulty: Math.min(current + 1, MAX_TIER), reset: true };
  }
  const last2 = history.slice(-2);
  if (last2.length === 2 && last2.every(struggle)) {
    return { difficulty: Math.max(current - 1, 1), reset: true };
  }
  return { difficulty: current, reset: false };
}

// ---------------------------------------------------------------------------
// Puzzle mechanics + solver
// ---------------------------------------------------------------------------
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

// Solver-only move list. Prunes branches that don't help solve:
//  - never pour off a full uniform tube (it's already a solved column)
//  - never pour a uniform stack onto an empty tube (just a tube relabel,
//    canonicalization would dedupe but pruning is faster)
// Player code uses canMove() with no pruning.
function listSolverMoves(tubes, cap) {
  const moves = [];
  for (let i = 0; i < tubes.length; i++) {
    const src = tubes[i];
    if (src.length === 0) continue;
    const top = src[src.length - 1];
    let homogeneous = true;
    for (const x of src) if (x !== top) { homogeneous = false; break; }
    if (homogeneous && src.length === cap) continue;
    for (let j = 0; j < tubes.length; j++) {
      if (i === j) continue;
      const dst = tubes[j];
      if (dst.length >= cap) continue;
      if (dst.length === 0) {
        if (homogeneous) continue;
        moves.push({ from: i, to: j });
      } else if (dst[dst.length - 1] === top) {
        moves.push({ from: i, to: j });
      }
    }
  }
  return moves;
}

function applyMove(tubes, m) {
  const next = tubes.map((t) => t.slice());
  next[m.to].push(next[m.from].pop());
  return next;
}

// Canonical key collapses tube-permutation symmetry: two states differing
// only by tube order map to the same string.
function canonical(tubes) {
  return tubes.map((t) => t.join(',')).sort().join('|');
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomFill(cfg) {
  const balls = [];
  for (let c = 0; c < cfg.colors; c++) {
    for (let i = 0; i < cfg.capacity; i++) balls.push(c);
  }
  shuffle(balls);
  const tubes = [];
  for (let c = 0; c < cfg.colors; c++) {
    tubes.push(balls.splice(0, cfg.capacity));
  }
  for (let i = 0; i < cfg.empties; i++) tubes.push([]);
  return tubes;
}

// BFS solver. Returns optimal solution length, or -1 if unsolvable / aborted.
// stateCap bounds memory; for 6+ colors BFS to optimal can blow past it on
// the tablet — that's fine, we treat the abort as "definitely hard enough".
function solveBFS(tubes, cap, { stateCap = 120_000, depthCap = 80 } = {}) {
  if (isSolved(tubes, cap)) return 0;
  const visited = new Set();
  visited.add(canonical(tubes));
  let frontier = [tubes];
  for (let depth = 1; depth <= depthCap; depth++) {
    const next = [];
    for (const state of frontier) {
      const moves = listSolverMoves(state, cap);
      for (const m of moves) {
        const ns = applyMove(state, m);
        if (isSolved(ns, cap)) return depth;
        const key = canonical(ns);
        if (visited.has(key)) continue;
        visited.add(key);
        next.push(ns);
        if (visited.size > stateCap) return -1;
      }
    }
    if (next.length === 0) return -1;
    frontier = next;
  }
  return -1;
}

function generateLevel(cfg) {
  // Random fills are usually solvable. Try several; prefer ones whose
  // optimal solve length lands inside the tier's target band, fall back
  // to the closest acceptable result if the band is missed. Wall-time
  // bounded so high tiers don't make the kid wait between levels.
  const target = (cfg.minMoves + cfg.maxMoves) / 2;
  const deadlineMs = 1200;
  const t0 = Date.now();
  let best = null;
  for (let attempt = 0; attempt < 24; attempt++) {
    if (best && Date.now() - t0 > deadlineMs) break;
    const tubes = randomFill(cfg);
    if (isSolved(tubes, cfg.capacity)) continue;
    const moves = solveBFS(tubes, cfg.capacity, { depthCap: cfg.maxMoves + 8 });
    if (moves < 0) {
      // Solver aborted (state cap on a hard puzzle) — treat as hard-enough.
      if (!best) best = { tubes, optimalMoves: cfg.maxMoves };
      continue;
    }
    if (moves >= cfg.minMoves && moves <= cfg.maxMoves) {
      return { tubes, optimalMoves: moves };
    }
    if (!best || Math.abs(moves - target) < Math.abs(best.optimalMoves - target)) {
      best = { tubes, optimalMoves: moves };
    }
  }
  return best ?? { tubes: randomFill(cfg), optimalMoves: cfg.minMoves };
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
  optimalMoves: 0,  // BFS-found minimum solution length for this puzzle
};

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Schema migration: drop old-shape history entries (scrambleDepth-based).
    if (Array.isArray(data.history)) {
      data.history = data.history.filter((o) => o && typeof o.optimalMoves === 'number');
    }
    return data;
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
const settingsBtn = document.getElementById('settings-btn');
const settingsScreen = document.getElementById('settings-screen');
const diffSlider = document.getElementById('diff-slider');
const diffValue = document.getElementById('diff-value');
const settingsApply = document.getElementById('settings-apply');

function ballHTML(colorIdx) {
  const color = PALETTE[colorIdx % PALETTE.length];
  return `<div class="ball" data-color="${colorIdx}" style="background-color:${color}"></div>`;
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
    optimalMoves: state.optimalMoves,
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

settingsBtn.addEventListener('click', () => {
  diffSlider.value = String(state.difficulty);
  diffValue.textContent = String(state.difficulty);
  settingsScreen.hidden = false;
});

diffSlider.addEventListener('input', () => {
  diffValue.textContent = diffSlider.value;
});

settingsApply.addEventListener('click', () => {
  const newDiff = Number(diffSlider.value);
  settingsScreen.hidden = true;
  if (newDiff === state.difficulty) return;
  // Reset adaptive window so we re-evidence at the manually-chosen tier.
  state.difficulty = newDiff;
  state.history = [];
  savePersisted();
  startLevel();
});

settingsScreen.addEventListener('click', (e) => {
  // Tap outside the card dismisses without applying.
  if (e.target === settingsScreen) settingsScreen.hidden = true;
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
  const { tubes, optimalMoves } = generateLevel(cfg);
  state.tubes = tubes;
  state.original = tubes.map((t) => [...t]);
  state.optimalMoves = optimalMoves;
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
