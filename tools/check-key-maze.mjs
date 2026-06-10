// Verify each key-maze level is solvable; report optimal step count.
// Run: `node tools/check-key-maze.mjs`. BFS over (player, carried, floor
// keys, open doors) — swaps included.

import { LEVELS } from '../games/key-maze/levels.js';

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

function isWall(grid, x, y) {
  if (y < 0 || y >= grid.length) return true;
  if (x < 0 || x >= grid[y].length) return true;
  return grid[y][x] === '#';
}

function solve(level, { stateCap = 3_000_000, depthCap = 400 } = {}) {
  const { grid } = level;
  const friend = level.friend;
  const start = {
    px: level.player[0], py: level.player[1],
    carried: null,
    keys: level.keys.map(([x, y, ch]) => ({ x, y, ch })),
    open: new Set(),
  };
  const doorAt = new Map(level.doors.map(([x, y, ch], i) => [`${x},${y}`, { ch, i }]));
  const canon = (s) =>
    `${s.px},${s.py}|${s.carried ?? '-'}|` +
    s.keys.map((k) => `${k.x},${k.y},${k.ch}`).sort().join(';') + '|' +
    [...s.open].sort().join(',');

  const seen = new Set([canon(start)]);
  let frontier = [start];
  for (let depth = 1; depth <= depthCap; depth++) {
    const next = [];
    for (const s of frontier) {
      for (const [dx, dy] of DIRS) {
        const nx = s.px + dx, ny = s.py + dy;
        if (isWall(grid, nx, ny)) continue;
        const door = doorAt.get(`${nx},${ny}`);
        let ns = null;
        if (door && !s.open.has(door.i)) {
          if (s.carried !== door.ch) continue;     // wrong/no key: bump
          ns = {
            px: nx, py: ny, carried: null,
            keys: s.keys, open: new Set([...s.open, door.i]),
          };
        } else {
          const ki = s.keys.findIndex((k) => k.x === nx && k.y === ny);
          if (ki >= 0) {
            const keys = s.keys.slice();
            if (s.carried === null) {
              ns = { px: nx, py: ny, carried: keys[ki].ch, keys: keys.filter((_, i) => i !== ki), open: s.open };
            } else {
              const picked = keys[ki].ch;
              keys[ki] = { x: nx, y: ny, ch: s.carried };   // swap in place
              ns = { px: nx, py: ny, carried: picked, keys, open: s.open };
            }
          } else {
            ns = { px: nx, py: ny, carried: s.carried, keys: s.keys, open: s.open };
          }
        }
        if (ns.px === friend[0] && ns.py === friend[1]) return depth;
        const k = canon(ns);
        if (seen.has(k)) continue;
        seen.add(k);
        next.push(ns);
        if (seen.size > stateCap) return -1;
      }
    }
    if (next.length === 0) return -1;
    frontier = next;
  }
  return -1;
}

const results = LEVELS.map((lvl, i) => {
  const t0 = Date.now();
  const steps = solve(lvl);
  return {
    level: i + 1,
    steps,
    ms: (Date.now() - t0) + 'ms',
    grid: `${lvl.grid[0].length}x${lvl.grid.length}`,
    keys: lvl.keys.length,
    doors: lvl.doors.length,
  };
});
console.table(results);
const bad = results.filter((r) => r.steps < 0);
if (bad.length) {
  console.error('UNSOLVABLE LEVELS:', bad.map((r) => r.level));
  process.exit(1);
}
console.log('all solvable');
