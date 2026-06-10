// Hand-authored levels. Static grid uses:
//   '#' wall
//   '.' floor
// Entities are layered on top:
//   animals: [[x, y, kind], ...]  kind in {sheep, pig, frog, chick}
//   pens:    [[x, y, kind], ...]  a pen locks a matching animal on entry
//
// A tilt slides EVERY free animal until it hits a wall, another animal,
// or its own pen (which captures it). Captured animals never move again
// and block like walls — parking a friend is how you make mid-board stops.
//
// Authoring rules:
//  - Pens sit on floor cells; animals never start on a pen.
//  - Same-kind animals are interchangeable (any sheep fits any sheep pen).
//  - Every level must be solvable; verify with tools/check-herd-home.mjs.

export const LEVELS = [
  // L1: one tilt to the wall. Teaches: everything slides until it stops.
  {
    grid: [
      '#######',
      '#.....#',
      '#.....#',
      '#.....#',
      '#######',
    ],
    animals: [[1, 2, 'sheep']],
    pens: [[5, 2, 'sheep']],
  },

  // L2: pen mid-row. Teaches: your own pen catches you as you slide past.
  {
    grid: [
      '#######',
      '#.....#',
      '#.....#',
      '#.....#',
      '#######',
    ],
    animals: [[1, 2, 'sheep']],
    pens: [[3, 2, 'sheep']],
  },

  // L3: two tilts around a corner.
  {
    grid: [
      '#######',
      '#.....#',
      '#.....#',
      '#.....#',
      '#######',
    ],
    animals: [[1, 1, 'sheep']],
    pens: [[5, 3, 'sheep']],
  },

  // L4: two animals, one tilt, double capture — each pen catches its own.
  {
    grid: [
      '#######',
      '#.....#',
      '#.....#',
      '#.....#',
      '#######',
    ],
    animals: [
      [1, 2, 'sheep'],
      [2, 2, 'pig'],
    ],
    pens: [
      [3, 2, 'sheep'],
      [5, 2, 'pig'],
    ],
  },

  // L5: friend-as-wall. The frog parks against the right wall; the pig
  // stops against the frog, lining both up over their pens below.
  {
    grid: [
      '#######',
      '#.....#',
      '#.....#',
      '#.....#',
      '#.....#',
      '#######',
    ],
    animals: [
      [1, 1, 'pig'],
      [5, 1, 'frog'],
    ],
    pens: [
      [4, 4, 'pig'],
      [5, 4, 'frog'],
    ],
  },

  // L6: interior walls make mid-board stops for a lone sheep.
  {
    grid: [
      '########',
      '#....#.#',
      '#......#',
      '#..#...#',
      '#......#',
      '########',
    ],
    animals: [[1, 4, 'sheep']],
    pens: [[4, 2, 'sheep']],
  },

  // L7: two identical sheep, two pens — either sheep fits either pen,
  // but one capture walls off the other's path.
  {
    grid: [
      '#######',
      '#.....#',
      '#.....#',
      '#.....#',
      '#.....#',
      '#######',
    ],
    animals: [
      [1, 2, 'sheep'],
      [5, 2, 'sheep'],
    ],
    pens: [
      [3, 2, 'sheep'],
      [3, 4, 'sheep'],
    ],
  },

  // L8: captured friends block. The sheep locks first and walls off the
  // column, so the pig has to go the long way around.
  {
    grid: [
      '#######',
      '#.....#',
      '#.....#',
      '#.....#',
      '#.....#',
      '#######',
    ],
    animals: [
      [3, 1, 'pig'],
      [3, 2, 'sheep'],
    ],
    pens: [
      [3, 4, 'pig'],
      [3, 3, 'sheep'],
    ],
  },

  // L9: three animals start stacked on the left; every pen is on the far
  // wall but offset one row from where each animal lands.
  {
    grid: [
      '########',
      '#......#',
      '#......#',
      '#......#',
      '#......#',
      '########',
    ],
    animals: [
      [1, 1, 'pig'],
      [1, 2, 'frog'],
      [1, 3, 'chick'],
    ],
    pens: [
      [6, 1, 'chick'],
      [6, 2, 'pig'],
      [6, 3, 'frog'],
    ],
  },

  // L10: the L6 board with a second animal — both funnel through the same
  // wall shadow at (4,1), so the descents must be sequenced (pig's pen is
  // the deeper one; sheep capturing first would block it).
  {
    grid: [
      '########',
      '#....#.#',
      '#......#',
      '#..#...#',
      '#......#',
      '########',
    ],
    animals: [
      [1, 4, 'sheep'],
      [6, 4, 'pig'],
    ],
    pens: [
      [4, 2, 'sheep'],
      [4, 3, 'pig'],
    ],
  },

  // L11: all four kinds, two notch walls, pens mid-board.
  {
    grid: [
      '########',
      '#......#',
      '#...#..#',
      '#......#',
      '#..#...#',
      '#......#',
      '########',
    ],
    animals: [
      [1, 1, 'sheep'],
      [6, 1, 'pig'],
      [1, 5, 'frog'],
      [6, 5, 'chick'],
    ],
    pens: [
      [5, 3, 'sheep'],
      [2, 3, 'pig'],
      [4, 5, 'frog'],
      [3, 1, 'chick'],
    ],
  },

  // L12: finale — two pairs from the corners, pens lined along the top
  // fence plus one stray; found by search, optimal solution is 9 tilts.
  {
    grid: [
      '########',
      '#......#',
      '#..#...#',
      '#......#',
      '#...#..#',
      '#......#',
      '########',
    ],
    animals: [
      [1, 1, 'sheep'],
      [6, 5, 'sheep'],
      [6, 1, 'chick'],
      [1, 5, 'chick'],
    ],
    pens: [
      [2, 1, 'sheep'],
      [3, 1, 'sheep'],
      [4, 1, 'chick'],
      [5, 3, 'chick'],
    ],
  },
];
