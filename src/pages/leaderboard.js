/**
 * LEADERBOARD PAGE
 * Styled to match Stitch "Fantasy Leaderboard (Desktop)"
 * Team Logo Integration
 */
import { renderPage, setActiveNav, toast, fmt, fmtMvp } from '../ui.js';
import {
  getFantasyLeaderboard,
  getPredictionLeaderboard,
  getSession,
} from '../state.js';
import { renderTeamLogoBadge } from '../data/teamLogos.js';

export function renderLeaderboard(store, router) {
  setActiveNav('leaderboard');
  const session = getSession();
  if (!session) { router.navigate('/login'); return; }

  const { players: playerRegistry } = store;

  const fantasyLb     = getFantasyLeaderboard(playerRegistry);
  const predictionLb  = getPredictionLeaderboard();
  const currentUser   = session.key;

  let activeTab = 'FANTASY';

  function renderContent() {
    renderPage(`
      <div class="flex flex-col gap-6 pb-12">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-6">
          <div>
            <div class="font-headline font-bold text-xs text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
              <span class="material-symbols-outlined text-base">leaderboard</span> GLOBAL COMPETITIVE STANDINGS
            </div>
            <h1 class="font-headline font-bold text-3xl md:text-4xl text-white uppercase tracking-tight">TOURNAMENT LEADERBOARD</h1>
          </div>

          <div class="flex gap-2" id="lb-tabs">
            <button class="lb-tab-btn px-4 py-2 font-headline font-bold text-xs uppercase tracking-wider ${activeTab==='FANTASY'?'btn-primary':'hud-card text-outline hover:border-primary'}" data-tab="FANTASY">FANTASY SQUADS</button>
            <button class="lb-tab-btn px-4 py-2 font-headline font-bold text-xs uppercase tracking-wider ${activeTab==='PREDICTIONS'?'btn-primary':'hud-card text-outline hover:border-primary'}" data-tab="PREDICTIONS">PREDICTORS</button>
          </div>
        </div>

        <!-- Leaderboard Rows -->
        <div class="flex flex-col gap-3" id="lb-rows">
          ${activeTab === 'FANTASY' ? renderFantasyLb() : renderPredictionLb()}
        </div>

      </div>
    `);

    document.querySelectorAll('.lb-tab-btn').forEach(btn => {
      btn.onclick = () => {
        activeTab = btn.dataset.tab;
        renderContent();
      };
    });
  }

  function renderFantasyLb() {
    if (!fantasyLb.length) {
      return `
        <div class="hud-card p-12 text-center border border-outline-variant max-w-xl mx-auto">
          <span class="material-symbols-outlined text-5xl text-outline mb-4">groups</span>
          <h3 class="font-headline font-bold text-xl uppercase text-white mb-2">NO FANTASY SQUADS LOCK IN YET</h3>
          <p class="font-body text-xs text-outline mb-4">Be the first operative to build and lock in a fantasy squad.</p>
          <a href="#/fantasy" class="btn-primary inline-flex px-6 py-2.5 font-headline font-bold text-xs uppercase">BUILD SQUAD DRAFT</a>
        </div>
      `;
    }

    return fantasyLb.map((entry, idx) => {
      const rank = idx + 1;
      const isMine = entry.key === currentUser;
      const rankColors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

      return `
        <div class="hud-card p-4 border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${isMine ? 'border-primary bg-primary/10' : 'border-outline-variant bg-[#1A1A1C] hover:border-outline'}">
          
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <div class="w-12 h-12 border flex items-center justify-center font-headline font-bold text-xl shrink-0" style="border-color:${rankColors[rank] || '#2E2E32'}; color:${rankColors[rank] || '#a98a7d'}">
              #${rank}
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="font-headline font-bold text-lg text-white uppercase truncate">${entry.teamName}</span>
                ${isMine ? `<span class="bg-primary text-black font-headline font-bold text-[9px] px-2 py-0.5 uppercase">YOU</span>` : ''}
              </div>
              <div class="font-label text-xs text-outline uppercase mb-2">OPERATIVE: ${entry.username}</div>

              <!-- Player Roster Chips -->
              <div class="flex flex-wrap gap-2">
                ${entry.players.map(p => `
                  <span class="bg-[#0E0E0F] border border-outline-variant/60 px-2 py-1 font-label text-[10px] text-outline flex items-center gap-1.5">
                    ${renderTeamLogoBadge(p.teamName, 'w-4 h-4', 'border border-outline-variant')}
                    <strong class="text-white">${p.playerName}</strong>
                    <span class="text-primary font-bold">${fmtMvp(p.avgMvpRate)}</span>
                  </span>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="text-left md:text-right border-t md:border-t-0 border-outline-variant pt-3 md:pt-0 w-full md:w-auto flex justify-between md:flex-col items-center md:items-end">
            <span class="font-label text-[10px] text-outline uppercase">TOTAL MVP SCORE</span>
            <span class="font-headline font-bold text-2xl text-primary">${fmtMvp(entry.score)}</span>
          </div>

        </div>
      `;
    }).join('');
  }

  function renderPredictionLb() {
    if (!predictionLb.length) {
      return `
        <div class="hud-card p-12 text-center border border-outline-variant max-w-xl mx-auto">
          <span class="material-symbols-outlined text-5xl text-outline mb-4">target</span>
          <h3 class="font-headline font-bold text-xl uppercase text-white mb-2">NO PREDICTION TELEMETRY YET</h3>
          <p class="font-body text-xs text-outline mb-4">Go to match predictions to lock in your picks.</p>
          <a href="#/predictions" class="btn-primary inline-flex px-6 py-2.5 font-headline font-bold text-xs uppercase">MAKE PREDICTIONS</a>
        </div>
      `;
    }

    return predictionLb.map((entry, idx) => {
      const rank = idx + 1;
      const isMine = entry.key === currentUser;
      const rankColors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

      return `
        <div class="hud-card p-4 border transition-all flex items-center justify-between gap-4 ${isMine ? 'border-primary bg-primary/10' : 'border-outline-variant bg-[#1A1A1C] hover:border-outline'}">
          
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 border flex items-center justify-center font-headline font-bold text-xl shrink-0" style="border-color:${rankColors[rank] || '#2E2E32'}; color:${rankColors[rank] || '#a98a7d'}">
              #${rank}
            </div>

            <div>
              <div class="flex items-center gap-2">
                <span class="font-headline font-bold text-lg text-white uppercase">${entry.username}</span>
                ${isMine ? `<span class="bg-primary text-black font-headline font-bold text-[9px] px-2 py-0.5 uppercase">YOU</span>` : ''}
              </div>
              <div class="font-label text-xs text-outline uppercase mt-0.5">
                ${entry.totalPicks} PICKS · ${entry.correctPicks} PERFECT 10s
              </div>
            </div>
          </div>

          <div class="text-right">
            <div class="font-label text-[10px] text-outline uppercase">PREDICTION POINTS</div>
            <div class="font-headline font-bold text-2xl text-primary">${fmt(entry.totalPoints)} PTS</div>
          </div>

        </div>
      `;
    }).join('');
  }

  renderContent();
}
