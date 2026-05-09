import { games } from './games.js';

const grid = document.getElementById('tile-grid');
const shell = document.getElementById('game-shell');
const frame = document.getElementById('game-frame');
const backBtn = document.getElementById('back-btn');

function renderTiles() {
  grid.innerHTML = '';
  for (const g of games) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile';
    tile.innerHTML = `
      <span class="tile-icon" style="background:${g.iconBg ?? '#eef2ee'}">${g.iconHTML ?? ''}</span>
      <span class="tile-name">${g.name}</span>
    `;
    tile.addEventListener('click', () => openGame(g));
    grid.appendChild(tile);
  }
}

let isOpen = false;

function openGame(g) {
  if (isOpen) return;
  isOpen = true;
  frame.src = g.path;
  shell.hidden = false;
  // Push a history entry so Android's hardware back closes the game
  // instead of leaving the PWA.
  history.pushState({ play: g.id }, '', '#play');
}

function closeGame({ fromPop = false } = {}) {
  if (!isOpen) return;
  isOpen = false;
  shell.hidden = true;
  // about:blank tears down the iframe (frees memory + suspends AudioContext).
  frame.src = 'about:blank';
  if (!fromPop && location.hash === '#play') {
    history.back();
  }
}

backBtn.addEventListener('click', () => closeGame());

window.addEventListener('popstate', () => {
  // user hit hardware/browser back
  if (isOpen) closeGame({ fromPop: true });
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isOpen) closeGame();
});

renderTiles();

// Register service worker. Relative path keeps subpath flexible.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .catch((err) => console.warn('SW registration failed:', err));
  });
}
