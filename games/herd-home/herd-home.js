import { LEVELS } from './levels.js';
import { playSlide, playBlocked, playCapture, playWin } from './audio.js';
import { recordCompletion } from '../../shared/meta.js';
import { ANIMAL_SVG, ANIMAL_COLOR } from '../../shared/animals.js';

const STORE_KEY = 'maxs-games:herd-home';
const SLIDE_MS = 220;
const SETTLE_MS = 360;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  levelIdx: 0,
  animals: [],     // [{x, y, kind, captured}]
  history: [],     // snapshots for undo
  cellSize: 64,
};
let isAnimating = false;

// ---------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------
const board = document.getElementById('board');
const levelNumEl = document.getElementById('level-num');
const undoBtn = document.getElementById('undo-btn');
const resetBtn = document.getElementById('reset-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsScreen = document.getElementById('settings-screen');
const levelSlider = document.getElementById('level-slider');
const levelValueEl = document.getElementById('level-value');
const settingsApply = document.getElementById('settings-apply');
const winScreen = document.getElementById('win-screen');
const nextBtn = document.getElementById('next-btn');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isWall(grid, x, y) {
  if (y < 0 || y >= grid.length) return true;
  if (x < 0 || x >= grid[y].length) return true;
  return grid[y][x] === '#';
}

// Slide every free animal as far as it goes; returns new animal array or
// null if nothing moved. Mirrored in tools/check-herd-home.mjs.
function tilt(animals, dx, dy, grid, pens) {
  const order = animals
    .map((a, i) => ({ a, i }))
    .filter(({ a }) => !a.captured)
    .sort((m, n) =>
      dx === 1 ? n.a.x - m.a.x :
      dx === -1 ? m.a.x - n.a.x :
      dy === 1 ? n.a.y - m.a.y : m.a.y - n.a.y
    );
  const next = animals.map((a) => ({ ...a }));
  const occ = new Set(next.map((a) => `${a.x},${a.y}`));
  let moved = false;
  for (const { i } of order) {
    const a = next[i];
    occ.delete(`${a.x},${a.y}`);
    let { x, y } = a;
    for (;;) {
      const nx = x + dx, ny = y + dy;
      if (isWall(grid, nx, ny) || occ.has(`${nx},${ny}`)) break;
      x = nx; y = ny;
      if (pens.some(([px, py, kind]) => px === x && py === y && kind === a.kind)) {
        a.captured = true;
        break;
      }
    }
    if (x !== a.x || y !== a.y) moved = true;
    a.x = x; a.y = y;
    occ.add(`${x},${y}`);
  }
  return moved ? next : null;
}

// ---------------------------------------------------------------------------
// Layout / rendering
// ---------------------------------------------------------------------------
function computeCellSize(cols, rows) {
  const w = document.documentElement.clientWidth;
  const h = document.documentElement.clientHeight;
  const reserveTop = 76;
  const reserveBot = 220;
  const sidePad = 32;
  const wByWidth = (w - sidePad) / cols;
  const wByHeight = (h - reserveTop - reserveBot) / rows;
  return Math.max(36, Math.min(96, Math.floor(Math.min(wByWidth, wByHeight))));
}

function buildBoard() {
  const level = LEVELS[state.levelIdx];
  const cols = level.grid[0].length;
  const rows = level.grid.length;
  state.cellSize = computeCellSize(cols, rows);

  board.innerHTML = '';
  board.style.setProperty('--cols', String(cols));
  board.style.setProperty('--rows', String(rows));
  board.style.setProperty('--cell-size', state.cellSize + 'px');

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell ' + (level.grid[y][x] === '#' ? 'wall' : 'floor');
      cell.style.left = (x * state.cellSize) + 'px';
      cell.style.top = (y * state.cellSize) + 'px';
      board.appendChild(cell);
    }
  }

  for (const [px, py, kind] of level.pens) {
    const pen = document.createElement('div');
    pen.className = 'pen';
    pen.dataset.x = String(px);
    pen.dataset.y = String(py);
    pen.style.setProperty('--pen-color', ANIMAL_COLOR[kind]);
    pen.innerHTML = ANIMAL_SVG[kind];
    pen.style.left = (px * state.cellSize) + 'px';
    pen.style.top = (py * state.cellSize) + 'px';
    board.appendChild(pen);
  }

  for (let i = 0; i < state.animals.length; i++) {
    const el = document.createElement('div');
    el.className = 'entity';
    el.dataset.idx = String(i);
    el.innerHTML = ANIMAL_SVG[state.animals[i].kind];
    board.appendChild(el);
  }

  positionEntities({ instant: true });
}

function positionEntities({ instant = false } = {}) {
  const els = board.querySelectorAll('.entity');
  const place = () => {
    els.forEach((el, i) => {
      el.style.left = (state.animals[i].x * state.cellSize) + 'px';
      el.style.top = (state.animals[i].y * state.cellSize) + 'px';
    });
  };
  if (instant) {
    const prev = [];
    els.forEach((el) => { prev.push(el.style.transition); el.style.transition = 'none'; });
    place();
    void board.offsetWidth;
    els.forEach((el, i) => { el.style.transition = prev[i]; });
  } else {
    place();
  }
  syncPenFill();
}

// Pens with a captured animal show as solid (the ghost is replaced by the
// real animal sitting on top).
function syncPenFill() {
  const capturedAt = new Set(
    state.animals.filter((a) => a.captured).map((a) => `${a.x},${a.y}`)
  );
  board.querySelectorAll('.pen').forEach((pen) => {
    pen.classList.toggle('filled', capturedAt.has(`${pen.dataset.x},${pen.dataset.y}`));
  });
}

// ---------------------------------------------------------------------------
// Moves
// ---------------------------------------------------------------------------
function pushHistory() {
  state.history.push(state.animals.map((a) => ({ ...a })));
  if (state.history.length > 200) state.history.shift();
}

async function doTilt(dx, dy) {
  if (isAnimating) return;
  if (!winScreen.hidden || !settingsScreen.hidden) return;

  const level = LEVELS[state.levelIdx];
  const next = tilt(state.animals, dx, dy, level.grid, level.pens);
  if (!next) {
    playBlocked();
    return;
  }
  pushHistory();
  const newlyCaptured = next
    .map((a, i) => (a.captured && !state.animals[i].captured ? i : -1))
    .filter((i) => i >= 0);
  state.animals = next;

  isAnimating = true;
  playSlide();
  positionEntities();
  await wait(SLIDE_MS);

  if (newlyCaptured.length) {
    newlyCaptured.forEach((i, n) => {
      board.querySelectorAll('.entity')[i].classList.add('penned');
      playCapture(n * 0.12);
    });
    await wait(SETTLE_MS);
    newlyCaptured.forEach((i) => {
      board.querySelectorAll('.entity')[i].classList.remove('penned');
    });
  }
  isAnimating = false;

  if (state.animals.every((a) => a.captured)) onWin();
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

function undo() {
  if (isAnimating) return;
  if (!winScreen.hidden) return;
  if (state.history.length === 0) return;
  state.animals = state.history.pop();
  positionEntities({ instant: true });
}

function resetLevel() {
  if (isAnimating) return;
  loadLevel(state.levelIdx);
}

// ---------------------------------------------------------------------------
// Level lifecycle
// ---------------------------------------------------------------------------
function loadLevel(idx) {
  const safeIdx = Math.max(0, Math.min(LEVELS.length - 1, idx));
  const level = LEVELS[safeIdx];
  state.levelIdx = safeIdx;
  state.animals = level.animals.map(([x, y, kind]) => ({ x, y, kind, captured: false }));
  state.history = [];
  isAnimating = false;
  levelNumEl.textContent = String(safeIdx + 1);
  buildBoard();
  savePersisted();
}

function onWin() {
  recordCompletion('herd-home');
  setTimeout(() => {
    winScreen.hidden = false;
    playWin();
  }, 200);
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
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
document.querySelectorAll('[data-dir]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const d = DIRS[btn.dataset.dir];
    if (d) doTilt(d[0], d[1]);
  });
});
window.addEventListener('keydown', (e) => {
  const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
                w: 'up', s: 'down', a: 'left', d: 'right' };
  const dirName = map[e.key];
  if (dirName) {
    e.preventDefault();
    const d = DIRS[dirName];
    doTilt(d[0], d[1]);
  } else if (e.key === 'z' || e.key === 'Backspace') {
    undo();
  } else if (e.key === 'r') {
    resetLevel();
  } else if (e.key === 'Escape' && !settingsScreen.hidden) {
    settingsScreen.hidden = true;
  }
});

undoBtn.addEventListener('click', undo);
resetBtn.addEventListener('click', resetLevel);

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

let resizeRAF = 0;
window.addEventListener('resize', () => {
  if (resizeRAF) cancelAnimationFrame(resizeRAF);
  resizeRAF = requestAnimationFrame(() => {
    const savedAnimals = state.animals.map((a) => ({ ...a }));
    const savedHistory = state.history;
    buildBoard();
    state.animals = savedAnimals;
    state.history = savedHistory;
    positionEntities({ instant: true });
  });
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
loadLevel(loadPersisted()?.levelIdx ?? 0);
