// Levels are authored as SOLUTIONS: a full partition of the grid into
// snake paths, one letter per kind. The game derives the puzzle (the two
// endpoints of each path); the rest of the path is never shown. This
// guarantees solvability and full coverage by construction; uniqueness is
// verified by tools/check-pair-paths.mjs (generated via search, every
// level has exactly one solution).
//
// Region rules (enforced by parse): each kind forms ONE simple path that
// never touches itself, length >= 3.

const KIND_OF = {
  p: 'pig', s: 'sheep', c: 'chick', f: 'frog', b: 'bunny', d: 'duck',
};

const GRIDS = [
  // L1: two straight lanes.
  [
    'pppp',
    'psss',
    'pppp',
  ],

  // L2: pig wraps around the sheep.
  [
    'pppp',
    'pssp',
    'ppsp',
  ],

  // L3: three lanes, one bend each.
  [
    'ppps',
    'pcps',
    'pcps',
    'pcpp',
  ],

  // L4: the pig hooks under the chick.
  [
    'pppc',
    'pccc',
    'pppp',
    'sssp',
  ],

  // L5: first 5-wide board.
  [
    'ppspp',
    'psspc',
    'psppc',
    'pppcc',
  ],

  // L6: diagonal-feeling weave.
  [
    'ccppp',
    'cppsp',
    'ppssp',
    'psspp',
  ],

  // L7: four kinds on 5x5.
  [
    'cssss',
    'cspff',
    'csppf',
    'csspf',
    'ccspp',
  ],

  // L8: pig owns the border, others thread inside.
  [
    'ppppp',
    'pfffp',
    'ppsss',
    'cppps',
    'cccpp',
  ],

  // L9: 6-wide; chick splits the pig's territory.
  [
    'pcpppp',
    'pcpfff',
    'pcpppp',
    'pssssp',
    'pppppp',
  ],

  // L10: frog corner, long pig sweep.
  [
    'ffpppp',
    'fppssp',
    'fpsspp',
    'pssppc',
    'ppppcc',
  ],

  // L11: six kinds on 6x6 — bunny and duck join in.
  [
    'fccccc',
    'fcbbbc',
    'fcbpdd',
    'fsbpdp',
    'fsbpdp',
    'ssbppp',
  ],

  // L12: finale, 7x6 with all six kinds.
  [
    'cccssss',
    'cbbfffs',
    'ccbfpps',
    'pcpppss',
    'pcpsssd',
    'pppdddd',
  ],
];

// Turn a letter grid into { size, paths: [{kind, cells: ordered [x,y]}] }.
// Throws on malformed regions so a bad edit fails loudly at load.
function parse(rows) {
  const h = rows.length, w = rows[0].length;
  const byChar = new Map();
  for (let y = 0; y < h; y++) {
    if (rows[y].length !== w) throw new Error('ragged level rows');
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (!KIND_OF[ch]) throw new Error(`unknown kind char '${ch}'`);
      if (!byChar.has(ch)) byChar.set(ch, []);
      byChar.get(ch).push([x, y]);
    }
  }
  const paths = [];
  for (const [ch, cells] of byChar) {
    const set = new Set(cells.map(([x, y]) => `${x},${y}`));
    const deg = (x, y) =>
      [[0, -1], [0, 1], [-1, 0], [1, 0]]
        .filter(([dx, dy]) => set.has(`${x + dx},${y + dy}`)).length;
    const ends = cells.filter(([x, y]) => deg(x, y) === 1);
    if (cells.length < 3 || ends.length !== 2 || !cells.every(([x, y]) => deg(x, y) <= 2)) {
      throw new Error(`region '${ch}' is not a simple path`);
    }
    // walk from one end to order the cells
    const ordered = [ends[0]];
    const seen = new Set([`${ends[0][0]},${ends[0][1]}`]);
    while (ordered.length < cells.length) {
      const [cx, cy] = ordered[ordered.length - 1];
      const next = [[0, -1], [0, 1], [-1, 0], [1, 0]]
        .map(([dx, dy]) => [cx + dx, cy + dy])
        .find(([nx, ny]) => set.has(`${nx},${ny}`) && !seen.has(`${nx},${ny}`));
      if (!next) throw new Error(`region '${ch}' walk got stuck`);
      seen.add(`${next[0]},${next[1]}`);
      ordered.push(next);
    }
    paths.push({ kind: KIND_OF[ch], cells: ordered });
  }
  return { size: [w, h], paths };
}

export const LEVELS = GRIDS.map(parse);
