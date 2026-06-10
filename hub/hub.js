import { games } from './games.js';
import { readCompletions } from '../shared/meta.js';
import { petSVG, petStage, stickersEarned } from './pet.js';

const grid = document.getElementById('tile-grid');
const shell = document.getElementById('game-shell');
const frame = document.getElementById('game-frame');
const backBtn = document.getElementById('back-btn');
const petBtn = document.getElementById('pet-btn');
const stickerScreen = document.getElementById('sticker-screen');
const stickerPet = document.getElementById('sticker-pet');
const stickerGrid = document.getElementById('sticker-grid');
const stickerClose = document.getElementById('sticker-close');

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
  refreshPet();
}

backBtn.addEventListener('click', () => closeGame());

// --- Pet + sticker book -----------------------------------------------------
function refreshPet() {
  const { total } = readCompletions();
  petBtn.innerHTML = petSVG(petStage(total));
}

function openStickerBook() {
  const { total } = readCompletions();
  stickerPet.innerHTML = petSVG(petStage(total));
  stickerGrid.innerHTML = '';
  for (const emoji of stickersEarned(total)) {
    const s = document.createElement('span');
    s.className = 'sticker';
    s.textContent = emoji;
    stickerGrid.appendChild(s);
  }
  stickerScreen.hidden = false;
}

petBtn.addEventListener('click', () => {
  petBtn.classList.remove('bounce');
  void petBtn.offsetWidth;       // restart the animation on repeat taps
  petBtn.classList.add('bounce');
  openStickerBook();
});
stickerClose.addEventListener('click', () => { stickerScreen.hidden = true; });
stickerScreen.addEventListener('click', (e) => {
  if (e.target === stickerScreen) stickerScreen.hidden = true;
});

// Games write completions from their iframes; 'storage' fires here for
// writes from other browsing contexts, and the focus/visibility hooks
// cover anything that slips through.
window.addEventListener('storage', refreshPet);
window.addEventListener('focus', refreshPet);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshPet();
});

window.addEventListener('popstate', () => {
  // user hit hardware/browser back
  if (isOpen) closeGame({ fromPop: true });
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isOpen) closeGame();
});

renderTiles();
refreshPet();

// Register service worker. Relative path keeps subpath flexible.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .catch((err) => console.warn('SW registration failed:', err));
  });
}
