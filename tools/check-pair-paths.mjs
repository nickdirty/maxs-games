// Verify each pair-paths level: regions parse as simple paths (levels.js
// throws otherwise) and the endpoint set has EXACTLY ONE full-coverage
// solution. Run: `node tools/check-pair-paths.mjs`.

import { LEVELS } from '../games/pair-paths/levels.js';

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

function countSolutions(level, cap = 2, budget = 5_000_000) {
  const [w, h] = level.size;
  const key = (x, y) => y * w + x;
  const inb = (x, y) => x >= 0 && x < w && y >= 0 && y < h;
  const pairs = level.paths.map((p) => ({
    a: p.cells[0],
    b: p.cells[p.cells.length - 1],
  }));
  const occ = new Array(w * h).fill(-1);
  const endpointAt = new Array(w * h).fill(-1);
  pairs.forEach((p, i) => {
    occ[key(...p.a)] = i; occ[key(...p.b)] = i;
    endpointAt[key(...p.b)] = i;
  });
  let solutions = 0;
  let nodes = 0;

  // every empty cell needs an escape: an empty neighbor, the active head,
  // or an endpoint of a not-yet-routed pair
  function emptyOk(headKey, nextPair) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = key(x, y);
      if (occ[k] >= 0) continue;
      let ok = false;
      for (const [dx, dy] of DIRS) {
        const ax = x + dx, ay = y + dy;
        if (!inb(ax, ay)) continue;
        const ak = key(ax, ay);
        if (occ[ak] < 0 || ak === headKey || endpointAt[ak] >= nextPair) { ok = true; break; }
      }
      if (!ok) return false;
    }
    return true;
  }

  function route(pairIdx, cx, cy) {
    if (solutions >= cap || nodes++ > budget) return;
    const target = pairs[pairIdx].b;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (!inb(nx, ny)) continue;
      const k = key(nx, ny);
      if (nx === target[0] && ny === target[1]) {
        if (pairIdx + 1 === pairs.length) {
          if (!occ.some((o) => o < 0)) solutions++;
        } else if (emptyOk(-1, pairIdx + 1)) {
          const np = pairs[pairIdx + 1];
          route(pairIdx + 1, np.a[0], np.a[1]);
        }
        if (solutions >= cap) return;
        continue;
      }
      if (occ[k] >= 0) continue;
      occ[k] = pairIdx;
      if (emptyOk(k, pairIdx + 1)) route(pairIdx, nx, ny);
      occ[k] = -1;
      if (solutions >= cap) return;
    }
  }

  route(0, ...pairs[0].a);
  if (nodes > budget) return -1;
  return solutions;
}

const results = LEVELS.map((lvl, i) => {
  const t0 = Date.now();
  const n = countSolutions(lvl);
  return {
    level: i + 1,
    size: `${lvl.size[0]}x${lvl.size[1]}`,
    pairs: lvl.paths.length,
    solutions: n,
    ms: (Date.now() - t0) + 'ms',
  };
});
console.table(results);
const bad = results.filter((r) => r.solutions !== 1);
if (bad.length) {
  console.error('NON-UNIQUE OR UNSOLVED LEVELS:', bad.map((r) => r.level));
  process.exit(1);
}
console.log('all unique');
