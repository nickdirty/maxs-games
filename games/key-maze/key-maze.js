import { LEVELS } from './levels.js';
import { playStep, playPickup, playUnlock, playLocked, playBlocked, playWin } from './audio.js';
import { speak } from '../../shared/tts.js';
import { recordCompletion } from '../../shared/meta.js';
import { ANIMAL_SVG } from '../../shared/animals.js';

const STORE_KEY = 'maxs-games:key-maze';
const STEP_MS = 160;

const PLAYER_SVG = `
<svg viewBox="0 0 40 40" aria-hidden="true">
  <ellipse cx="11" cy="13" rx="4" ry="8" fill="#b98a5a" transform="rotate(-18 11 13)"/>
  <ellipse cx="29" cy="13" rx="4" ry="8" fill="#b98a5a" transform="rotate(18 29 13)"/>
  <circle cx="20" cy="22" r="13" fill="#d9a86e"/>
  <circle cx="15" cy="19" r="2" fill="#332211"/>
  <circle cx="25" cy="19" r="2" fill="#332211"/>
  <ellipse cx="20" cy="25.5" rx="4.5" ry="3.4" fill="#fff3e0"/>
  <circle cx="20" cy="24" r="1.9" fill="#332211"/>
  <path d="M 16.5 28.5 Q 20 30.8 23.5 28.5" stroke="#332211" stroke-width="1.8" fill="none" stroke-linecap="round"/>
</svg>`;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  levelIdx: 0,
  player: { x: 0, y: 0 },
  carried: null,            // letter or null
  keys: [],                 // [{x, y, ch}]
  openDoors: new Set(),     // indices into level.doors
  history: [],
  cellSize: 64,
};
let isAnimating = false;
let won = false;

// ---------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------
const board = document.getElementById('board');
const levelNumEl = document.getElementById('level-num');
const carrySlot = document.getElementById('carry-slot');
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
function level() { return LEVELS[state.levelIdx]; }

function isWall(grid, x, y) {
  if (y < 0 || y >= grid.length) return true;
  if (x < 0 || x >= grid[y].length) return true;
  return grid[y][x] === '#';
}

function closedDoorIndexAt(x, y) {
  const doors = level().doors;
  for (let i = 0; i < doors.length; i++) {
    if (doors[i][0] === x && doors[i][1] === y && !state.openDoors.has(i)) return i;
  }
  return -1;
}

function keyIndexAt(x, y) {
  return state.keys.findIndex((k) => k.x === x && k.y === y);
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
  const lvl = level();
  const cols = lvl.grid[0].length;
  const rows = lvl.grid.length;
  state.cellSize = computeCellSize(cols, rows);
  const cs = state.cellSize;

  board.innerHTML = '';
  board.style.setProperty('--cols', String(cols));
  board.style.setProperty('--rows', String(rows));
  board.style.setProperty('--cell-size', cs + 'px');

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell ' + (lvl.grid[y][x] === '#' ? 'wall' : 'floor');
      cell.style.left = (x * cs) + 'px';
      cell.style.top = (y * cs) + 'px';
      board.appendChild(cell);
    }
  }

  lvl.doors.forEach(([x, y, ch], i) => {
    if (state.openDoors.has(i)) return;
    const door = document.createElement('div');
    door.className = 'door';
    door.dataset.idx = String(i);
    door.innerHTML = `<span class="door-letter">${ch}</span>`;
    door.style.left = (x * cs) + 'px';
    door.style.top = (y * cs) + 'px';
    board.appendChild(door);
  });

  for (const k of state.keys) {
    const key = document.createElement('div');
    key.className = 'key';
    key.dataset.pos = `${k.x},${k.y}`;
    key.innerHTML = `<span class="key-letter">${k.ch}</span>`;
    key.style.left = (k.x * cs) + 'px';
    key.style.top = (k.y * cs) + 'px';
    board.appendChild(key);
  }

  const [fx, fy, kind] = lvl.friend;
  const friend = document.createElement('div');
  friend.className = 'entity friend';
  friend.id = 'friend';
  friend.innerHTML = ANIMAL_SVG[kind];
  friend.style.left = (fx * cs) + 'px';
  friend.style.top = (fy * cs) + 'px';
  board.appendChild(friend);

  const player = document.createElement('div');
  player.className = 'entity player';
  player.id = 'player';
  player.innerHTML = PLAYER_SVG;
  board.appendChild(player);
  positionPlayer({ instant: true });
  renderCarry();
}

function positionPlayer({ instant = false } = {}) {
  const el = document.getElementById('player');
  if (!el) return;
  if (instant) {
    const prev = el.style.transition;
    el.style.transition = 'none';
    el.style.left = (state.player.x * state.cellSize) + 'px';
    el.style.top = (state.player.y * state.cellSize) + 'px';
    void board.offsetWidth;
    el.style.transition = prev;
  } else {
    el.style.left = (state.player.x * state.cellSize) + 'px';
    el.style.top = (state.player.y * state.cellSize) + 'px';
  }
}

function renderCarry() {
  carrySlot.textContent = state.carried ?? '';
  carrySlot.classList.toggle('holding', state.carried !== null);
}

// Rebuild key tiles in place (after pickups/swaps).
function renderKeys() {
  board.querySelectorAll('.key').forEach((el) => el.remove());
  const cs = state.cellSize;
  for (const k of state.keys) {
    const key = document.createElement('div');
    key.className = 'key';
    key.innerHTML = `<span class="key-letter">${k.ch}</span>`;
    key.style.left = (k.x * cs) + 'px';
    key.style.top = (k.y * cs) + 'px';
    board.appendChild(key);
  }
}

// ---------------------------------------------------------------------------
// Movement
// ---------------------------------------------------------------------------
function pushHistory() {
  state.history.push({
    player: { ...state.player },
    carried: state.carried,
    keys: state.keys.map((k) => ({ ...k })),
    openDoors: new Set(state.openDoors),
  });
  if (state.history.length > 300) state.history.shift();
}

async function tryMove(dx, dy) {
  if (isAnimating || won) return;
  if (!winScreen.hidden || !settingsScreen.hidden) return;

  const lvl = level();
  const nx = state.player.x + dx, ny = state.player.y + dy;
  if (isWall(lvl.grid, nx, ny)) {
    playBlocked();
    return;
  }

  const di = closedDoorIndexAt(nx, ny);
  if (di >= 0) {
    const doorCh = lvl.doors[di][2];
    if (state.carried === doorCh) {
      pushHistory();
      state.openDoors.add(di);
      state.carried = null;
      renderCarry();
      playUnlock();
      speak(doorCh);
      const doorEl = board.querySelector(`.door[data-idx="${di}"]`);
      doorEl?.classList.add('opening');
      isAnimating = true;
      await wait(300);
      doorEl?.remove();
      state.player = { x: nx, y: ny };
      positionPlayer();
      await wait(STEP_MS);
      isAnimating = false;
      checkWin();
    } else {
      // wrong key (or empty hands): the door wiggles, the carry slot
      // shakes — look again. No penalty.
      playLocked();
      const doorEl = board.querySelector(`.door[data-idx="${di}"]`);
      doorEl?.classList.add('shut');
      carrySlot.classList.add('shake');
      setTimeout(() => {
        doorEl?.classList.remove('shut');
        carrySlot.classList.remove('shake');
      }, 450);
    }
    return;
  }

  pushHistory();
  state.player = { x: nx, y: ny };

  const ki = keyIndexAt(nx, ny);
  if (ki >= 0) {
    const picked = state.keys[ki].ch;
    if (state.carried === null) {
      state.keys.splice(ki, 1);
    } else {
      // swap: the carried key drops where this one was
      state.keys[ki] = { x: nx, y: ny, ch: state.carried };
    }
    state.carried = picked;
    renderKeys();
    renderCarry();
    playPickup();
    speak(picked);
  } else {
    playStep();
  }

  isAnimating = true;
  positionPlayer();
  await wait(STEP_MS);
  isAnimating = false;
  checkWin();
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

function checkWin() {
  const [fx, fy] = level().friend;
  if (state.player.x !== fx || state.player.y !== fy) return;
  won = true;
  recordCompletion('key-maze');
  document.getElementById('friend')?.classList.add('rescued');
  setTimeout(() => {
    winScreen.hidden = false;
    playWin();
  }, 450);
}

function undo() {
  if (isAnimating || won) return;
  if (!winScreen.hidden) return;
  if (state.history.length === 0) return;
  const prev = state.history.pop();
  state.player = prev.player;
  state.carried = prev.carried;
  state.keys = prev.keys;
  const reopened = prev.openDoors.size !== state.openDoors.size;
  state.openDoors = prev.openDoors;
  if (reopened) buildBoard();
  else {
    renderKeys();
    renderCarry();
    positionPlayer({ instant: true });
  }
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
  const lvl = LEVELS[safeIdx];
  state.levelIdx = safeIdx;
  state.player = { x: lvl.player[0], y: lvl.player[1] };
  state.carried = null;
  state.keys = lvl.keys.map(([x, y, ch]) => ({ x, y, ch }));
  state.openDoors = new Set();
  state.history = [];
  isAnimating = false;
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
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
document.querySelectorAll('[data-dir]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const d = DIRS[btn.dataset.dir];
    if (d) tryMove(d[0], d[1]);
  });
});
window.addEventListener('keydown', (e) => {
  const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
                w: 'up', s: 'down', a: 'left', d: 'right' };
  const dirName = map[e.key];
  if (dirName) {
    e.preventDefault();
    const d = DIRS[dirName];
    tryMove(d[0], d[1]);
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
  resizeRAF = requestAnimationFrame(() => buildBoard());
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
loadLevel(loadPersisted()?.levelIdx ?? 0);
