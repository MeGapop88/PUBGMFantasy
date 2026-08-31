/**
 * TEAMS PAGE — participant introduction & roster browsing
 * Grid of all participating teams (/teams) and a per-team roster profile
 * (/team/:id). Team/player entries are roster-seeded, so every team and
 * player appears — with all-zero stats — even before any games are played.
 */
import { renderPage, setActiveNav, fmt, fmtPower } from '../ui.js';
import { getSession } from '../state.js';
import { renderTeamLogoBadge } from '../data/teamLogos.js';

export function renderTeams(store, router, params = {}) {
  setActiveNav('teams');
  const session = getSession();
  if (!session) { router.navigate('/login'); return; }

  const { teams: teamRegistry, players: playerRegistry } = store;
  const allTeams = Object.values(teamRegistry).sort((a, b) => a.teamName.localeCompare(b.teamName));

  if (!allTeams.length) {
    renderPage(`
      <div class="container mx-auto py-12">
        <div class="hud-card p-12 text-center border border-outline-variant max-w-xl mx-auto">
          <span class="material-symbols-outlined text-5xl text-outline mb-4">folder_off</span>
          <h2 class="font-headline font-bold text-2xl uppercase tracking-wider text-on-surface">NO TEAM ROSTER DATA</h2>
        </div>
      </div>
    `);
    return;
  }

  if (params.id) {
    const team = allTeams.find(t => String(t.teamId) === String(params.id));
    if (team) {
      renderTeamProfile(team, playerRegistry, router);
      return;
    }
  }

  renderPage(`
    <div class="flex flex-col gap-6 pb-12">

      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-6">
        <div>
          <div class="font-headline font-bold text-xs text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
            <span class="material-symbols-outlined text-base">shield</span> TOURNAMENT PARTICIPANTS
          </div>
          <h1 class="font-headline font-bold text-3xl md:text-4xl text-white uppercase tracking-tight">COMPETING TEAMS</h1>
        </div>
        <div class="font-label text-xs text-outline bg-[#1A1A1C] p-3 border border-outline-variant">
          <span>${allTeams.length} TEAMS</span>
        </div>
      </div>

      <!-- Team Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        ${allTeams.map(t => `
          <div class="team-card hud-card p-4 border border-outline-variant hover:border-primary transition-all cursor-pointer bg-[#1A1A1C] group flex flex-col justify-between" data-team-id="${t.teamId}">
            <div>
              <div class="flex items-center gap-3 mb-4">
                ${renderTeamLogoBadge(t.teamName, 'w-12 h-12', 'border border-primary/50 group-hover:scale-105 transition-transform')}
                <div class="min-w-0">
                  <div class="font-headline font-bold text-lg text-white uppercase truncate group-hover:text-primary transition-colors">${t.teamName}</div>
                  <div class="font-label text-xs text-outline uppercase">${t.matchesPlayed} MATCHES</div>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-1 bg-[#0E0E0F] p-2.5 border border-outline-variant/60 text-center mb-3">
                <div>
                  <div class="font-headline font-bold text-primary text-base">${t.wins}</div>
                  <div class="font-label text-[8px] text-outline uppercase">WWCD</div>
                </div>
                <div>
                  <div class="font-headline font-bold text-white text-base">${t.totalKills}</div>
                  <div class="font-label text-[8px] text-outline uppercase">KILLS</div>
                </div>
                <div>
                  <div class="font-headline font-bold text-white text-base">${t.totalPoints}</div>
                  <div class="font-label text-[8px] text-outline uppercase">PTS</div>
                </div>
              </div>
            </div>

            <div class="flex justify-between items-center text-xs pt-2 border-t border-outline-variant/40 text-outline">
              <span>${fmt(t.totalDamage)} TOTAL DMG</span>
              <span class="text-primary font-headline font-bold uppercase group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                ROSTER <span class="material-symbols-outlined text-sm">chevron_right</span>
              </span>
            </div>
          </div>
        `).join('')}
      </div>

    </div>
  `);

  document.querySelectorAll('.team-card').forEach(card => {
    card.onclick = () => {
      router.navigate(`/team/${card.dataset.teamId}`);
    };
  });
}

function renderTeamProfile(team, playerRegistry, router) {
  const roster = Object.values(playerRegistry)
    .filter(p => String(p.teamId) === String(team.teamId))
    .sort((a, b) => b.avgPower - a.avgPower);

  renderPage(`
    <div class="flex flex-col gap-6 pb-12">

      <!-- Back Button -->
      <div>
        <button id="back-btn" class="btn-ghost px-4 py-2 font-headline font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2">
          <span class="material-symbols-outlined text-base">arrow_back</span> BACK TO TEAMS
        </button>
      </div>

      <!-- Team Header Card -->
      <div class="hud-card p-6 md:p-8 border border-outline-variant bg-[#1A1A1C] relative overflow-hidden flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div class="flex items-center gap-5">
          ${renderTeamLogoBadge(team.teamName, 'w-20 h-20', 'border-2 border-primary')}
          <div>
            <div class="font-headline font-bold text-3xl md:text-4xl text-white uppercase tracking-tight">${team.teamName}</div>
            <div class="font-label text-xs text-outline uppercase mt-1">${roster.length} ROSTERED OPERATIVES</div>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
          <div class="hud-card p-3 text-center bg-[#0E0E0F] min-w-[100px]">
            <div class="font-headline font-bold text-primary text-xl">${team.wins}</div>
            <div class="font-label text-[9px] text-outline uppercase">WWCD WINS</div>
          </div>
          <div class="hud-card p-3 text-center bg-[#0E0E0F] min-w-[100px]">
            <div class="font-headline font-bold text-white text-xl">${team.totalKills}</div>
            <div class="font-label text-[9px] text-outline uppercase">TOTAL KILLS</div>
          </div>
          <div class="hud-card p-3 text-center bg-[#0E0E0F] min-w-[100px]">
            <div class="font-headline font-bold text-white text-xl">${fmt(team.avgPlacement, 1)}</div>
            <div class="font-label text-[9px] text-outline uppercase">AVG PLACEMENT</div>
          </div>
          <div class="hud-card p-3 text-center bg-[#0E0E0F] min-w-[100px]">
            <div class="font-headline font-bold text-white text-xl">${team.matchesPlayed}</div>
            <div class="font-label text-[9px] text-outline uppercase">MATCHES</div>
          </div>
        </div>
      </div>

      <!-- Roster Grid -->
      <div class="flex flex-col gap-4">
        <h2 class="font-headline font-bold text-xl text-white uppercase tracking-wider flex items-center gap-2">
          <span class="material-symbols-outlined text-primary">badge</span> TEAM ROSTER
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="roster-grid">
          ${roster.map(p => `
            <div class="player-card hud-card p-4 border border-outline-variant hover:border-primary transition-all cursor-pointer bg-[#1A1A1C] group flex flex-col justify-between" data-uid="${p.uId}">
              <div>
                <div class="font-headline font-bold text-lg text-white uppercase truncate group-hover:text-primary transition-colors mb-3">${p.playerName}</div>
                <div class="grid grid-cols-3 gap-1 bg-[#0E0E0F] p-2.5 border border-outline-variant/60 text-center mb-3">
                  <div>
                    <div class="font-headline font-bold text-primary text-base">${fmtPower(p.avgPower)}</div>
                    <div class="font-label text-[8px] text-outline uppercase">POWER</div>
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
          `).join('') || `<div class="col-span-full text-center py-12 font-label text-outline uppercase">No rostered operatives.</div>`}
        </div>
      </div>

    </div>
  `);

  document.getElementById('back-btn').onclick = () => router.navigate('/teams');
  document.querySelectorAll('#roster-grid .player-card').forEach(card => {
    card.onclick = () => router.navigate(`/player/${card.dataset.uid}`);
  });
}
