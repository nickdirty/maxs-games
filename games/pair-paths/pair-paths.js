import { LEVELS } from './levels.js';
import { playStart, playConnect, playHint, playWin } from './audio.js';
import { recordCompletion } from '../../shared/meta.js';
import { ANIMAL_SVG, ANIMAL_COLOR } from '../../shared/animals.js';

const STORE_KEY = 'maxs-games:pair-paths';
const SVG_NS = 'http://www.w3.org/2000/svg';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  levelIdx: 0,
  drawn: new Map(),    // kind -> ordered [x,y] cells (always starts at an endpoint)
  drawing: null,       // kind currently being dragged, or null
  cellSize: 64,
};
let won = false;

// ---------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------
const board = document.getElementById('board');
const levelNumEl = document.getElementById('level-num');
const resetBtn = document.getElementById('reset-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsScreen = document.getElementById('settings-screen');
const levelSlider = document.getElementById('level-slider');
const levelValueEl = document.getElementById('level-value');
const settingsApply = document.getElementById('settings-apply');
const winScreen = document.getElementById('win-screen');
const nextBtn = document.getElementById('next-btn');

// ---------------------------------------------------------------------------
// Level helpers
// ---------------------------------------------------------------------------
function level() { return LEVELS[state.levelIdx]; }

// kind -> { a: [x,y] (mama), b: [x,y] (baby) }
function endpoints() {
  const eps = {};
  for (const p of level().paths) {
    eps[p.kind] = { a: p.cells[0], b: p.cells[p.cells.length - 1] };
  }
  return eps;
}

const same = (c1, c2) => c1[0] === c2[0] && c1[1] === c2[1];

function endpointKindAt(cell) {
  for (const [kind, { a, b }] of Object.entries(endpoints())) {
    if (same(a, cell) || same(b, cell)) return kind;
  }
  return null;
}

function isComplete(kind) {
  const cells = state.drawn.get(kind);
  if (!cells || cells.length < 2) return false;
  const { a, b } = endpoints()[kind];
  const first = cells[0], last = cells[cells.length - 1];
  return (same(first, a) && same(last, b)) || (same(first, b) && same(last, a));
}

// A cell is blocked for `kind` if any other kind's drawn path or endpoints
// sit there. Drawing never modifies other paths (constraints: a misdrag
// must not destroy work).
function blockedFor(kind, cell) {
  for (const [k, cells] of state.drawn) {
    if (k !== kind && cells.some((c) => same(c, cell))) return true;
  }
  for (const [k, { a, b }] of Object.entries(endpoints())) {
    if (k !== kind && (same(a, cell) || same(b, cell))) return true;
  }
  return false;
}

function coveredCount() {
  let n = 0;
  for (const cells of state.drawn.values()) n += cells.length;
  return n;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function computeCellSize(cols, rows) {
  const w = document.documentElement.clientWidth;
  const h = document.documentElement.clientHeight;
  const reserveTop = 76;
  const reserveBot = 40;
  const sidePad = 32;
  return Math.max(44, Math.min(110, Math.floor(Math.min((w - sidePad) / cols, (h - reserveTop - reserveBot - 80) / rows))));
}

function buildBoard() {
  const [cols, rows] = level().size;
  state.cellSize = computeCellSize(cols, rows);
  const cs = state.cellSize;

  board.innerHTML = '';
  board.style.width = (cols * cs) + 'px';
  board.style.height = (rows * cs) + 'px';

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);
      cell.style.left = (x * cs + 2) + 'px';
      cell.style.top = (y * cs + 2) + 'px';
      cell.style.width = (cs - 4) + 'px';
      cell.style.height = (cs - 4) + 'px';
      board.appendChild(cell);
    }
  }

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'paths');
  svg.setAttribute('width', String(cols * cs));
  svg.setAttribute('height', String(rows * cs));
  for (const p of level().paths) {
    const el = document.createElementNS(SVG_NS, 'path');
    el.dataset.kind = p.kind;
    el.setAttribute('stroke', ANIMAL_COLOR[p.kind]);
    el.setAttribute('stroke-width', String(Math.round(cs * 0.38)));
    svg.appendChild(el);
  }
  board.appendChild(svg);

  for (const [kind, { a, b }] of Object.entries(endpoints())) {
    for (const [cell, cls] of [[a, 'mama'], [b, 'baby']]) {
      const el = document.createElement('div');
      el.className = `endpoint ${cls}`;
      el.dataset.kind = kind;
      el.style.left = (cell[0] * cs) + 'px';
      el.style.top = (cell[1] * cs) + 'px';
      el.style.width = cs + 'px';
      el.style.height = cs + 'px';
      el.innerHTML = ANIMAL_SVG[kind];
      board.appendChild(el);
    }
  }

  renderPaths();
}

function renderPaths() {
  const cs = state.cellSize;
  board.querySelectorAll('svg.paths path').forEach((el) => {
    const cells = state.drawn.get(el.dataset.kind) ?? [];
    if (cells.length === 0) { el.setAttribute('d', ''); return; }
    const pts = cells.map(([x, y]) => `${x * cs + cs / 2} ${y * cs + cs / 2}`);
    // a 1-cell path still gets a visible dot via zero-length round-cap line
    const d = `M ${pts[0]} ` + (pts.length > 1 ? pts.slice(1).map((p) => `L ${p}`).join(' ') : `L ${pts[0]}`);
    el.setAttribute('d', d);
  });
  board.querySelectorAll('.endpoint').forEach((el) => {
    el.classList.toggle('linked', isComplete(el.dataset.kind));
  });
}

// ---------------------------------------------------------------------------
// Drag handling
// ---------------------------------------------------------------------------
function cellAt(e) {
  const r = board.getBoundingClientRect();
  const [cols, rows] = level().size;
  const x = Math.floor((e.clientX - r.left) / state.cellSize);
  const y = Math.floor((e.clientY - r.top) / state.cellSize);
  if (x < 0 || x >= cols || y < 0 || y >= rows) return null;
  return [x, y];
}

// One orthogonal step of the active path. Returns false when blocked.
function tryStep(kind, cell) {
  const cells = state.drawn.get(kind);
  const last = cells[cells.length - 1];
  const idx = cells.findIndex((c) => same(c, cell));
  if (idx >= 0) {
    // dragging back along own path retracts it
    state.drawn.set(kind, cells.slice(0, idx + 1));
    return true;
  }
  if (isComplete(kind)) return false;
  if (Math.abs(cell[0] - last[0]) + Math.abs(cell[1] - last[1]) !== 1) return false;
  if (blockedFor(kind, cell)) return false;
  cells.push(cell);
  if (isComplete(kind)) {
    playConnect();
    checkWin();
  }
  return true;
}

// Walk the path toward the finger one cell at a time, preferring the
// dominant axis — forgiving of diagonal-ish drags.
function advanceToward(kind, target) {
  for (let guard = 0; guard < 24; guard++) {
    const cells = state.drawn.get(kind);
    const last = cells[cells.length - 1];
    if (same(last, target)) return;
    const dx = target[0] - last[0], dy = target[1] - last[1];
    const tries = Math.abs(dx) >= Math.abs(dy)
      ? [[Math.sign(dx), 0], [0, Math.sign(dy)]]
      : [[0, Math.sign(dy)], [Math.sign(dx), 0]];
    let moved = false;
    for (const [sx, sy] of tries) {
      if (sx === 0 && sy === 0) continue;
      if (tryStep(kind, [last[0] + sx, last[1] + sy])) { moved = true; break; }
    }
    if (!moved) return;
  }
}

board.addEventListener('pointerdown', (e) => {
  if (won || !winScreen.hidden || !settingsScreen.hidden) return;
  const cell = cellAt(e);
  if (!cell) return;
  const epKind = endpointKindAt(cell);
  if (epKind) {
    // starting from an endpoint restarts that pair's path
    state.drawn.set(epKind, [cell]);
    state.drawing = epKind;
    playStart();
  } else {
    for (const [k, cells] of state.drawn) {
      const idx = cells.findIndex((c) => same(c, cell));
      if (idx >= 0) {
        state.drawn.set(k, cells.slice(0, idx + 1));
        state.drawing = k;
        break;
      }
    }
  }
  if (state.drawing) {
    board.setPointerCapture(e.pointerId);
    renderPaths();
  }
});

board.addEventListener('pointermove', (e) => {
  if (!state.drawing) return;
  const cell = cellAt(e);
  if (!cell) return;
  advanceToward(state.drawing, cell);
  renderPaths();
});

function endDrag() { state.drawing = null; }
board.addEventListener('pointerup', endDrag);
board.addEventListener('pointercancel', endDrag);

// ---------------------------------------------------------------------------
// Win logic
// ---------------------------------------------------------------------------
let hintTimer = 0;
function checkWin() {
  const kinds = level().paths.map((p) => p.kind);
  if (!kinds.every(isComplete)) return;
  const [cols, rows] = level().size;
  if (coveredCount() === cols * rows) {
    won = true;
    recordCompletion('pair-paths');
    setTimeout(() => {
      winScreen.hidden = false;
      playWin();
    }, 350);
  } else {
    // every pair is linked but some grass is unwalked — show where
    playHint();
    clearTimeout(hintTimer);
    const empty = [];
    const covered = new Set();
    for (const cells of state.drawn.values()) {
      for (const [x, y] of cells) covered.add(`${x},${y}`);
    }
    board.querySelectorAll('.cell').forEach((c) => {
      if (!covered.has(`${c.dataset.x},${c.dataset.y}`)) {
        c.classList.add('hint');
        empty.push(c);
      }
    });
    hintTimer = setTimeout(() => empty.forEach((c) => c.classList.remove('hint')), 950);
  }
}

// ---------------------------------------------------------------------------
// Level lifecycle
// ---------------------------------------------------------------------------
function loadLevel(idx) {
  const safeIdx = Math.max(0, Math.min(LEVELS.length - 1, idx));
  state.levelIdx = safeIdx;
  state.drawn = new Map(LEVELS[safeIdx].paths.map((p) => [p.kind, []]));
  state.drawing = null;
  won = false;
  levelNumEl.textContent = String(safeIdx + 1);
  buildBoard();
  savePersisted();
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
function savePersisted() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ levelIdx: state.levelIdx }));
  } catch { /* localStorage may be disabled */ }
}
function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
resetBtn.addEventListener('click', () => loadLevel(state.levelIdx));

nextBtn.addEventListener('click', () => {
  winScreen.hidden = true;
  loadLevel(state.levelIdx + 1);
});

settingsBtn.addEventListener('click', () => {
  if (!winScreen.hidden) return;
  levelSlider.max = String(LEVELS.length);
  levelSlider.value = String(state.levelIdx + 1);
  levelValueEl.textContent = String(state.levelIdx + 1);
  settingsScreen.hidden = false;
});
levelSlider.addEventListener('input', () => {
  levelValueEl.textContent = levelSlider.value;
});
settingsApply.addEventListener('click', () => {
  const newIdx = Number(levelSlider.value) - 1;
  settingsScreen.hidden = true;
  if (newIdx !== state.levelIdx) loadLevel(newIdx);
});
settingsScreen.addEventListener('click', (e) => {
  if (e.target === settingsScreen) settingsScreen.hidden = true;
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'r') loadLevel(state.levelIdx);
  else if (e.key === 'Escape' && !settingsScreen.hidden) settingsScreen.hidden = true;
});

let resizeRAF = 0;
window.addEventListener('resize', () => {
  if (resizeRAF) cancelAnimationFrame(resizeRAF);
  resizeRAF = requestAnimationFrame(() => {
    const savedDrawn = state.drawn;
    buildBoard();
    state.drawn = savedDrawn;
    renderPaths();
  });
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
loadLevel(loadPersisted()?.levelIdx ?? 0);
