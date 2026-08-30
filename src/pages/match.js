/**
 * MATCH RESULT DETAIL PAGE
 * Shows individual game telemetry, official 16-team placements,
 * expandable team player rosters (kills, damage, knockouts/KP, survival, power),
 * and prediction scoring widget.
 */
import { renderPage, setActiveNav, fmt, fmtPower, placementColor, ordinal, fmtTime } from '../ui.js';
import { getUserPredictions, getSession } from '../state.js';
import { renderTeamLogoBadge } from '../data/teamLogos.js';

export function renderMatch(store, router, params = {}) {
  setActiveNav('dashboard');
  const session = getSession();
  if (!session) { router.navigate('/login'); return; }

  const { matches } = store;
  const matchId = params.id;
  const match = matches.find(m => m.id === matchId) || matches[0];

  if (!match) {
    renderPage(`
      <div class="container mx-auto py-12">
        <div class="hud-card p-12 text-center border border-outline-variant max-w-xl mx-auto">
          <span class="material-symbols-outlined text-5xl text-outline mb-4">error</span>
          <h2 class="font-headline font-bold text-2xl uppercase tracking-wider text-on-surface mb-2">MATCH NOT FOUND</h2>
          <p class="font-label text-sm text-outline mb-4">The requested match telemetry file is unavailable.</p>
          <a href="#/dashboard" class="btn-primary inline-flex px-6 py-2.5 font-headline font-bold text-xs uppercase">RETURN TO DASHBOARD</a>
        </div>
      </div>
    `);
    return;
  }

  const predictions = getUserPredictions();
  const userPred = predictions[match.id];

  // Track expanded team ID state in the accordion
  let expandedTeamId = match.winner ? match.winner.teamId : (match.teams[0]?.teamId ?? null);

  const sortedTeams = [...match.teams].sort((a, b) => b.totalMatchPts - a.totalMatchPts || a.rank - b.rank);
  const totalKills = match.players.reduce((s, p) => s + p.eliminations, 0);

  function renderContent() {
    renderPage(`
      <div class="flex flex-col gap-6 pb-12">
        
        <!-- Top Navigation / Breadcrumb Bar -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant pb-4">
          <div class="flex items-center gap-3">
            <a href="#/dashboard" class="btn-ghost px-4 py-2 font-headline font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">arrow_back</span> TOURNAMENT COMMAND
            </a>
            <span class="text-outline font-headline">/</span>
            <span class="font-headline font-bold text-sm text-primary uppercase">${match.phase} DAY ${match.day} GAME ${match.game}</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-status-live pulse-live rounded-none"></span>
            <span class="font-headline font-bold text-xs text-white tracking-widest uppercase">MATCH RESULT TELEMETRY</span>
          </div>
        </div>

        <!-- Match Hero Summary Header (Stitch Match Result Detail style) -->
        <div class="hud-card p-6 md:p-8 border border-outline-variant bg-[#1A1A1C] relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div class="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity pointer-events-none" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuAnsQ26AqNTUGvuTo_luoujTihS-j2wdGZrzUCnOgLuaiZ4iBihdS_QOTMa82ow_hcq81eMtIcc5aLB5W4n0NKLMtSLB2lOiXkm1sNPgrKhnAkVtA_IHVN51Gynjl0YITrRg82dYwVj8dKWr3VYrrQnjqD-z2iarMKlc6emqwn38-3BPjyPHHK0WM8mEKe-mC39uaZetzEHOaFII5QhF2PA2EJdI-yGPXzAVl-ib2Vj3MJMYSCIAg')"></div>
          
          <div class="relative z-10">
            <div class="font-headline font-bold text-xs text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">sports_esports</span> OFFICIAL MATCH RECAP
            </div>
            <h1 class="font-headline font-bold text-3xl md:text-5xl text-white uppercase tracking-tight">
              ${match.phase.toUpperCase()} — DAY ${match.day} GAME ${match.game}
            </h1>
            <p class="font-body text-xs text-outline mt-1">MAP: ERANGEL · 16 TEAMS · ${totalKills} TOTAL ELIMINATIONS</p>
          </div>

          <div class="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
            ${match.winner ? `
              <div class="hud-card bg-[#0E0E0F] p-3 border border-primary/40 text-center min-w-[130px]">
                <div class="font-label text-[9px] font-bold text-status-success uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                  <span class="material-symbols-outlined text-xs">emoji_events</span> WWCD WINNER
                </div>
                <div class="flex items-center justify-center gap-2 mt-1">
                  ${renderTeamLogoBadge(match.winner.teamName, 'w-6 h-6', 'border border-primary')}
                  <span class="font-headline font-bold text-white text-sm uppercase truncate">${match.winner.teamName}</span>
                </div>
              </div>
            ` : ''}

            <div class="hud-card bg-[#0E0E0F] p-3 text-center border border-outline-variant min-w-[110px]">
              <div class="font-label text-[9px] font-bold text-outline uppercase tracking-wider mb-1">MATCH KILLS</div>
              <div class="font-headline font-bold text-primary text-2xl">${totalKills}</div>
            </div>

            ${match.topKiller ? `
              <div class="hud-card bg-[#0E0E0F] p-3 text-center border border-outline-variant min-w-[120px] col-span-2 sm:col-span-1">
                <div class="font-label text-[9px] font-bold text-outline uppercase tracking-wider mb-1">TOP FRAGGER</div>
                <div class="font-headline font-bold text-white text-sm uppercase truncate">${match.topKiller.playerName} (${match.topKiller.eliminations}K)</div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Main Content Canvas (8 cols Team Accordion + 4 cols Prediction Widget) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- Left Column (8 / 12 Cols): Interactive Expandable Team Standings -->
          <div class="lg:col-span-8 flex flex-col gap-3">
            
            <div class="flex justify-between items-center px-1">
              <h2 class="font-headline font-bold text-xl text-white uppercase tracking-wider flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">format_list_numbered</span> TEAM STANDINGS & PLAYER ROSTERS
              </h2>
              <span class="font-label text-xs text-outline uppercase">Click any team to inspect operatives</span>
            </div>

            <!-- Table Header -->
            <div class="grid grid-cols-[50px_1fr_70px_80px_100px_40px] gap-2 px-4 py-2.5 bg-[#0E0E0F] border border-outline-variant font-headline font-bold text-xs text-outline uppercase tracking-wider">
              <div class="text-center">RANK</div>
              <div>TEAM</div>
              <div class="text-right">KILLS</div>
              <div class="text-right">PLACE PTS</div>
              <div class="text-right text-primary">MATCH PTS</div>
              <div></div>
            </div>

            <!-- Team Rows with Accordions -->
            <div class="flex flex-col gap-2.5">
              ${sortedTeams.map(t => {
                const rank = t.rank;
                const isTop3 = rank <= 3;
                const isExpanded = String(t.teamId) === String(expandedTeamId);

                const glowStyles = {
                  1: 'border-primary shadow-[inset_0_0_10px_rgba(255,107,0,0.4)]',
                  2: 'border-[#2E2E32] shadow-[inset_0_0_10px_rgba(255,107,0,0.25)]',
                  3: 'border-[#2E2E32] shadow-[inset_0_0_10px_rgba(255,107,0,0.15)]',
                };

                return `
                  <div class="hud-card border transition-all overflow-hidden ${isTop3 ? (glowStyles[rank] || 'border-outline-variant') : 'border-outline-variant'} bg-[#1A1A1C]">
                    
                    <!-- Team Summary Header (Clickable Accordion Trigger) -->
                    <div class="team-accordion-header p-3.5 grid grid-cols-[50px_1fr_70px_80px_100px_40px] gap-2 items-center cursor-pointer hover:bg-surface-container-high transition-colors select-none ${isExpanded ? 'bg-primary/5 border-b border-outline-variant/60' : ''}" data-team-id="${t.teamId}">
                      <div class="font-headline font-bold text-lg text-center" style="color:${placementColor(rank)}">
                        ${rank}
                      </div>

                      <div class="flex items-center gap-3 min-w-0">
                        ${renderTeamLogoBadge(t.teamName, 'w-8 h-8', isTop3 ? 'border-2 border-primary' : 'border border-outline-variant')}
                        <div class="min-w-0">
                          <span class="font-headline font-bold text-base text-white uppercase truncate block">${t.teamName}</span>
                          ${rank === 1 ? `<span class="font-label text-[9px] text-status-success font-bold uppercase tracking-wider">WWCD 1ST PLACE</span>` : ''}
                        </div>
                      </div>

                      <div class="font-headline font-bold text-white text-right text-base">${t.totalKills}</div>
                      <div class="font-headline font-bold text-outline text-right text-sm">+${t.placePts}</div>
                      <div class="font-headline font-bold text-primary text-right text-xl">${t.totalMatchPts} PTS</div>

                      <div class="text-right text-outline">
                        <span class="material-symbols-outlined text-lg transition-transform duration-200 ${isExpanded ? 'rotate-180 text-primary' : ''}">expand_more</span>
                      </div>
                    </div>

                    <!-- Expanded Player Performance Roster Table -->
                    ${isExpanded ? `
                      <div class="p-4 bg-[#0E0E0F] flex flex-col gap-3 animate-fadeIn">
                        <div class="font-headline font-bold text-xs text-primary uppercase tracking-widest flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-sm">groups</span> ${t.teamName} OPERATIVE PERFORMANCE
                        </div>

                        <div class="overflow-x-auto">
                          <table class="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr class="border-b border-outline-variant/60 text-outline font-headline font-bold tracking-wider text-[10px] uppercase">
                                <th class="py-2 px-3">OPERATIVE</th>
                                <th class="py-2 px-3 text-right">KILLS</th>
                                <th class="py-2 px-3 text-right">KNOCKOUTS (KP)</th>
                                <th class="py-2 px-3 text-right">DAMAGE</th>
                                <th class="py-2 px-3 text-right">SURVIVAL</th>
                                <th class="py-2 px-3 text-right">HEADSHOTS</th>
                                <th class="py-2 px-3 text-right text-primary">POWER</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${t.players.map(p => `
                                <tr class="border-b border-outline-variant/30 hover:bg-[#1A1A1C] transition-colors cursor-pointer" onclick="window.location.hash='/player/${p.uId}'">
                                  <td class="py-2.5 px-3 font-headline font-bold text-white uppercase flex items-center gap-2">
                                    <span class="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                    <span>${p.playerName}</span>
                                  </td>
                                  <td class="py-2.5 px-3 text-right font-headline font-bold text-white text-sm">${p.eliminations}</td>
                                  <td class="py-2.5 px-3 text-right font-headline font-bold text-outline">${p.knockdowns}</td>
                                  <td class="py-2.5 px-3 text-right font-headline text-white">${fmt(p.damage)}</td>
                                  <td class="py-2.5 px-3 text-right font-label text-outline">${fmtTime(p.survivalTime)}</td>
                                  <td class="py-2.5 px-3 text-right font-headline text-outline">${p.headShots}</td>
                                  <td class="py-2.5 px-3 text-right font-headline font-bold text-primary text-sm">${fmtPower(p.power)}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ` : ''}

                  </div>
                `;
              }).join('')}
            </div>

          </div>

          <!-- Right Column (4 / 12 Cols): Match Prediction Payout Widget -->
          <div class="lg:col-span-4 hud-card border border-outline-variant bg-[#1A1A1C] p-5 flex flex-col gap-5 sticky top-[80px]">
            
            <div class="flex items-center justify-between border-b border-outline-variant pb-3">
              <span class="font-headline font-bold text-xs text-primary uppercase tracking-widest flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">troubleshoot</span> MATCH PREDICTION
              </span>
              <span class="font-label text-[10px] text-outline uppercase">${match.phase}</span>
            </div>

            ${userPred ? `
              <div class="flex items-center gap-4 bg-[#0E0E0F] p-3.5 border border-outline-variant">
                ${renderTeamLogoBadge(userPred.predictedTeamName, 'w-12 h-12', 'border-2 border-primary')}
                <div>
                  <div class="font-label text-[9px] text-outline uppercase">PICKED WINNER</div>
                  <div class="font-headline font-bold text-xl text-white uppercase">${userPred.predictedTeamName}</div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="hud-card p-3 text-center bg-[#0E0E0F]">
                  <div class="font-label text-[9px] text-outline uppercase mb-1">ACTUAL FINISH</div>
                  <div class="font-headline font-bold text-xl text-white" style="color:${placementColor(userPred.actualPlacement)}">${ordinal(userPred.actualPlacement)}</div>
                </div>
                <div class="hud-card p-3 text-center bg-[#0E0E0F]">
                  <div class="font-label text-[9px] text-outline uppercase mb-1">POINTS EARNED</div>
                  <div class="font-headline font-bold text-2xl text-primary">+${userPred.points ?? 0}</div>
                </div>
              </div>
            ` : `
              <div class="p-4 border border-dashed border-outline-variant text-center bg-[#0E0E0F]">
                <div class="font-headline font-bold text-sm text-white uppercase mb-1">NO PREDICTION SUBMITTED</div>
                <div class="font-label text-xs text-outline mb-3">Lock in your pick for this match</div>
                <a href="#/predictions" class="btn-primary inline-flex px-4 py-2 font-headline font-bold text-xs uppercase">MAKE PREDICTION</a>
              </div>
            `}

            <!-- Decay Scale -->
            <div class="border-t border-outline-variant pt-4">
              <div class="font-headline font-bold text-[11px] text-outline uppercase tracking-wider mb-2">PREDICTION REWARD SCALE</div>
              <div class="grid grid-cols-5 gap-1 text-center font-label text-[10px]">
                <div class="p-1.5 border border-outline-variant bg-primary/10 text-primary font-bold">1st: 10p</div>
                <div class="p-1.5 border border-outline-variant text-outline">2nd: 8p</div>
                <div class="p-1.5 border border-outline-variant text-outline">3rd: 5p</div>
                <div class="p-1.5 border border-outline-variant text-outline">4th: 3p</div>
                <div class="p-1.5 border border-outline-variant text-outline">5th: 1p</div>
              </div>
            </div>

            <a href="#/predictions" class="btn-primary w-full py-3 text-center font-headline font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-base">how_to_vote</span> GO TO PREDICTIONS DOCK
            </a>

          </div>

        </div>

      </div>
    `);

    // Accordion click handlers
    document.querySelectorAll('.team-accordion-header').forEach(header => {
      header.onclick = () => {
        const teamId = header.dataset.teamId;
        expandedTeamId = String(expandedTeamId) === String(teamId) ? null : teamId;
        renderContent();
      };
    });
  }

  renderContent();
}
