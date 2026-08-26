/**
 * DASHBOARD PAGE
 * Styled with Stitch "Tournament Dashboard (Desktop)" and merged with "Match Result Detail (Desktop)"
 * Team Logos Integrated from Official Registry
 */
import { renderPage, setActiveNav, fmt, fmtMvp, placementColor, ordinal } from '../ui.js';
import { getUserPredictions, getSession } from '../state.js';
import { renderTeamLogoBadge } from '../data/teamLogos.js';

// Official PUBG Mobile Placement Points Lookup
const OFFICIAL_PLACEMENT_PTS = {
  1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1,
  9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0
};

export function renderDashboard(store) {
  setActiveNav('dashboard');

  const { matches, players, teams } = store;

  if (!matches.length) {
    renderPage(`
      <div class="container mx-auto py-12">
        <div class="hud-card p-12 text-center border border-outline-variant max-w-xl mx-auto">
          <span class="material-symbols-outlined text-5xl text-outline mb-4">folder_off</span>
          <h2 class="font-headline font-bold text-2xl uppercase tracking-wider text-on-surface mb-2">NO TELEMETRY INGESTED</h2>
          <p class="font-label text-sm text-outline mb-6">
            Place your 36 PMGO match JSON files in <code class="text-primary bg-black px-2 py-1">public/data/</code> and refresh.
          </p>
        </div>
      </div>
    `);
    return;
  }

  const totalKills   = Object.values(players).reduce((s, p) => s + p.totalEliminations, 0);
  const totalMatches = matches.length;
  const totalTeams   = Object.keys(teams).length;

  const topMvpPlayer = Object.values(players)
    .filter(p => p.matchesPlayed >= 3)
    .sort((a, b) => b.avgMvpRate - a.avgMvpRate)[0];

  const phases = [...new Set(matches.map(m => m.phase))].sort();
  let selectedPhase = phases[0];
  
  let selectedMatchId = matches[0].id;

  const predictions = getUserPredictions();

  function renderContent() {
    const activeMatch = matches.find(m => m.id === selectedMatchId) || matches[0];
    const userPred = predictions[activeMatch.id];
    
    const teamsWithPoints = activeMatch.teams.map(t => {
      const placePts = OFFICIAL_PLACEMENT_PTS[t.rank] ?? 0;
      const killPts  = t.totalKills;
      const totalMatchPts = placePts + killPts;
      return {
        ...t,
        placePts,
        killPts,
        totalMatchPts,
      };
    }).sort((a, b) => b.totalMatchPts - a.totalMatchPts || a.rank - b.rank);

    renderPage(`
      <div class="flex flex-col gap-8 pb-12">
        
        <!-- Hero Section (Live Match/Featured Telemetry) -->
        <div class="hud-card relative h-[380px] overflow-hidden flex flex-col scanline-effect border border-outline-variant group">
          <div class="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity group-hover:opacity-50 transition-opacity duration-500" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuAnsQ26AqNTUGvuTo_luoujTihS-j2wdGZrzUCnOgLuaiZ4iBihdS_QOTMa82ow_hcq81eMtIcc5aLB5W4n0NKLMtSLB2lOiXkm1sNPgrKhnAkVtA_IHVN51Gynjl0YITrRg82dYwVj8dKWr3VYrrQnjqD-z2iarMKlc6emqwn38-3BPjyPHHK0WM8mEKe-mC39uaZetzEHOaFII5QhF2PA2EJdI-yGPXzAVl-ib2Vj3MJMYSCIAg')"></div>
          
          <!-- Top Telemetry Header -->
          <div class="relative z-20 p-6 flex justify-between items-start">
            <div class="flex items-center gap-3 bg-[#0E0E0F]/90 px-3.5 py-1.5 border border-outline-variant">
              <div class="w-2.5 h-2.5 bg-status-live pulse-live rounded-none"></div>
              <span class="font-headline font-bold text-xs text-white tracking-widest uppercase">TELEMETRY ACTIVE</span>
            </div>
            <div class="bg-[#0E0E0F]/90 px-4 py-2 border border-outline-variant flex flex-col items-end">
              <span class="font-label text-[10px] font-bold text-outline tracking-widest uppercase">STAGE OVERVIEW</span>
              <span class="font-headline font-bold text-primary text-base uppercase tracking-wider">${totalMatches} MATCHES INGESTED</span>
            </div>
          </div>

          <!-- Bottom Hero Stats -->
          <div class="relative z-20 mt-auto p-6 md:p-8 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/80 to-transparent flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
            <div>
              <div class="font-headline font-bold text-xs text-primary uppercase tracking-widest mb-1">PMGO TOURNAMENT COMMAND</div>
              <h1 class="font-headline font-bold text-3xl md:text-5xl text-white uppercase tracking-tight mb-2">GLOBAL FINALS TELEMETRY</h1>
              <p class="font-body text-sm text-outline max-w-xl">
                Real-time spectator engine output ingested from Shadow Tracker. ${totalTeams} teams competing across ${totalMatches} games.
              </p>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto shrink-0">
              <div class="hud-card bg-[#1A1A1C]/90 p-3 text-center border border-outline-variant min-w-[110px]">
                <div class="font-label text-[10px] font-bold text-outline uppercase tracking-wider mb-1">MATCHES</div>
                <div class="font-headline font-bold text-white text-2xl tracking-tight">${totalMatches}</div>
              </div>
              <div class="hud-card bg-[#1A1A1C]/90 p-3 text-center border border-outline-variant min-w-[110px]">
                <div class="font-label text-[10px] font-bold text-outline uppercase tracking-wider mb-1">TEAMS</div>
                <div class="font-headline font-bold text-white text-2xl tracking-tight">${totalTeams}</div>
              </div>
              <div class="hud-card bg-[#1A1A1C]/90 p-3 text-center border border-outline-variant min-w-[110px]">
                <div class="font-label text-[10px] font-bold text-outline uppercase tracking-wider mb-1">KILLS</div>
                <div class="font-headline font-bold text-primary text-2xl tracking-tight">${fmt(totalKills)}</div>
              </div>
              <div class="hud-card bg-[#1A1A1C]/90 p-3 text-center border border-outline-variant min-w-[110px]">
                <div class="font-label text-[10px] font-bold text-outline uppercase tracking-wider mb-1">TOP MVP</div>
                <div class="font-headline font-bold text-white text-lg tracking-tight truncate max-w-[100px]">${topMvpPlayer ? topMvpPlayer.playerName : '—'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================
             STITCH SECTION: GAME TELEMETRY & MATCH LEADERBOARD
             ============================================================ -->
        <section class="hud-card border border-outline-variant bg-[#1A1A1C] p-6 md:p-8 flex flex-col gap-6">
          
          <!-- Section Header -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-4">
            <div>
              <p class="font-headline font-bold text-xs text-primary uppercase tracking-widest flex items-center gap-2 mb-1">
                <span class="w-2 h-2 bg-status-live animate-pulse"></span> GAME TELEMETRY & MATCH LEADERBOARD
              </p>
              <h2 class="font-headline font-bold text-2xl md:text-3xl text-white uppercase tracking-tight">
                ${activeMatch.phase} — DAY ${activeMatch.day} GAME ${activeMatch.game}
              </h2>
            </div>

            <!-- Game Switcher Carousel Buttons -->
            <div class="flex gap-2 overflow-x-auto max-w-full pb-1" id="game-detail-switcher">
              ${matches.filter(m => selectedPhase === 'ALL' || m.phase === selectedPhase).slice(0, 12).map(m => {
                const isSelected = m.id === activeMatch.id;
                return `
                  <button class="game-btn px-3 py-1.5 font-headline font-bold text-xs uppercase tracking-wider ${isSelected ? 'btn-primary' : 'hud-card text-outline hover:border-primary'}" data-id="${m.id}">
                    D${m.day} G${m.game}
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Main Grid: 8 cols Official Match Points Leaderboard + 4 cols Prediction Detail -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <!-- Left Column (8 Cols): Official Game Standings Leaderboard -->
            <div class="lg:col-span-8 flex flex-col gap-3">
              
              <!-- Table Header -->
              <div class="grid grid-cols-[50px_1fr_75px_85px_110px] gap-2 px-4 py-2 bg-[#0E0E0F] border-b border-outline-variant font-headline font-bold text-xs text-outline uppercase tracking-wider">
                <div class="text-center">RANK</div>
                <div>TEAM</div>
                <div class="text-right">KILLS</div>
                <div class="text-right">PLACE PTS</div>
                <div class="text-right text-primary">MATCH PTS</div>
              </div>

              <!-- Team Placement Rows (With Team Logo Badges) -->
              <div class="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
                ${teamsWithPoints.map((t, idx) => {
                  const rank = t.rank;
                  const isTop3 = rank <= 3;
                  const glowStyles = {
                    1: 'border-primary shadow-[inset_0_0_10px_rgba(255,107,0,0.4)]',
                    2: 'border-[#2E2E32] shadow-[inset_0_0_10px_rgba(255,107,0,0.25)]',
                    3: 'border-[#2E2E32] shadow-[inset_0_0_10px_rgba(255,107,0,0.15)]',
                  };

                  return `
                    <div class="hud-card p-3 border grid grid-cols-[50px_1fr_75px_85px_110px] gap-2 items-center bg-[#131314] ${isTop3 ? (glowStyles[rank] || 'border-outline-variant') : 'border-outline-variant opacity-80'} hover:border-primary transition-all">
                      <div class="font-headline font-bold text-lg text-center" style="color:${placementColor(rank)}">
                        ${rank}
                      </div>
                      
                      <div class="flex items-center gap-3 min-w-0">
                        ${renderTeamLogoBadge(t.teamName, 'w-9 h-9', isTop3 ? 'border-2 border-primary' : 'border border-outline-variant')}
                        <span class="font-headline font-bold text-base text-white uppercase truncate">${t.teamName}</span>
                      </div>

                      <div class="font-headline font-bold text-white text-right text-base">${t.killPts}</div>
                      <div class="font-headline font-bold text-outline text-right text-sm">+${t.placePts}</div>
                      <div class="font-headline font-bold text-primary text-right text-xl">${t.totalMatchPts} PTS</div>
                    </div>
                  `;
                }).join('')}
              </div>

            </div>

            <!-- Right Column (4 Cols): Prediction Payout & Reward Decay Widget -->
            <div class="lg:col-span-4 hud-card border border-outline-variant bg-[#0E0E0F] p-5 flex flex-col gap-5">
              
              <div class="flex items-center justify-between border-b border-outline-variant pb-3">
                <span class="font-headline font-bold text-xs text-primary uppercase tracking-widest flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">troubleshoot</span> YOUR MATCH PREDICTION
                </span>
                <span class="font-label text-[10px] text-outline uppercase">${activeMatch.phase}</span>
              </div>

              ${userPred ? `
                <div class="flex items-center gap-4 bg-[#1A1A1C] p-3.5 border border-outline-variant">
                  ${renderTeamLogoBadge(userPred.predictedTeamName, 'w-12 h-12', 'border-2 border-primary')}
                  <div>
                    <div class="font-label text-[9px] text-outline uppercase">PICKED WINNER</div>
                    <div class="font-headline font-bold text-xl text-white uppercase">${userPred.predictedTeamName}</div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="hud-card p-3 text-center bg-[#1A1A1C]">
                    <div class="font-label text-[9px] text-outline uppercase mb-1">ACTUAL FINISH</div>
                    <div class="font-headline font-bold text-xl text-white" style="color:${placementColor(userPred.actualPlacement)}">${ordinal(userPred.actualPlacement)}</div>
                  </div>
                  <div class="hud-card p-3 text-center bg-[#1A1A1C]">
                    <div class="font-label text-[9px] text-outline uppercase mb-1">POINTS EARNED</div>
                    <div class="font-headline font-bold text-2xl text-primary">+${userPred.points ?? 0}</div>
                  </div>
                </div>
              ` : `
                <div class="p-4 border border-dashed border-outline-variant text-center bg-[#1A1A1C]">
                  <div class="font-headline font-bold text-sm text-white uppercase mb-1">NO PREDICTION SUBMITTED</div>
                  <div class="font-label text-xs text-outline mb-3">Lock in your team pick for next match</div>
                  <a href="#/predictions" class="btn-primary inline-flex px-4 py-2 font-headline font-bold text-xs uppercase">MAKE PREDICTION</a>
                </div>
              `}

              <!-- Point Decay Reward Bars -->
              <div class="border-t border-outline-variant pt-4">
                <div class="font-headline font-bold text-[11px] text-outline uppercase tracking-wider mb-3">REWARD DECAY CURVE (BASE 10 PTS)</div>
                <div class="flex items-end gap-1.5 h-20 border-b border-outline-variant pb-1">
                  <div class="flex-1 bg-primary/80 h-full relative" title="1st Place (10pt)"></div>
                  <div class="flex-1 bg-primary/60 h-[80%]" title="2nd Place (8pt)"></div>
                  <div class="flex-1 bg-primary/40 h-[50%]" title="3rd Place (5pt)"></div>
                  <div class="flex-1 bg-primary/25 h-[30%]" title="4th Place (3pt)"></div>
                  <div class="flex-1 bg-primary/10 h-[10%]" title="5th Place (1pt)"></div>
                </div>
                <div class="flex justify-between mt-1 font-label text-[9px] text-outline uppercase">
                  <span>1ST (10)</span>
                  <span>3RD (5)</span>
                  <span>6TH+ (0)</span>
                </div>
              </div>

              <a href="#/predictions" class="btn-primary w-full py-3 text-center font-headline font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-base">target</span> PREDICT NEXT MATCH
              </a>

            </div>

          </div>

        </section>

        <!-- Match Cards Overview Grid -->
        <div class="flex flex-col gap-4">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-4">
            <h2 class="font-headline font-bold text-2xl text-white uppercase tracking-wider flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">apps</span> MATCH GRID TELEMETRY
            </h2>
            <div class="flex gap-2" id="phase-tabs">
              ${phases.map(p => `
                <button class="phase-btn px-4 py-1.5 font-headline font-bold text-xs uppercase tracking-wider ${p === selectedPhase ? 'btn-primary' : 'hud-card text-on-surface-variant hover:border-primary'}" data-phase="${p}">${p}</button>
              `).join('')}
              <button class="phase-btn px-4 py-1.5 font-headline font-bold text-xs uppercase tracking-wider ${selectedPhase === 'ALL' ? 'btn-primary' : 'hud-card text-on-surface-variant hover:border-primary'}" data-phase="ALL">ALL MATCHES</button>
            </div>
          </div>

          <div id="matches-content">
            ${renderPhaseMatches(matches, selectedPhase, selectedMatchId)}
          </div>
        </div>

      </div>
    `);

    // Handlers
    const gameDetailSwitcher = document.getElementById('game-detail-switcher');
    if (gameDetailSwitcher) {
      gameDetailSwitcher.onclick = e => {
        const btn = e.target.closest('.game-btn');
        if (!btn) return;
        selectedMatchId = btn.dataset.id;
        renderContent();
      };
    }

    const phaseTabs = document.getElementById('phase-tabs');
    if (phaseTabs) {
      phaseTabs.onclick = e => {
        const btn = e.target.closest('.phase-btn');
        if (!btn) return;
        selectedPhase = btn.dataset.phase;
        renderContent();
      };
    }

    document.querySelectorAll('.match-select-card').forEach(card => {
      card.onclick = () => {
        selectedMatchId = card.dataset.id;
        renderContent();
      };
    });
  }

  renderContent();
}

function renderPhaseMatches(matches, phase, activeMatchId) {
  const filtered = phase === 'ALL' ? matches : matches.filter(m => m.phase === phase);
  const days = [...new Set(filtered.map(m => m.day))].sort();

  return days.map(day => {
    const dayMatches = filtered.filter(m => m.day === day);
    return `
      <div class="mb-8">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-headline font-bold text-base text-primary uppercase tracking-widest flex items-center gap-2">
            <span class="w-2 h-2 bg-primary"></span> DAY ${day} MATCHES
          </h3>
          <span class="font-label text-xs text-outline tracking-widest uppercase">${dayMatches.length} GAMES</span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${dayMatches.map(m => renderMatchCard(m, m.id === activeMatchId)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderMatchCard(match, isSelected) {
  const winner = match.winner;
  const topKiller = match.topKiller;

  return `
    <div class="match-select-card hud-card p-5 border transition-all cursor-pointer group relative overflow-hidden ${isSelected ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(255,107,0,0.2)]' : 'border-outline-variant hover:border-primary bg-[#1A1A1C]'}" data-id="${match.id}">
      <div class="flex justify-between items-center mb-3">
        <div class="flex items-center gap-2">
          <span class="font-headline font-bold text-xl text-white tracking-wider">GAME ${match.game}</span>
          <span class="bg-primary/10 border border-primary/40 text-primary font-headline text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider">${match.phase}</span>
        </div>
        <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-lg">read_more</span>
      </div>

      <div class="h-px bg-outline-variant mb-4"></div>

      <div class="grid grid-cols-3 gap-2 mb-4 text-center">
        <div class="bg-[#0E0E0F] p-2 border border-outline-variant/60">
          <div class="font-headline font-bold text-white text-lg">${match.teamCount}</div>
          <div class="font-label text-[9px] text-outline uppercase tracking-wider">TEAMS</div>
        </div>
        <div class="bg-[#0E0E0F] p-2 border border-outline-variant/60">
          <div class="font-headline font-bold text-white text-lg">${match.players.reduce((s,p)=>s+p.eliminations,0)}</div>
          <div class="font-label text-[9px] text-outline uppercase tracking-wider">KILLS</div>
        </div>
        <div class="bg-[#0E0E0F] p-2 border border-outline-variant/60">
          <div class="font-headline font-bold text-primary text-lg">${topKiller?.eliminations ?? 0}</div>
          <div class="font-label text-[9px] text-outline uppercase tracking-wider">TOP FRAGS</div>
        </div>
      </div>

      ${winner ? `
        <div class="flex items-center justify-between p-2.5 bg-status-success/5 border border-status-success/20 mb-2 gap-2">
          <span class="font-label text-[10px] font-bold text-status-success uppercase tracking-widest flex items-center gap-1 shrink-0">
            <span class="material-symbols-outlined text-xs">emoji_events</span> WINNER
          </span>
          <div class="flex items-center gap-2 truncate">
            ${renderTeamLogoBadge(winner.teamName, 'w-5 h-5', 'border border-status-success/60')}
            <span class="font-headline font-bold text-white text-sm tracking-wide uppercase truncate">${winner.teamName}</span>
          </div>
        </div>
      ` : ''}

      ${topKiller ? `
        <div class="flex items-center justify-between text-xs px-1">
          <span class="font-label text-outline text-[10px] uppercase">TOP FRAGGER</span>
          <span class="font-headline font-bold text-primary tracking-wide uppercase">${topKiller.playerName} (${topKiller.eliminations}K)</span>
        </div>
      ` : ''}
    </div>
  `;
}
