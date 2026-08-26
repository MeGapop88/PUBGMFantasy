/**
 * MAIN ENTRY POINT
 * Wires router, auth, data loading, and all pages together.
 * Designed after Stitch project "Ignite Tournament Interface"
 */
import { Router } from './router.js';
import { loadAllMatches } from './data/loader.js';
import { getSession, logout } from './state.js';
import { showPageLoader, toast } from './ui.js';

import { renderLogin }       from './pages/login.js';
import { renderDashboard }   from './pages/dashboard.js';
import { renderPredictions } from './pages/predictions.js';
import { renderFantasy }     from './pages/fantasy.js';
import { renderLeaderboard } from './pages/leaderboard.js';
import { renderPlayers }     from './pages/players.js';

// App state store
let store = { matches: [], players: {}, teams: {}, loadedCount: 0, totalCount: 36 };
let dataLoaded = false;

// Router setup
const router = new Router();

// Auth guard helper
function guard(fn) {
  return (params) => {
    if (!getSession()) { router.navigate('/login'); return; }
    fn(params);
  };
}

// Async page wrapper that waits for match data
async function withData(fn, params) {
  if (!dataLoaded) {
    showPageLoader(`LOADING TELEMETRY DATA (${store.loadedCount}/${store.totalCount})...`);
    await waitForData();
  }
  fn(params);
}

function waitForData() {
  return new Promise(resolve => {
    const check = setInterval(() => {
      if (dataLoaded) { clearInterval(check); resolve(); }
    }, 100);
  });
}

router
  .on('/login',       (p) => renderLogin(router))
  .on('/dashboard',   guard((p) => withData(() => renderDashboard(store), p)))
  .on('/predictions', guard((p) => withData(() => renderPredictions(store, router), p)))
  .on('/fantasy',     guard((p) => withData(() => renderFantasy(store, router), p)))
  .on('/leaderboard', guard((p) => withData(() => renderLeaderboard(store, router), p)))
  .on('/players',     guard((p) => withData(() => renderPlayers(store, router, {}), p)))
  .on('/player/:uid', guard((p) => withData(() => renderPlayers(store, router, p), p)));

// Nav and Sidebar UI Setup
function setupNav() {
  const session = getSession();
  const navbar  = document.getElementById('navbar');
  const sidebar = document.getElementById('sidebar');
  const userEl  = document.getElementById('user-display');
  const sidebarUser = document.getElementById('sidebar-user-name');

  if (session) {
    if (navbar) navbar.classList.remove('hidden');
    if (sidebar) sidebar.classList.remove('hidden');
    if (userEl) userEl.textContent = session.username.toUpperCase();
    if (sidebarUser) sidebarUser.textContent = session.username.toUpperCase();
  } else {
    if (navbar) navbar.classList.add('hidden');
    if (sidebar) sidebar.classList.add('hidden');
  }

  // Logout actions
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      logout();
      if (navbar) navbar.classList.add('hidden');
      if (sidebar) sidebar.classList.add('hidden');
      router.navigate('/login');
    };
  }

  // Mobile drawer hamburger
  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.onclick = () => {
      mobileMenu.classList.toggle('hidden');
    };
  }

  document.querySelectorAll('.nav-mobile-link').forEach(link => {
    link.onclick = () => {
      if (mobileMenu) mobileMenu.classList.add('hidden');
    };
  });
}

// Active link highlighting
window.addEventListener('hashchange', () => {
  setupNav();
});

// Load match dataset
async function loadData() {
  try {
    const result = await loadAllMatches((loaded, total) => {
      store.loadedCount = loaded;
      const loaderText = document.querySelector('.page-loader .label-caps');
      if (loaderText) loaderText.textContent = `LOADING TELEMETRY DATA (${loaded}/${total})...`;
    });

    store = result;
    dataLoaded = true;

    if (result.loadedCount === 0) {
      toast('No telemetry JSON found. Place files in public/data/', 'warning', 6000);
    } else {
      console.log(`✅ Telemetry loaded: ${result.loadedCount}/${result.totalCount} matches, ${Object.keys(result.players).length} players`);
    }
  } catch (err) {
    console.error('Data load error:', err);
    dataLoaded = true;
    toast('Error loading telemetry data', 'error');
  }
}

async function boot() {
  setupNav();
  loadData();
  router.start();
}

boot();
