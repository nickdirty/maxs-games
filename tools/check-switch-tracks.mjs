// Validate switch-tracks levels: graph structure, planarity-ish margins,
// per-kind station/queue counts, and reachability of every station from
// the start. Run: `node tools/check-switch-tracks.mjs`.

import { LEVELS } from '../games/switch-tracks/levels.js';

const errors = [];
const results = LEVELS.map((lvl, i) => {
  const n = i + 1;
  const err = (msg) => errors.push(`L${n}: ${msg}`);

  const [w, h] = lvl.size;
  for (const [id, [x, y]] of Object.entries(lvl.nodes)) {
    if (x < 1 || x > w - 2 || y < 1 || y > h - 2) err(`node ${id} too close to canvas edge`);
  }

  const out = {};
  for (const e of lvl.edges) {
    (out[e.from] ??= []).push(e);
    if (!lvl.nodes[e.from]) err(`edge from unknown node ${e.from}`);
    if (!lvl.nodes[e.to]) err(`edge to unknown node ${e.to}`);
    const [fx, fy] = lvl.nodes[e.from] ?? [NaN, NaN];
    const [tx, ty] = lvl.nodes[e.to] ?? [NaN, NaN];
    const first = e.pts[0], last = e.pts[e.pts.length - 1];
    if (first[0] !== fx || first[1] !== fy) err(`edge ${e.from}->${e.to} pts don't start at from-node`);
    if (last[0] !== tx || last[1] !== ty) err(`edge ${e.from}->${e.to} pts don't end at to-node`);
    for (let k = 1; k < e.pts.length; k++) {
      const [ax, ay] = e.pts[k - 1], [bx, by] = e.pts[k];
      if (ax !== bx && ay !== by) err(`edge ${e.from}->${e.to} has a diagonal segment`);
    }
  }

  // every path from start must terminate at a station; stations terminal
  const reachable = new Set([lvl.start]);
  const stack = [lvl.start];
  let cycles = false;
  while (stack.length) {
    const cur = stack.pop();
    for (const e of out[cur] ?? []) {
      if (e.to === lvl.start) cycles = true;
      if (!reachable.has(e.to)) { reachable.add(e.to); stack.push(e.to); }
    }
  }
  for (const id of Object.keys(lvl.nodes)) {
    if (!reachable.has(id)) err(`node ${id} unreachable from start`);
    const isTerminal = !(out[id]?.length);
    const isStation = id in lvl.stations;
    if (isTerminal && id !== lvl.start && !isStation) err(`terminal node ${id} is not a station`);
    if (isStation && !isTerminal) err(`station ${id} has outgoing edges`);
  }
  if (cycles) err('cycle back to start');

  // kind counts: queue must exactly fill stations
  const stationCounts = {};
  for (const k of Object.values(lvl.stations)) stationCounts[k] = (stationCounts[k] ?? 0) + 1;
  const queueCounts = {};
  for (const k of lvl.queue) queueCounts[k] = (queueCounts[k] ?? 0) + 1;
  for (const k of new Set([...Object.keys(stationCounts), ...Object.keys(queueCounts)])) {
    if ((stationCounts[k] ?? 0) !== (queueCounts[k] ?? 0)) {
      err(`kind ${k}: ${queueCounts[k] ?? 0} queued vs ${stationCounts[k] ?? 0} stations`);
    }
  }

  const switches = Object.values(out).filter((o) => o.length > 1).length;
  return {
    level: n,
    size: `${w}x${h}`,
    switches,
    stations: Object.keys(lvl.stations).length,
    queue: lvl.queue.length,
  };
});

console.table(results);
if (errors.length) {
  for (const e of errors) console.error(e);
  process.exit(1);
}
console.log('all valid');
