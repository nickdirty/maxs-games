import { LEVELS } from './levels.js';
import {
  playStep, playPush, playFlip, playWin, playBlocked,
  speak, getEnglishVoices, getEffectiveVoice,
  setSelectedVoiceName, getSelectedVoiceName, onVoicesChanged,
} from './audio.js';

const STORE_KEY = 'maxs-games:letter-push';
const SLIDE_MS = 200;
const FLIP_MS = 250;

const PLAYER_SVG = `
<svg viewBox="0 0 40 40" aria-hidden="true">
  <circle cx="20" cy="20" r="17" fill="#ffd14d" stroke="#a87a1a" stroke-width="2"/>
  <circle cx="14" cy="17" r="2.5" fill="#222"/>
  <circle cx="26" cy="17" r="2.5" fill="#222"/>
  <path d="M 12 25 Q 20 31 28 25" stroke="#222" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  levelIdx: 0,
  player: { x: 0, y: 0 },
  letters: [],
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
const voiceSelect = document.getElementById('voice-select');
const voiceTestBtn = document.getElementById('voice-test');
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

function letterIndexAt(letters, x, y) {
  for (let i = 0; i < letters.length; i++) {
    if (letters[i].x === x && letters[i].y === y) return i;
  }
  return -1;
}

const H_FLIP = { b: 'd', d: 'b', p: 'q', q: 'p' };
function flipH(ch) { return H_FLIP[ch] ?? ch; }

function isWon(letters, targets) {
  return targets.every(([tx, ty, tch]) =>
    letters.some((l) => l.x === tx && l.y === ty && l.char === tch)
  );
}

// ---------------------------------------------------------------------------
// Layout / rendering
// ---------------------------------------------------------------------------
function computeCellSize(cols, rows) {
  const w = document.documentElement.clientWidth;
  const h = document.documentElement.clientHeight;
  const reserveTop = 76;        // topbar + safe-area
  const reserveBot = 220;       // controls + safe-area
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
      const ch = level.grid[y][x];
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (ch === '#') cell.classList.add('wall');
      else if (ch === 'H') cell.classList.add('gate-h');
      else cell.classList.add('floor');
      cell.style.left = (x * state.cellSize) + 'px';
      cell.style.top = (y * state.cellSize) + 'px';
      board.appendChild(cell);
    }
  }

  for (const [tx, ty, tch] of level.targets) {
    const t = document.createElement('div');
    t.className = 'target';
    t.textContent = tch;
    t.style.left = (tx * state.cellSize) + 'px';
    t.style.top = (ty * state.cellSize) + 'px';
    board.appendChild(t);
  }

  const playerEl = document.createElement('div');
  playerEl.className = 'entity player';
  playerEl.id = 'player';
  playerEl.innerHTML = PLAYER_SVG;
  board.appendChild(playerEl);

  for (let i = 0; i < state.letters.length; i++) {
    const el = document.createElement('div');
    el.className = 'entity letter';
    el.dataset.idx = String(i);
    el.textContent = state.letters[i].char;
    board.appendChild(el);
  }

  positionEntities({ instant: true });
}

function positionEntities({ instant = false } = {}) {
  const player = document.getElementById('player');
  if (!player) return;
  const setPos = (el, x, y) => {
    el.style.left = (x * state.cellSize) + 'px';
    el.style.top  = (y * state.cellSize) + 'px';
  };
  if (instant) {
    // Suppress transitions for the snap (e.g., undo, level load).
    const prev = [];
    [player, ...board.querySelectorAll('.entity.letter')].forEach((el) => {
      prev.push([el, el.style.transition]);
      el.style.transition = 'none';
    });
    setPos(player, state.player.x, state.player.y);
    board.querySelectorAll('.entity.letter').forEach((el, i) => {
      const { x, y, char } = state.letters[i];
      setPos(el, x, y);
      el.textContent = char;
    });
    // Force a reflow so the no-transition state actually commits before re-enabling.
    void board.offsetWidth;
    prev.forEach(([el, t]) => { el.style.transition = t; });
  } else {
    setPos(player, state.player.x, state.player.y);
    board.querySelectorAll('.entity.letter').forEach((el, i) => {
      const { x, y } = state.letters[i];
      setPos(el, x, y);
    });
  }
}

// ---------------------------------------------------------------------------
// Movement
// ---------------------------------------------------------------------------
function pushHistory() {
  state.history.push({
    player: { ...state.player },
    letters: state.letters.map((l) => ({ ...l })),
  });
  if (state.history.length > 200) state.history.shift();
}

async function tryMove(dx, dy) {
  if (isAnimating) return;
  if (!winScreen.hidden) return;
  if (!settingsScreen.hidden) return;

  const level = LEVELS[state.levelIdx];
  const grid = level.grid;
  const px = state.player.x, py = state.player.y;
  const nx = px + dx, ny = py + dy;

  if (isWall(grid, nx, ny)) {
    playBlocked();
    return;
  }

  const li = letterIndexAt(state.letters, nx, ny);
  if (li >= 0) {
    const bx = nx + dx, by = ny + dy;
    if (isWall(grid, bx, by) || letterIndexAt(state.letters, bx, by) >= 0) {
      playBlocked();
      return;
    }
    pushHistory();
    const onGate = grid[by][bx] === 'H';
    const newChar = onGate ? flipH(state.letters[li].char) : state.letters[li].char;
    state.letters[li] = { x: bx, y: by, char: newChar };
    state.player = { x: nx, y: ny };

    isAnimating = true;
    playPush();
    await animatePush(li, onGate);
    isAnimating = false;

    if (isWon(state.letters, level.targets)) onWin();
  } else {
    pushHistory();
    state.player = { x: nx, y: ny };
    isAnimating = true;
    playStep();
    positionEntities();
    await wait(SLIDE_MS);
    isAnimating = false;
  }
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function animatePush(letterIdx, didFlip) {
  positionEntities();
  await wait(SLIDE_MS);
  if (didFlip) {
    const el = board.querySelectorAll('.entity.letter')[letterIdx];
    el.classList.add('flipping');
    // Swap text content at the midpoint of the flip animation (when scaleX=0).
    setTimeout(() => {
      const newChar = state.letters[letterIdx].char;
      el.textContent = newChar;
      // Reinforce the new identity audibly — the whole point of the gate is
      // that the letter changed, and TTS lands that for an emerging reader.
      speak(newChar);
    }, FLIP_MS / 2);
    playFlip();
    await wait(FLIP_MS);
    el.classList.remove('flipping');
  }
}

function undo() {
  if (isAnimating) return;
  if (!winScreen.hidden) return;
  if (state.history.length === 0) return;
  const prev = state.history.pop();
  state.player = prev.player;
  state.letters = prev.letters;
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
  state.player = { x: level.player[0], y: level.player[1] };
  state.letters = level.letters.map(([x, y, char]) => ({ x, y, char }));
  state.history = [];
  isAnimating = false;
  levelNumEl.textContent = String(safeIdx + 1);
  buildBoard();
  savePersisted();
}

function onWin() {
  setTimeout(() => {
    playWin();
    winScreen.hidden = false;
  }, 220);
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
function savePersisted() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      levelIdx: state.levelIdx,
      voice: getSelectedVoiceName(),
    }));
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
  refreshVoiceSelect();
  settingsScreen.hidden = false;
});
levelSlider.addEventListener('input', () => {
  levelValueEl.textContent = levelSlider.value;
});
settingsApply.addEventListener('click', () => {
  const newIdx = Number(levelSlider.value) - 1;
  // Apply the voice selection from the dropdown.
  if (voiceSelect.value) setSelectedVoiceName(voiceSelect.value);
  settingsScreen.hidden = true;
  savePersisted();
  if (newIdx !== state.levelIdx) loadLevel(newIdx);
});
settingsScreen.addEventListener('click', (e) => {
  if (e.target === settingsScreen) settingsScreen.hidden = true;
});

// Voice picker: populate the dropdown with English voices, mark the
// currently-effective one as selected. The "test" button speaks the four
// confusable letters with whatever's *highlighted in the dropdown* (not
// yet applied) so you can audition before committing.
function refreshVoiceSelect() {
  if (!voiceSelect) return;
  const voices = getEnglishVoices();
  voiceSelect.innerHTML = '';
  if (voices.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = 'No voices available';
    opt.disabled = true;
    voiceSelect.appendChild(opt);
    voiceSelect.disabled = true;
    voiceTestBtn.disabled = true;
    return;
  }
  voiceSelect.disabled = false;
  voiceTestBtn.disabled = false;
  for (const v of voices) {
    const opt = document.createElement('option');
    opt.value = v.name;
    // Trim verbose Google IDs to fit narrower screens.
    const labelName = v.name.length > 36 ? v.name.slice(0, 33) + '…' : v.name;
    opt.textContent = `${labelName}  (${v.lang})`;
    voiceSelect.appendChild(opt);
  }
  const eff = getEffectiveVoice();
  if (eff) voiceSelect.value = eff.name;
}

voiceTestBtn?.addEventListener('click', () => {
  const candidate = voiceSelect.value;
  const v = getEnglishVoices().find((x) => x.name === candidate);
  speak('b. d. p. q.', { voice: v ?? undefined });
});

onVoicesChanged(() => {
  // Keep the dropdown fresh if the voice list changes while settings is open.
  if (!settingsScreen.hidden) refreshVoiceSelect();
});

let resizeRAF = 0;
window.addEventListener('resize', () => {
  if (resizeRAF) cancelAnimationFrame(resizeRAF);
  resizeRAF = requestAnimationFrame(() => {
    // Re-render at the new cell size; preserve current play state (player, letters, history).
    const savedPlayer = { ...state.player };
    const savedLetters = state.letters.map((l) => ({ ...l }));
    const savedHistory = state.history;
    buildBoard();
    state.player = savedPlayer;
    state.letters = savedLetters;
    state.history = savedHistory;
    positionEntities({ instant: true });
  });
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
const persisted = loadPersisted();
if (persisted?.voice) setSelectedVoiceName(persisted.voice);
loadLevel(persisted?.levelIdx ?? 0);
