// Verify each herd-home level is solvable; report optimal tilt count and
// one optimal solution. Run: `node tools/check-herd-home.mjs`. Bounded BFS.

import { LEVELS } from '../games/herd-home/levels.js';

const DIRS = [
  { dx: 0, dy: -1, name: 'U' },
  { dx: 0, dy: 1, name: 'D' },
  { dx: -1, dy: 0, name: 'L' },
  { dx: 1, dy: 0, name: 'R' },
];

function isWall(grid, x, y) {
  if (y < 0 || y >= grid.length) return true;
  if (x < 0 || x >= grid[y].length) return true;
  return grid[y][x] === '#';
}

// Mirrors the game's tilt resolution: animals sorted leading-first slide
// until wall/animal; an animal entering its matching pen locks there.
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

// Same-kind animals are interchangeable: canonicalize by sorting per kind.
function canonical(animals) {
  return animals
    .map((a) => `${a.kind}:${a.x},${a.y},${a.captured ? 1 : 0}`)
    .sort()
    .join(';');
}

function solve(level, { stateCap = 2_000_000, depthCap = 60 } = {}) {
  const { grid, pens } = level;
  const start = level.animals.map(([x, y, kind]) => ({ x, y, kind, captured: false }));
  const won = (as) => as.every((a) => a.captured);
  if (won(start)) return { moves: 0, path: '' };
  const startKey = canonical(start);
  const parent = new Map([[startKey, null]]);
  let frontier = [{ animals: start, key: startKey }];
  for (let depth = 1; depth <= depthCap; depth++) {
    const next = [];
    for (const s of frontier) {
      for (const d of DIRS) {
        const ns = tilt(s.animals, d.dx, d.dy, grid, pens);
        if (!ns) continue;
        const k = canonical(ns);
        if (parent.has(k)) continue;
        parent.set(k, { prev: s.key, move: d.name });
        if (won(ns)) {
          let path = '';
          for (let cur = k; parent.get(cur); cur = parent.get(cur).prev) {
            path = parent.get(cur).move + path;
          }
          return { moves: depth, path };
        }
        next.push({ animals: ns, key: k });
        if (parent.size > stateCap) return { moves: -1, path: 'STATE CAP' };
      }
    }
    if (next.length === 0) return { moves: -1, path: 'EXHAUSTED' };
    frontier = next;
  }
  return { moves: -1, path: 'DEPTH CAP' };
}

const results = LEVELS.map((lvl, i) => {
  const t0 = Date.now();
  const { moves, path } = solve(lvl);
  return {
    level: i + 1,
    moves,
    solution: path,
    ms: (Date.now() - t0) + 'ms',
    grid: `${lvl.grid[0].length}x${lvl.grid.length}`,
    animals: lvl.animals.length,
  };
});
console.table(results);
const bad = results.filter((r) => r.moves < 0);
if (bad.length) {
  console.error('UNSOLVABLE LEVELS:', bad.map((r) => r.level));
  process.exit(1);
}
console.log('all solvable');
