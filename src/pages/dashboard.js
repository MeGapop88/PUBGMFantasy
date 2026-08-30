/**
 * DASHBOARD PAGE — TOURNAMENT COMMAND CENTER
 * Displays Overall Finals Tournament Standings across all 18 Finals games in a clean 2-column (8 teams each) layout,
 * Stage Hero Telemetry, and Match Grid that links directly to Match Result drilldown.
 */
import { renderPage, setActiveNav, fmt, fmtPower, placementColor } from '../ui.js';
import { renderTeamLogoBadge } from '../data/teamLogos.js';

export function renderDashboard(store) {
  setActiveNav('dashboard');

  const { matches, players, teams, finalsStandings } = store;

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

  const topPowerPlayer = Object.values(players)
    .filter(p => p.matchesPlayed >= 3)
    .sort((a, b) => b.avgPower - a.avgPower)[0];

  const phases = [...new Set(matches.map(m => m.phase))].sort();
  let selectedPhase = 'Finals';

  const standings = finalsStandings || [];
  const col1Teams = standings.slice(0, 8);
  const col2Teams = standings.slice(8, 16);

  function renderStandingsColumn(teamList, colTitle) {
    return `
      <div class="flex flex-col gap-2.5 flex-1 min-w-[500px]">
        
        <!-- Table Header Row -->
        <div class="grid grid-cols-[45px_1fr_60px_65px_75px_95px] gap-2 px-3.5 py-2.5 bg-[#0E0E0F] border border-outline-variant font-headline font-bold text-xs text-outline uppercase tracking-wider items-center">
          <div class="text-center">RANK</div>
          <div>TEAM</div>
          <div class="text-right">WWCD</div>
          <div class="text-right">KILLS</div>
          <div class="text-right">PLACE</div>
          <div class="text-right text-primary">TOTAL PTS</div>
        </div>

        <!-- Team Rows -->
        <div class="flex flex-col gap-2">
          ${teamList.map(t => {
            const rank = t.tournamentRank;
            const isTop3 = rank <= 3;
            const glowStyles = {
              1: 'border-primary shadow-[inset_0_0_10px_rgba(255,107,0,0.4)]',
              2: 'border-[#2E2E32] shadow-[inset_0_0_10px_rgba(255,107,0,0.25)]',
              3: 'border-[#2E2E32] shadow-[inset_0_0_10px_rgba(255,107,0,0.15)]',
            };

            return `
              <div class="hud-card p-3 border grid grid-cols-[45px_1fr_60px_65px_75px_95px] gap-2 items-center bg-[#131314] ${isTop3 ? (glowStyles[rank] || 'border-outline-variant') : 'border-outline-variant opacity-90'} hover:border-primary transition-all">
                <div class="font-headline font-bold text-base text-center" style="color:${placementColor(rank)}">
                  #${rank}
                </div>
                
                <div class="flex items-center gap-2.5 min-w-0">
                  ${renderTeamLogoBadge(t.teamName, 'w-8 h-8', isTop3 ? 'border-2 border-primary' : 'border border-outline-variant')}
                  <div class="min-w-0">
                    <span class="font-headline font-bold text-sm text-white uppercase truncate block">${t.teamName}</span>
                    <span class="font-label text-[9px] text-outline truncate block">${t.matchesPlayed}G · ${fmt(t.totalDamage)} DMG</span>
                  </div>
                </div>

                <div class="font-headline font-bold text-white text-right text-sm flex items-center justify-end gap-0.5">
                  ${t.wins > 0 ? `<span class="material-symbols-outlined text-[13px] text-status-success">emoji_events</span>` : ''}
                  <span>${t.wins}</span>
                </div>

                <div class="font-headline font-bold text-white text-right text-sm">${t.totalKills}</div>
                <div class="font-headline font-bold text-outline text-right text-xs">+${t.totalPlacePts}</div>
                <div class="font-headline font-bold text-primary text-right text-lg">${t.totalPoints}</div>
              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;
  }

  function renderContent() {
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
                <div class="font-label text-[10px] font-bold text-outline uppercase tracking-wider mb-1">TOTAL KILLS</div>
                <div class="font-headline font-bold text-primary text-2xl tracking-tight">${fmt(totalKills)}</div>
              </div>
              <div class="hud-card bg-[#1A1A1C]/90 p-3 text-center border border-outline-variant min-w-[110px]">
                <div class="font-label text-[10px] font-bold text-outline uppercase tracking-wider mb-1">TOP OPERATIVE</div>
                <div class="font-headline font-bold text-white text-lg tracking-tight truncate max-w-[100px]">${topPowerPlayer ? topPowerPlayer.playerName : '—'}</div>
                <div class="font-label text-[9px] text-primary font-bold">${topPowerPlayer ? fmtPower(topPowerPlayer.avgPower) : ''}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================
             OVERALL TOURNAMENT STANDINGS (2 COLUMNS x 8 TEAMS)
             ============================================================ -->
        <section class="hud-card border border-outline-variant bg-[#1A1A1C] p-6 md:p-8 flex flex-col gap-6">
          
          <!-- Section Header -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-4">
            <div>
              <p class="font-headline font-bold text-xs text-primary uppercase tracking-widest flex items-center gap-2 mb-1">
                <span class="w-2 h-2 bg-status-live animate-pulse"></span> TOURNAMENT STANDINGS (ALL FINALS GAMES)
              </p>
              <h2 class="font-headline font-bold text-2xl md:text-3xl text-white uppercase tracking-tight">
                PMGO FINALS OVERALL LEADERBOARD
              </h2>
            </div>
            
            <div class="bg-[#0E0E0F] px-4 py-2 border border-outline-variant text-right">
              <span class="font-label text-[10px] text-outline uppercase tracking-wider block">SCORING SYSTEM</span>
              <span class="font-headline font-bold text-xs text-primary uppercase">1 KILL = 1 PT + OFFICIAL PLACEMENT PTS</span>
            </div>
          </div>

          <!-- Standings 2-Column Grid (8 Teams in Col 1 + 8 Teams in Col 2) -->
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start overflow-x-auto">
            ${renderStandingsColumn(col1Teams, 'TOP 8 CONTENDERS')}
            ${renderStandingsColumn(col2Teams, 'RANKS 9 - 16')}
          </div>

        </section>

        <!-- Match Grid Telemetry (Clicking a card opens the Match Result Detail page) -->
        <div class="flex flex-col gap-4">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-4">
            <div>
              <h2 class="font-headline font-bold text-2xl text-white uppercase tracking-wider flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">apps</span> MATCH GRID TELEMETRY
              </h2>
              <p class="font-label text-xs text-outline mt-0.5">Click any match card to inspect the game results & player performance</p>
            </div>

            <div class="flex gap-2" id="phase-tabs">
              ${phases.map(p => `
                <button class="phase-btn px-4 py-1.5 font-headline font-bold text-xs uppercase tracking-wider ${p === selectedPhase ? 'btn-primary' : 'hud-card text-on-surface-variant hover:border-primary'}" data-phase="${p}">${p}</button>
              `).join('')}
              <button class="phase-btn px-4 py-1.5 font-headline font-bold text-xs uppercase tracking-wider ${selectedPhase === 'ALL' ? 'btn-primary' : 'hud-card text-on-surface-variant hover:border-primary'}" data-phase="ALL">ALL MATCHES</button>
            </div>
          </div>

          <div id="matches-content">
            ${renderPhaseMatches(matches, selectedPhase)}
          </div>
        </div>

      </div>
    `);

    // Handlers
    const phaseTabs = document.getElementById('phase-tabs');
    if (phaseTabs) {
      phaseTabs.onclick = e => {
        const btn = e.target.closest('.phase-btn');
        if (!btn) return;
        selectedPhase = btn.dataset.phase;
        renderContent();
      };
    }
  }

  renderContent();
}

function renderPhaseMatches(matches, phase) {
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
          ${dayMatches.map(m => renderMatchCard(m)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderMatchCard(match) {
  const winner = match.winner;
  const topKiller = match.topKiller;

  return `
    <div class="match-select-card hud-card p-5 border border-outline-variant hover:border-primary bg-[#1A1A1C] transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between" onclick="window.location.hash='/match/${match.id}'">
      <div>
        <div class="flex justify-between items-center mb-3">
          <div class="flex items-center gap-2">
            <span class="font-headline font-bold text-xl text-white tracking-wider">GAME ${match.game}</span>
            <span class="bg-primary/10 border border-primary/40 text-primary font-headline text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider">${match.phase}</span>
          </div>
          <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-lg">arrow_forward</span>
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
      </div>

      <div class="flex justify-between items-center text-xs pt-2 border-t border-outline-variant/40 text-outline">
        <span class="font-label text-[10px] uppercase">INSPECT TELEMETRY</span>
        <span class="text-primary font-headline font-bold uppercase group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
          VIEW RESULT <span class="material-symbols-outlined text-sm">chevron_right</span>
        </span>
      </div>
    </div>
  `;
}
