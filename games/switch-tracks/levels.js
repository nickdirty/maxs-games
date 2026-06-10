// Hand-authored track layouts.
//   size:  [w, h] in track units (rendered at the board's unit scale)
//   nodes: id -> [x, y]
//   edges: directed, with an orthogonal waypoint polyline from node to node;
//          pts[0] must equal the from-node, last pts must equal the to-node
//   start: node id where animals appear
//   stations: terminal node id -> animal kind that lives there
//   queue: animals ride one at a time, in order; every station gets filled
//
// Any node with 2+ outgoing edges is a switch (initial selection: first
// edge). Authoring rules:
//  - Graphs are DAGs; every path from start ends at a station.
//  - Per kind, queue count must equal station count.
//  - Keep node coords >= 1 unit from the canvas edge.
//  - Verify with tools/check-switch-tracks.mjs.

export const LEVELS = [
  // L1: one switch, two barns. Teaches: tap the switch, then GO.
  {
    size: [11, 7],
    nodes: { s: [1, 3], j: [6, 3], a: [9, 1], b: [9, 5] },
    edges: [
      { from: 's', to: 'j', pts: [[1, 3], [6, 3]] },
      { from: 'j', to: 'a', pts: [[6, 3], [6, 1], [9, 1]] },
      { from: 'j', to: 'b', pts: [[6, 3], [6, 5], [9, 5]] },
    ],
    start: 's',
    stations: { a: 'chick', b: 'frog' },
    queue: ['chick', 'frog'],
  },

  // L2: vertical, and the switch starts pointing the WRONG way for the
  // first rider — look before you GO.
  {
    size: [11, 7],
    nodes: { s: [5, 1], j: [5, 3], a: [2, 5], b: [8, 5] },
    edges: [
      { from: 's', to: 'j', pts: [[5, 1], [5, 3]] },
      { from: 'j', to: 'a', pts: [[5, 3], [2, 3], [2, 5]] },
      { from: 'j', to: 'b', pts: [[5, 3], [8, 3], [8, 5]] },
    ],
    start: 's',
    stations: { a: 'pig', b: 'sheep' },
    queue: ['sheep', 'pig'],
  },

  // L3: two switches in series — the first one decides whether the
  // second one matters at all.
  {
    size: [12, 7],
    nodes: { s: [1, 5], j1: [4, 5], j2: [8, 5], a: [4, 1], b: [8, 1], c: [10, 5] },
    edges: [
      { from: 's', to: 'j1', pts: [[1, 5], [4, 5]] },
      { from: 'j1', to: 'a', pts: [[4, 5], [4, 1]] },
      { from: 'j1', to: 'j2', pts: [[4, 5], [8, 5]] },
      { from: 'j2', to: 'b', pts: [[8, 5], [8, 1]] },
      { from: 'j2', to: 'c', pts: [[8, 5], [10, 5]] },
    ],
    start: 's',
    stations: { a: 'frog', b: 'chick', c: 'sheep' },
    queue: ['chick', 'sheep', 'frog'],
  },

  // L4: a full tree — two switches deep, four barns.
  {
    size: [12, 9],
    nodes: {
      s: [1, 4], j1: [4, 4], j2: [7, 2], j3: [7, 6],
      a: [10, 1], b: [10, 3], c: [10, 5], d: [10, 7],
    },
    edges: [
      { from: 's', to: 'j1', pts: [[1, 4], [4, 4]] },
      { from: 'j1', to: 'j2', pts: [[4, 4], [4, 2], [7, 2]] },
      { from: 'j1', to: 'j3', pts: [[4, 4], [4, 6], [7, 6]] },
      { from: 'j2', to: 'a', pts: [[7, 2], [7, 1], [10, 1]] },
      { from: 'j2', to: 'b', pts: [[7, 2], [7, 3], [10, 3]] },
      { from: 'j3', to: 'c', pts: [[7, 6], [7, 5], [10, 5]] },
      { from: 'j3', to: 'd', pts: [[7, 6], [7, 7], [10, 7]] },
    ],
    start: 's',
    stations: { a: 'chick', b: 'pig', c: 'sheep', d: 'frog' },
    queue: ['pig', 'frog', 'chick', 'sheep'],
  },

  // L5: winding tracks — the long way around makes the branches harder
  // to trace by eye.
  {
    size: [12, 8],
    nodes: { s: [1, 6], j1: [4, 6], j2: [6, 2], a: [10, 2], b: [10, 4], c: [8, 6] },
    edges: [
      { from: 's', to: 'j1', pts: [[1, 6], [4, 6]] },
      { from: 'j1', to: 'j2', pts: [[4, 6], [4, 2], [6, 2]] },
      { from: 'j1', to: 'c', pts: [[4, 6], [8, 6]] },
      { from: 'j2', to: 'a', pts: [[6, 2], [10, 2]] },
      { from: 'j2', to: 'b', pts: [[6, 2], [6, 4], [10, 4]] },
    ],
    start: 's',
    stations: { a: 'sheep', b: 'pig', c: 'frog' },
    queue: ['pig', 'frog', 'sheep'],
  },

  // L6: three switches in a row along the middle, barns hanging off.
  {
    size: [12, 9],
    nodes: {
      s: [1, 4], j1: [3, 4], j2: [6, 4], j3: [9, 4],
      a: [5, 1], b: [8, 1], c: [10, 1], d: [9, 7],
    },
    edges: [
      { from: 's', to: 'j1', pts: [[1, 4], [3, 4]] },
      { from: 'j1', to: 'a', pts: [[3, 4], [3, 1], [5, 1]] },
      { from: 'j1', to: 'j2', pts: [[3, 4], [6, 4]] },
      { from: 'j2', to: 'b', pts: [[6, 4], [6, 1], [8, 1]] },
      { from: 'j2', to: 'j3', pts: [[6, 4], [9, 4]] },
      { from: 'j3', to: 'c', pts: [[9, 4], [9, 1], [10, 1]] },
      { from: 'j3', to: 'd', pts: [[9, 4], [9, 7]] },
    ],
    start: 's',
    stations: { a: 'frog', b: 'chick', c: 'sheep', d: 'pig' },
    queue: ['sheep', 'pig', 'frog', 'chick'],
  },

  // L7: two chick barns — twins can live in either one.
  {
    size: [12, 9],
    nodes: {
      s: [10, 4], j1: [7, 4], j2: [4, 2], j3: [4, 6],
      a: [1, 1], b: [1, 3], c: [1, 5], d: [1, 7],
    },
    edges: [
      { from: 's', to: 'j1', pts: [[10, 4], [7, 4]] },
      { from: 'j1', to: 'j2', pts: [[7, 4], [7, 2], [4, 2]] },
      { from: 'j1', to: 'j3', pts: [[7, 4], [7, 6], [4, 6]] },
      { from: 'j2', to: 'a', pts: [[4, 2], [4, 1], [1, 1]] },
      { from: 'j2', to: 'b', pts: [[4, 2], [4, 3], [1, 3]] },
      { from: 'j3', to: 'c', pts: [[4, 6], [4, 5], [1, 5]] },
      { from: 'j3', to: 'd', pts: [[4, 6], [4, 7], [1, 7]] },
    ],
    start: 's',
    stations: { a: 'chick', b: 'pig', c: 'frog', d: 'chick' },
    queue: ['chick', 'frog', 'chick', 'pig'],
  },

  // L8: five barns, uneven depth, two pig barns.
  {
    size: [13, 10],
    nodes: {
      s: [1, 4], j1: [4, 4], j2: [7, 2], j3: [7, 6], j4: [10, 6],
      a: [9, 1], b: [10, 3], c: [7, 8], d: [11, 4], e: [11, 8],
    },
    edges: [
      { from: 's', to: 'j1', pts: [[1, 4], [4, 4]] },
      { from: 'j1', to: 'j2', pts: [[4, 4], [4, 2], [7, 2]] },
      { from: 'j1', to: 'j3', pts: [[4, 4], [4, 6], [7, 6]] },
      { from: 'j2', to: 'a', pts: [[7, 2], [7, 1], [9, 1]] },
      { from: 'j2', to: 'b', pts: [[7, 2], [7, 3], [10, 3]] },
      { from: 'j3', to: 'c', pts: [[7, 6], [7, 8]] },
      { from: 'j3', to: 'j4', pts: [[7, 6], [10, 6]] },
      { from: 'j4', to: 'd', pts: [[10, 6], [10, 4], [11, 4]] },
      { from: 'j4', to: 'e', pts: [[10, 6], [10, 8], [11, 8]] },
    ],
    start: 's',
    stations: { a: 'sheep', b: 'pig', c: 'frog', d: 'chick', e: 'pig' },
    queue: ['pig', 'chick', 'pig', 'sheep', 'frog'],
  },

  // L9: a tall layout — riders drop from the top through two tiers.
  {
    size: [11, 10],
    nodes: {
      s: [5, 1], j1: [5, 3], j2: [2, 5], j3: [8, 5],
      a: [1, 7], b: [4, 8], c: [9, 7], d: [6, 8],
    },
    edges: [
      { from: 's', to: 'j1', pts: [[5, 1], [5, 3]] },
      { from: 'j1', to: 'j2', pts: [[5, 3], [2, 3], [2, 5]] },
      { from: 'j1', to: 'j3', pts: [[5, 3], [8, 3], [8, 5]] },
      { from: 'j2', to: 'a', pts: [[2, 5], [1, 5], [1, 7]] },
      { from: 'j2', to: 'b', pts: [[2, 5], [2, 8], [4, 8]] },
      { from: 'j3', to: 'c', pts: [[8, 5], [9, 5], [9, 7]] },
      { from: 'j3', to: 'd', pts: [[8, 5], [8, 8], [6, 8]] },
    ],
    start: 's',
    stations: { a: 'pig', b: 'sheep', c: 'chick', d: 'frog' },
    queue: ['frog', 'sheep', 'chick', 'pig'],
  },

  // L10: finale — six barns, three tiers of switches, twin chicks and pigs.
  {
    size: [12, 11],
    nodes: {
      s: [1, 5], j1: [3, 5], j2: [5, 2], j3: [5, 8], j4: [8, 3], j5: [8, 7],
      a: [7, 1], b: [10, 2], c: [10, 4], d: [7, 9], e: [10, 6], f: [10, 8],
    },
    edges: [
      { from: 's', to: 'j1', pts: [[1, 5], [3, 5]] },
      { from: 'j1', to: 'j2', pts: [[3, 5], [3, 2], [5, 2]] },
      { from: 'j1', to: 'j3', pts: [[3, 5], [3, 8], [5, 8]] },
      { from: 'j2', to: 'a', pts: [[5, 2], [5, 1], [7, 1]] },
      { from: 'j2', to: 'j4', pts: [[5, 2], [5, 3], [8, 3]] },
      { from: 'j4', to: 'b', pts: [[8, 3], [8, 2], [10, 2]] },
      { from: 'j4', to: 'c', pts: [[8, 3], [8, 4], [10, 4]] },
      { from: 'j3', to: 'd', pts: [[5, 8], [5, 9], [7, 9]] },
      { from: 'j3', to: 'j5', pts: [[5, 8], [5, 7], [8, 7]] },
      { from: 'j5', to: 'e', pts: [[8, 7], [8, 6], [10, 6]] },
      { from: 'j5', to: 'f', pts: [[8, 7], [8, 8], [10, 8]] },
    ],
    start: 's',
    stations: { a: 'chick', b: 'sheep', c: 'pig', d: 'frog', e: 'pig', f: 'chick' },
    queue: ['pig', 'chick', 'frog', 'sheep', 'chick', 'pig'],
  },
];
