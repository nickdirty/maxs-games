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
  {
    id: 'letter-push',
    name: 'Letter Push',
    path: './games/letter-push/index.html',
    iconBg: '#e6efff',
    iconHTML: `
      <svg viewBox="0 0 88 88" width="80" height="80" aria-hidden="true">
        <rect x="6"  y="22" width="32" height="44" rx="6" fill="#4682e6"/>
        <text x="22" y="56" text-anchor="middle"
              font-family="system-ui, sans-serif" font-size="32" font-weight="800" fill="#fff">b</text>
        <path d="M 42 44 L 58 44 M 52 38 L 58 44 L 52 50"
              stroke="#5a4078" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="50" y="22" width="32" height="44" rx="6" fill="#4682e6"/>
        <text x="66" y="56" text-anchor="middle"
              font-family="system-ui, sans-serif" font-size="32" font-weight="800" fill="#fff">d</text>
      </svg>
    `,
  },
];
