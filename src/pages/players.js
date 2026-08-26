/**
 * PLAYERS PAGE & PLAYER PROFILE
 * Styled to match Stitch "Player Profile (Desktop)"
 * Team Logo Integration
 */
import { renderPage, setActiveNav, toast, fmt, fmtMvp, fmtTime, getInitials, ordinal, placementColor } from '../ui.js';
import { getSession } from '../state.js';
import { renderTeamLogoBadge } from '../data/teamLogos.js';

export function renderPlayers(store, router, params = {}) {
  setActiveNav('players');
  const session = getSession();
  if (!session) { router.navigate('/login'); return; }

  const { players: playerRegistry } = store;
  const allPlayers = Object.values(playerRegistry).sort((a, b) => b.totalMvpRate - a.totalMvpRate);

  if (!allPlayers.length) {
    renderPage(`<div class="container mx-auto py-12"><div class="hud-card p-12 text-center border border-outline-variant max-w-xl mx-auto"><span class="material-symbols-outlined text-5xl text-outline mb-4">folder_off</span><h2 class="font-headline font-bold text-2xl uppercase tracking-wider text-on-surface">NO PLAYER TELEMETRY</h2></div></div>`);
    return;
  }

  if (params.uid) {
    const player = playerRegistry[params.uid];
    if (player) {
      renderPlayerProfile(player, router);
      return;
    }
  }

  let searchQuery = '';
  let teamFilter  = 'ALL';
  const allTeams  = [...new Set(allPlayers.map(p => p.teamName))].sort();

  function renderContent() {
    let filtered = allPlayers;
    if (teamFilter !== 'ALL') filtered = filtered.filter(p => p.teamName === teamFilter);
    if (searchQuery) filtered = filtered.filter(p =>
      p.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.teamName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    renderPage(`
      <div class="flex flex-col gap-6 pb-12">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-6">
          <div>
            <div class="font-headline font-bold text-xs text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
              <span class="material-symbols-outlined text-base">badge</span> COMPETITIVE PLAYER DATABASE
            </div>
            <h1 class="font-headline font-bold text-3xl md:text-4xl text-white uppercase tracking-tight">PLAYER TELEMETRY ROSTER</h1>
          </div>

          <div class="font-label text-xs text-outline bg-[#1A1A1C] p-3 border border-outline-variant">
            <span>${allPlayers.length} OPERATIVES · ${allTeams.length} TEAMS</span>
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input id="players-search" type="text" placeholder="Search operative or team..." value="${searchQuery}" class="w-full bg-[#1A1A1C] border border-outline-variant pl-10 pr-4 py-2.5 font-body text-sm text-on-surface focus:border-primary focus:outline-none" />
          </div>
          <div class="flex gap-1 overflow-x-auto pb-1" id="players-team-filter">
            <button class="filter-btn px-3 py-2 font-headline font-bold text-xs uppercase ${teamFilter === 'ALL' ? 'btn-primary' : 'hud-card text-outline hover:border-primary'}" data-team="ALL">ALL TEAMS</button>
            ${allTeams.map(t => `
              <button class="filter-btn px-3 py-2 font-headline font-bold text-xs uppercase shrink-0 ${teamFilter === t ? 'btn-primary' : 'hud-card text-outline hover:border-primary'}" data-team="${t}">${t}</button>
            `).join('')}
          </div>
        </div>

        <!-- Player Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="players-grid">
          ${filtered.map(p => `
            <div class="player-card hud-card p-4 border border-outline-variant hover:border-primary transition-all cursor-pointer bg-[#1A1A1C] group flex flex-col justify-between" data-uid="${p.uId}">
              
              <div>
                <div class="flex items-center gap-3 mb-4">
                  ${renderTeamLogoBadge(p.teamName, 'w-12 h-12', 'border border-primary/50 group-hover:scale-105 transition-transform')}
                  <div class="min-w-0">
                    <div class="font-headline font-bold text-lg text-white uppercase truncate group-hover:text-primary transition-colors">${p.playerName}</div>
                    <div class="font-label text-xs text-outline uppercase truncate">${p.teamName}</div>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-1 bg-[#0E0E0F] p-2.5 border border-outline-variant/60 text-center mb-3">
                  <div>
                    <div class="font-headline font-bold text-primary text-base">${fmtMvp(p.avgMvpRate)}</div>
                    <div class="font-label text-[8px] text-outline uppercase">AVG MVP</div>
                  </div>
                  <div>
                    <div class="font-headline font-bold text-white text-base">${fmt(p.avgEliminations, 1)}</div>
                    <div class="font-label text-[8px] text-outline uppercase">AVG KILLS</div>
                  </div>
                  <div>
                    <div class="font-headline font-bold text-white text-base">${fmt(p.avgDamage, 0)}</div>
                    <div class="font-label text-[8px] text-outline uppercase">AVG DMG</div>
                  </div>
                </div>
              </div>

              <div class="flex justify-between items-center text-xs pt-2 border-t border-outline-variant/40 text-outline">
                <span>${p.matchesPlayed} MATCHES</span>
                <span class="text-primary font-headline font-bold uppercase group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                  DOSSIER <span class="material-symbols-outlined text-sm">chevron_right</span>
                </span>
              </div>
            </div>
          `).join('') || `<div class="col-span-full text-center py-12 font-label text-outline uppercase">No operatives matching parameters.</div>`}
        </div>

      </div>
    `);

    // Handlers
    const searchInput = document.getElementById('players-search');
    if (searchInput) {
      searchInput.oninput = e => {
        searchQuery = e.target.value;
        renderContent();
      };
    }

    document.querySelectorAll('#players-team-filter .filter-btn').forEach(btn => {
      btn.onclick = () => {
        teamFilter = btn.dataset.team;
        renderContent();
      };
    });

    document.querySelectorAll('#players-grid .player-card').forEach(card => {
      card.onclick = () => {
        router.navigate(`/player/${card.dataset.uid}`);
      };
    });
  }

  renderContent();
}

function renderPlayerProfile(player, router) {
  const perMatch = player.perMatchStats.sort((a, b) => {
    if (a.phase !== b.phase) return a.phase.localeCompare(b.phase);
    if (a.day !== b.day) return a.day - b.day;
    return a.game - b.game;
  });

  const bestMvp = Math.max(...player.perMatchStats.map(m => m.mvpRate));
  const bestKills = Math.max(...player.perMatchStats.map(m => m.eliminations));
  const bestDmg = Math.max(...player.perMatchStats.map(m => m.damage));

  renderPage(`
    <div class="flex flex-col gap-6 pb-12">
      
      <!-- Back Button -->
      <div>
        <button id="back-btn" class="btn-ghost px-4 py-2 font-headline font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2">
          <span class="material-symbols-outlined text-base">arrow_back</span> BACK TO ROSTER
        </button>
      </div>

      <!-- Player Header Card -->
      <div class="hud-card p-6 md:p-8 border border-outline-variant bg-[#1A1A1C] relative overflow-hidden flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div class="flex items-center gap-5">
          ${renderTeamLogoBadge(player.teamName, 'w-20 h-20', 'border-2 border-primary')}
          <div>
            <div class="font-headline font-bold text-3xl md:text-4xl text-white uppercase tracking-tight">${player.playerName}</div>
            <div class="font-headline font-bold text-base text-primary uppercase tracking-wider mt-0.5">${player.teamName}</div>
            <div class="font-label text-xs text-outline uppercase mt-1">TELEMETRY ID: ${player.uId}</div>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
          <div class="hud-card p-3 text-center bg-[#0E0E0F] min-w-[100px]">
            <div class="font-headline font-bold text-primary text-xl">${fmtMvp(player.avgMvpRate)}</div>
            <div class="font-label text-[9px] text-outline uppercase">AVG MVP</div>
          </div>
          <div class="hud-card p-3 text-center bg-[#0E0E0F] min-w-[100px]">
            <div class="font-headline font-bold text-white text-xl">${fmt(player.avgEliminations, 1)}</div>
            <div class="font-label text-[9px] text-outline uppercase">AVG KILLS</div>
          </div>
          <div class="hud-card p-3 text-center bg-[#0E0E0F] min-w-[100px]">
            <div class="font-headline font-bold text-white text-xl">${fmt(player.avgDamage, 0)}</div>
            <div class="font-label text-[9px] text-outline uppercase">AVG DMG</div>
          </div>
          <div class="hud-card p-3 text-center bg-[#0E0E0F] min-w-[100px]">
            <div class="font-headline font-bold text-white text-xl">${player.matchesPlayed}</div>
            <div class="font-label text-[9px] text-outline uppercase">MATCHES</div>
          </div>
        </div>
      </div>

      <!-- Best Performance Bento -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="hud-card p-5 border border-outline-variant bg-[#1A1A1C]">
          <div class="font-label text-xs text-outline uppercase tracking-widest mb-1">HIGHEST MVP RATE</div>
          <div class="font-headline font-bold text-3xl text-primary">${fmtMvp(bestMvp)}</div>
        </div>
        <div class="hud-card p-5 border border-outline-variant bg-[#1A1A1C]">
          <div class="font-label text-xs text-outline uppercase tracking-widest mb-1">BEST KILL GAME</div>
          <div class="font-headline font-bold text-3xl text-white">${bestKills} KILLS</div>
        </div>
        <div class="hud-card p-5 border border-outline-variant bg-[#1A1A1C]">
          <div class="font-label text-xs text-outline uppercase tracking-widest mb-1">BEST DAMAGE GAME</div>
          <div class="font-headline font-bold text-3xl text-white">${fmt(bestDmg)} DMG</div>
        </div>
      </div>

      <!-- Match History Telemetry Table -->
      <div class="hud-card border border-outline-variant bg-[#1A1A1C] p-6">
        <h2 class="font-headline font-bold text-xl text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <span class="material-symbols-outlined text-primary">table_rows</span> MATCH-BY-MATCH TELEMETRY
        </h2>
        
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>GAME</th>
                <th>STAGE</th>
                <th>FINISH</th>
                <th>KILLS</th>
                <th>DAMAGE</th>
                <th>KNOCKDOWNS</th>
                <th>SURVIVAL TIME</th>
                <th>MVP RATE</th>
              </tr>
            </thead>
            <tbody>
              ${perMatch.map(m => `
                <tr>
                  <td class="font-headline font-bold text-white uppercase">D${m.day} GAME ${m.game}</td>
                  <td><span class="bg-primary/10 border border-primary/30 text-primary font-headline text-xs px-2 py-0.5 font-bold uppercase">${m.phase}</span></td>
                  <td class="font-headline font-bold" style="color:${placementColor(m.rank)}">${ordinal(m.rank)}</td>
                  <td class="font-headline font-bold text-white text-base">${m.eliminations}</td>
                  <td>${fmt(m.damage)}</td>
                  <td>${m.knockdowns}</td>
                  <td>${fmtTime(m.survivalTime)}</td>
                  <td class="font-headline font-bold text-primary text-base">${fmtMvp(m.mvpRate)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `);

  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.onclick = () => {
      router.navigate('/players');
    };
  }
}
