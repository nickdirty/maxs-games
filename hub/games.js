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
        <text x="44" y="53" text-anchor="middle"
              font-family="system-ui, sans-serif" font-size="26" font-weight="800" fill="#5a4078">↻</text>
        <rect x="50" y="22" width="32" height="44" rx="6" fill="#4682e6"/>
        <text x="66" y="56" text-anchor="middle"
              font-family="system-ui, sans-serif" font-size="32" font-weight="800" fill="#fff">q</text>
      </svg>
    `,
  },
  {
    id: 'herd-home',
    name: 'Herd Home',
    path: './games/herd-home/index.html',
    iconBg: '#e4f4e6',
    iconHTML: `
      <svg viewBox="0 0 88 88" width="80" height="80" aria-hidden="true">
        <circle cx="22" cy="42" r="9" fill="#efe9d8"/>
        <circle cx="32" cy="38" r="9" fill="#efe9d8"/>
        <circle cx="30" cy="48" r="9" fill="#efe9d8"/>
        <ellipse cx="38" cy="36" rx="6" ry="7" fill="#5a5048"/>
        <path d="M 46 44 L 56 44 M 51 39 L 56 44 L 51 49"
              stroke="#58a86c" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="58" y="30" width="26" height="26" rx="8" fill="none"
              stroke="#58a86c" stroke-width="3" stroke-dasharray="6 5"/>
      </svg>
    `,
  },
  {
    id: 'switch-tracks',
    name: 'Switch Tracks',
    path: './games/switch-tracks/index.html',
    iconBg: '#fdf1dd',
    iconHTML: `
      <svg viewBox="0 0 88 88" width="80" height="80" aria-hidden="true">
        <path d="M 8 44 L 36 44 M 36 44 L 56 24 L 78 24 M 36 44 L 56 64 L 78 64"
              stroke="#46536b" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 8 44 L 36 44 M 36 44 L 56 24 L 78 24 M 36 44 L 56 64 L 78 64"
              stroke="#8fa3c8" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="36" cy="44" r="13" fill="#e8a33c"/>
        <path d="M 30 44 L 40 44 M 36 40 L 41 44 L 36 48"
              stroke="#5a3c10" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
  },
  {
    id: 'pair-paths',
    name: 'Pair Paths',
    path: './games/pair-paths/index.html',
    iconBg: '#e7f6ee',
    iconHTML: `
      <svg viewBox="0 0 88 88" width="80" height="80" aria-hidden="true">
        <path d="M 18 22 L 56 22 L 56 44 L 30 44 L 30 66 L 70 66"
              stroke="#f2a0b5" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
        <circle cx="18" cy="22" r="13" fill="#f2a0b5"/>
        <circle cx="13.5" cy="20" r="2" fill="#3a2530"/>
        <circle cx="22.5" cy="20" r="2" fill="#3a2530"/>
        <ellipse cx="18" cy="25" rx="5" ry="3.8" fill="#e8849e"/>
        <circle cx="70" cy="66" r="9" fill="#f2a0b5"/>
        <circle cx="67" cy="64.5" r="1.5" fill="#3a2530"/>
        <circle cx="73" cy="64.5" r="1.5" fill="#3a2530"/>
        <ellipse cx="70" cy="68" rx="3.6" ry="2.8" fill="#e8849e"/>
      </svg>
    `,
  },
  {
    id: 'key-maze',
    name: 'Key Maze',
    path: './games/key-maze/index.html',
    iconBg: '#f0eaf8',
    iconHTML: `
      <svg viewBox="0 0 88 88" width="80" height="80" aria-hidden="true">
        <rect x="10" y="26" width="34" height="34" rx="9" fill="#e8c44d"/>
        <text x="27" y="51" text-anchor="middle"
              font-family="system-ui, sans-serif" font-size="24" font-weight="800" fill="#3a2c18">b</text>
        <rect x="52" y="20" width="28" height="46" rx="8" fill="#6a4a32"/>
        <circle cx="66" cy="42" r="10" fill="#f4eee2"/>
        <text x="66" y="48" text-anchor="middle"
              font-family="system-ui, sans-serif" font-size="17" font-weight="800" fill="#3a2c18">b</text>
      </svg>
    `,
  },
];
