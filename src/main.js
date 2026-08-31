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
import { renderMatch }       from './pages/match.js';
import { renderTeams }       from './pages/teams.js';

// App state store
let store = { matches: [], players: {}, teams: {}, finalsStandings: [], roster: { teams: [], players: [] }, schedule: { days: [] }, loadedCount: 0, totalCount: 36 };
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
  .on('/match/:id',   guard((p) => withData((params) => renderMatch(store, router, params), p)))
  .on('/predictions', guard((p) => withData(() => renderPredictions(store, router), p)))
  .on('/fantasy',     guard((p) => withData(() => renderFantasy(store, router), p)))
  .on('/leaderboard', guard((p) => withData(() => renderLeaderboard(store, router), p)))
  .on('/players',     guard((p) => withData(() => renderPlayers(store, router, {}), p)))
  .on('/player/:uid', guard((p) => withData((params) => renderPlayers(store, router, params), p)))
  .on('/teams',       guard((p) => withData(() => renderTeams(store, router, {}), p)))
  .on('/team/:id',    guard((p) => withData((params) => renderTeams(store, router, params), p)));

// Top Navigation Bar Setup
function setupNav() {
  const session = getSession();

  const topNavUser = document.getElementById('top-nav-user');
  if (topNavUser) {
    if (session) {
      topNavUser.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2.5 bg-[#1A1A1C] border border-outline-variant px-3 py-1.5">
            <div class="w-7 h-7 border border-primary/50 bg-[#0E0E0F] flex items-center justify-center font-headline font-bold text-primary text-xs shrink-0">
              <span class="material-symbols-outlined text-base">military_tech</span>
            </div>
            <div class="flex flex-col">
              <span class="font-headline font-bold text-xs text-white uppercase tracking-wider leading-none">${session.username}</span>
              <span class="font-label text-[9px] text-primary uppercase font-bold tracking-widest mt-0.5 leading-none">DIVISION I</span>
            </div>
          </div>
          <button id="logout-btn" class="btn-ghost px-2.5 py-1.5 text-xs font-headline font-bold uppercase text-outline hover:text-red-400 border border-outline-variant hover:border-red-400 transition-all flex items-center gap-1" title="Disconnect Session">
            <span class="material-symbols-outlined text-sm">logout</span>
            <span class="hidden sm:inline">LOGOUT</span>
          </button>
        </div>
      `;
      document.getElementById('logout-btn')?.addEventListener('click', () => {
        logout();
        toast('Session Terminated', 'info');
        setupNav();
        router.navigate('/login');
      });
    } else {
      topNavUser.innerHTML = `
        <a href="#/login" class="btn-primary px-4 py-2 font-headline font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sm">login</span>
          LOGIN / REGISTER
        </a>
      `;
    }
  }

  // Mobile hamburger toggle handler
  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.onclick = () => {
      mobileMenu.classList.toggle('hidden');
    };
    // Close mobile menu on clicking any link
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.onclick = () => {
        mobileMenu.classList.add('hidden');
      };
    });
  }
}

// App Bootstrapper
async function boot() {
  setupNav();
  window.addEventListener('hashchange', () => {
    setupNav();
    router.resolve();
  });

  // Start background data load
  loadAllMatches((loaded, total) => {
    store.loadedCount = loaded;
    store.totalCount = total;
  }).then(loadedData => {
    store = loadedData;
    dataLoaded = true;
    router.resolve();
  }).catch(err => {
    console.error('Failed to load match data:', err);
    dataLoaded = true;
    router.resolve();
  });

  // Initial route resolve
  if (!window.location.hash || window.location.hash === '#/') {
    router.navigate('/dashboard');
  } else {
    router.resolve();
  }
}

boot();
