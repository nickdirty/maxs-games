import { LEVELS } from './levels.js';
import { playSwitch, playGo, playArrive, playWrong, playWin } from './audio.js';
import { recordCompletion } from '../../shared/meta.js';
import { ANIMAL_SVG, ANIMAL_COLOR } from '../../shared/animals.js';

const STORE_KEY = 'maxs-games:switch-tracks';
const SPEED = 3.4;          // track units per second
const SVG_NS = 'http://www.w3.org/2000/svg';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  levelIdx: 0,
  switches: {},     // junction node id -> selected outgoing edge index
  queue: [],        // kinds still waiting (head = current rider)
  filled: {},       // station node id -> kind settled there
  unit: 56,         // px per track unit
};
let isRiding = false;

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
const goBtn = document.getElementById('go-btn');
const queueRow = document.getElementById('queue-row');

// ---------------------------------------------------------------------------
// Graph helpers
// ---------------------------------------------------------------------------
function level() { return LEVELS[state.levelIdx]; }

function outgoing(lvl) {
  const out = {};
  for (const e of lvl.edges) (out[e.from] ??= []).push(e);
  return out;
}

// Follow current switch settings from start to a terminal node.
function routeEdges(lvl) {
  const out = outgoing(lvl);
  const edges = [];
  let cur = lvl.start;
  while (out[cur]?.length) {
    const opts = out[cur];
    const edge = opts[opts.length > 1 ? (state.switches[cur] ?? 0) : 0];
    edges.push(edge);
    cur = edge.to;
  }
  return { edges, terminal: cur };
}

// Concatenate edge polylines into one px-space point list.
function routePoints(edges) {
  const pts = [];
  for (const e of edges) {
    for (const p of e.pts) {
      const px = [p[0] * state.unit, p[1] * state.unit];
      const last = pts[pts.length - 1];
      if (!last || last[0] !== px[0] || last[1] !== px[1]) pts.push(px);
    }
  }
  return pts;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function computeUnit(w, h) {
  const cw = document.documentElement.clientWidth;
  const ch = document.documentElement.clientHeight;
  const reserveTop = 76;
  const reserveBot = 120;
  const sidePad = 24;
  return Math.max(28, Math.min(72, Math.floor(Math.min((cw - sidePad) / w, (ch - reserveTop - reserveBot) / h))));
}

function pathD(pts, unit) {
  return pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0] * unit} ${p[1] * unit}`).join(' ');
}

function buildBoard() {
  const lvl = level();
  const [w, h] = lvl.size;
  state.unit = computeUnit(w, h);
  const U = state.unit;

  board.innerHTML = '';
  board.style.width = (w * U) + 'px';
  board.style.height = (h * U) + 'px';

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'tracks');
  svg.setAttribute('width', String(w * U));
  svg.setAttribute('height', String(h * U));

  // ties under the rails give the track a railway read without extra cost
  for (const e of lvl.edges) {
    const ties = document.createElementNS(SVG_NS, 'path');
    ties.setAttribute('class', 'track-ties');
    ties.setAttribute('d', pathD(e.pts, U));
    ties.setAttribute('stroke-width', String(Math.round(U * 0.34)));
    ties.setAttribute('stroke-dasharray', `${Math.round(U * 0.08)} ${Math.round(U * 0.18)}`);
    ties.dataset.from = e.from;
    ties.dataset.to = e.to;
    svg.appendChild(ties);
  }
  for (const e of lvl.edges) {
    const base = document.createElementNS(SVG_NS, 'path');
    base.setAttribute('class', 'track-base');
    base.setAttribute('d', pathD(e.pts, U));
    base.setAttribute('stroke-width', String(Math.round(U * 0.16)));
    base.dataset.from = e.from;
    base.dataset.to = e.to;
    svg.appendChild(base);
  }
  board.appendChild(svg);

  // start platform
  const [sx, sy] = lvl.nodes[lvl.start];
  const platform = document.createElement('div');
  platform.className = 'platform';
  platform.style.left = (sx * U) + 'px';
  platform.style.top = (sy * U) + 'px';
  board.appendChild(platform);

  // stations
  for (const [nodeId, kind] of Object.entries(lvl.stations)) {
    const [x, y] = lvl.nodes[nodeId];
    const st = document.createElement('div');
    st.className = 'station';
    st.dataset.node = nodeId;
    st.style.setProperty('--ring', ANIMAL_COLOR[kind]);
    st.style.left = (x * U) + 'px';
    st.style.top = (y * U) + 'px';
    st.innerHTML = ANIMAL_SVG[kind];
    board.appendChild(st);
  }

  // switches: any node with 2+ outgoing edges
  const out = outgoing(lvl);
  for (const [nodeId, opts] of Object.entries(out)) {
    if (opts.length < 2) continue;
    const [x, y] = lvl.nodes[nodeId];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'switch-btn';
    btn.dataset.node = nodeId;
    btn.setAttribute('aria-label', 'Switch');
    btn.innerHTML = '<span class="arrow">➜</span>';
    btn.style.left = (x * U) + 'px';
    btn.style.top = (y * U) + 'px';
    btn.addEventListener('click', () => toggleSwitch(nodeId));
    board.appendChild(btn);
  }

  // settled riders from earlier in the level (rebuilds after resize)
  for (const [nodeId, kind] of Object.entries(state.filled)) {
    addRider(kind, lvl.nodes[nodeId], true);
    board.querySelector(`.station[data-node="${nodeId}"]`)?.classList.add('filled');
  }

  // current rider waits on the platform
  if (state.queue.length) addRider(state.queue[0], lvl.nodes[lvl.start], false);

  syncSwitchVisuals();
  syncQueueRow();
}

function addRider(kind, [x, y], settled) {
  const el = document.createElement('div');
  el.className = 'rider' + (settled ? ' settled' : '');
  el.innerHTML = ANIMAL_SVG[kind];
  el.style.left = (x * state.unit) + 'px';
  el.style.top = (y * state.unit) + 'px';
  board.appendChild(el);
  return el;
}

function currentRiderEl() {
  return board.querySelector('.rider:not(.settled)');
}

// Lit/faded branches + arrow direction on each switch.
function syncSwitchVisuals() {
  const lvl = level();
  const out = outgoing(lvl);
  for (const [nodeId, opts] of Object.entries(out)) {
    if (opts.length < 2) continue;
    const sel = state.switches[nodeId] ?? 0;
    opts.forEach((e, i) => {
      board.querySelectorAll(`path[data-from="${e.from}"][data-to="${e.to}"]`).forEach((p) => {
        p.classList.toggle('on', i === sel);
        p.classList.toggle('off', i !== sel);
      });
    });
    const chosen = opts[sel];
    const [x0, y0] = chosen.pts[0];
    const [x1, y1] = chosen.pts[1];
    const angle = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
    const arrow = board.querySelector(`.switch-btn[data-node="${nodeId}"] .arrow`);
    if (arrow) arrow.style.transform = `rotate(${angle}deg)`;
  }
}

function syncQueueRow() {
  queueRow.innerHTML = '';
  for (const kind of state.queue.slice(1)) {
    const s = document.createElement('span');
    s.className = 'waiting';
    s.innerHTML = ANIMAL_SVG[kind];
    queueRow.appendChild(s);
  }
  goBtn.disabled = isRiding || state.queue.length === 0;
}

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------
function toggleSwitch(nodeId) {
  if (isRiding || !winScreen.hidden || !settingsScreen.hidden) return;
  const opts = outgoing(level())[nodeId];
  state.switches[nodeId] = ((state.switches[nodeId] ?? 0) + 1) % opts.length;
  playSwitch();
  syncSwitchVisuals();
}

function animateAlong(el, pts) {
  // constant speed over the polyline; transform-only, cheap on old GPUs
  const segs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const len = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push({ a: pts[i - 1], b: pts[i], start: total, len });
    total += len;
  }
  const dur = (total / (SPEED * state.unit)) * 1000;
  const [ox, oy] = pts[0];
  return new Promise((resolve) => {
    const t0 = performance.now();
    function frame(now) {
      const dist = Math.min(1, (now - t0) / dur) * total;
      const seg = segs.find((s) => dist <= s.start + s.len) ?? segs[segs.length - 1];
      const f = seg.len ? (dist - seg.start) / seg.len : 1;
      const x = seg.a[0] + (seg.b[0] - seg.a[0]) * f;
      const y = seg.a[1] + (seg.b[1] - seg.a[1]) * f;
      el.style.transform = `translate(${x - ox}px, ${y - oy}px)`;
      if (now - t0 < dur) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}

async function go() {
  if (isRiding || !winScreen.hidden || !settingsScreen.hidden) return;
  if (state.queue.length === 0) return;
  const lvl = level();
  const rider = currentRiderEl();
  if (!rider) return;

  isRiding = true;
  goBtn.disabled = true;
  playGo();

  const { edges, terminal } = routeEdges(lvl);
  const pts = routePoints(edges);
  await animateAlong(rider, pts);

  const kind = state.queue[0];
  const want = lvl.stations[terminal];
  const stationEl = board.querySelector(`.station[data-node="${terminal}"]`);

  if (want === kind && !state.filled[terminal]) {
    // home! settle the rider into the station
    playArrive();
    state.queue.shift();
    state.filled[terminal] = kind;
    const [tx, ty] = lvl.nodes[terminal];
    rider.classList.add('settled');
    rider.style.transform = '';
    rider.style.left = (tx * state.unit) + 'px';
    rider.style.top = (ty * state.unit) + 'px';
    stationEl?.classList.add('filled');
    if (state.queue.length) addRider(state.queue[0], lvl.nodes[lvl.start], false);
    isRiding = false;
    syncQueueRow();
    if (state.queue.length === 0) onWin();
  } else {
    // wrong barn (or already full) — no failure, just ride home and retry
    playWrong();
    stationEl?.classList.add('wiggle');
    setTimeout(() => stationEl?.classList.remove('wiggle'), 450);
    await wait(350);
    await animateAlong(rider, pts.slice().reverse());
    rider.style.transform = '';
    isRiding = false;
    syncQueueRow();
  }
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ---------------------------------------------------------------------------
// Level lifecycle
// ---------------------------------------------------------------------------
function loadLevel(idx) {
  const safeIdx = Math.max(0, Math.min(LEVELS.length - 1, idx));
  state.levelIdx = safeIdx;
  state.switches = {};
  state.queue = [...LEVELS[safeIdx].queue];
  state.filled = {};
  isRiding = false;
  levelNumEl.textContent = String(safeIdx + 1);
  buildBoard();
  savePersisted();
}

function onWin() {
  recordCompletion('switch-tracks');
  setTimeout(() => {
    winScreen.hidden = false;
    playWin();
  }, 350);
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
goBtn.addEventListener('click', go);
resetBtn.addEventListener('click', () => { if (!isRiding) loadLevel(state.levelIdx); });

nextBtn.addEventListener('click', () => {
  winScreen.hidden = true;
  loadLevel(state.levelIdx + 1);
});

settingsBtn.addEventListener('click', () => {
  if (!winScreen.hidden || isRiding) return;
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
  if (e.key === ' ' || e.key === 'Enter') {
    if (settingsScreen.hidden && winScreen.hidden) { e.preventDefault(); go(); }
  } else if (e.key === 'r') {
    if (!isRiding) loadLevel(state.levelIdx);
  } else if (e.key === 'Escape' && !settingsScreen.hidden) {
    settingsScreen.hidden = true;
  }
});

let resizeRAF = 0;
window.addEventListener('resize', () => {
  if (resizeRAF) cancelAnimationFrame(resizeRAF);
  resizeRAF = requestAnimationFrame(() => {
    if (isRiding) return;    // mid-ride resize is rare; rebuild on next load
    buildBoard();
  });
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
loadLevel(loadPersisted()?.levelIdx ?? 0);
