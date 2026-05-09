// Game registry. Adding a new game = drop a folder under /games/<id>/
// with its own index.html, then add an entry below.
//
// Fields:
//   id       — unique slug, used for localStorage namespacing if the game persists state
//   name     — label under the tile
//   path     — relative to the hub's index.html
//   iconBg   — background color for the tile icon square
//   iconHTML — inline SVG (or any HTML) shown inside the icon square; ~88x88

export const games = [
  {
    id: 'ball-sort',
    name: 'Ball Sort',
    path: './games/ball-sort/index.html',
    iconBg: '#fff8e0',
    iconHTML: `
      <svg viewBox="0 0 88 88" width="80" height="80" aria-hidden="true">
        <circle cx="22" cy="50" r="14" fill="#e84c4c"/>
        <circle cx="44" cy="38" r="14" fill="#f0c83c"/>
        <circle cx="66" cy="50" r="14" fill="#4682e6"/>
      </svg>
    `,
  },
];
