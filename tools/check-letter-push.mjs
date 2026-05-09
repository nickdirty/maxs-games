// Verify each letter-push level is solvable, and report the optimal move count.
// Run: `node tools/check-letter-push.mjs`. Bounded BFS.

import { LEVELS } from '../games/letter-push/levels.js';

const H_FLIP = { b: 'd', d: 'b', p: 'q', q: 'p' };
function flipH(ch) { return H_FLIP[ch] ?? ch; }

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
function isWon(letters, targets) {
  return targets.every(([tx, ty, tch]) =>
    letters.some((l) => l.x === tx && l.y === ty && l.char === tch)
  );
}
function tryMove(state, dx, dy, grid) {
  const nx = state.player.x + dx, ny = state.player.y + dy;
  if (isWall(grid, nx, ny)) return null;
  const li = letterIndexAt(state.letters, nx, ny);
  if (li < 0) {
    return { player: { x: nx, y: ny }, letters: state.letters };
  }
  const bx = nx + dx, by = ny + dy;
  if (isWall(grid, bx, by) || letterIndexAt(state.letters, bx, by) >= 0) return null;
  const onGate = grid[by][bx] === 'H';
  const cur = state.letters[li];
  const newLetter = { x: bx, y: by, char: onGate ? flipH(cur.char) : cur.char };
  const newLetters = state.letters.slice();
  newLetters[li] = newLetter;
  return { player: { x: nx, y: ny }, letters: newLetters };
}
function canonical(state) {
  const lk = state.letters
    .map((l) => `${l.x},${l.y},${l.char}`)
    .sort()
    .join(';');
  return `${state.player.x},${state.player.y}|${lk}`;
}

function solve(level, { stateCap = 200_000, depthCap = 200 } = {}) {
  const grid = level.grid;
  const start = {
    player: { x: level.player[0], y: level.player[1] },
    letters: level.letters.map(([x, y, char]) => ({ x, y, char })),
  };
  if (isWon(start.letters, level.targets)) return 0;
  const visited = new Set([canonical(start)]);
  let frontier = [start];
  for (let depth = 1; depth <= depthCap; depth++) {
    const next = [];
    for (const s of frontier) {
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const ns = tryMove(s, dx, dy, grid);
        if (!ns) continue;
        const k = canonical(ns);
        if (visited.has(k)) continue;
        if (isWon(ns.letters, level.targets)) return depth;
        visited.add(k);
        next.push(ns);
        if (visited.size > stateCap) return -1;
      }
    }
    if (next.length === 0) return -1;
    frontier = next;
  }
  return -1;
}

const results = LEVELS.map((lvl, i) => {
  const t0 = Date.now();
  const m = solve(lvl);
  const ms = Date.now() - t0;
  return {
    level: i + 1,
    moves: m,
    ms: ms + 'ms',
    grid: `${lvl.grid[0].length}x${lvl.grid.length}`,
    letters: lvl.letters.length,
  };
});
console.table(results);
const bad = results.filter((r) => r.moves < 0);
if (bad.length) {
  console.error('UNSOLVABLE LEVELS:', bad.map((r) => r.level));
  process.exit(1);
}
console.log('all solvable');
