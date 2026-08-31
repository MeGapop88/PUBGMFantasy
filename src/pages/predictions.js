/**
 * PREDICTIONS PAGE
 * Day-gated Tactical Prediction interface: exactly one tournament day is
 * open for picks at a time (per its opensAt/locksAt window from the
 * schedule), matches from prior days are locked/resolved, and future days
 * are shown as upcoming until the previous day locks.
 * Points Scale: 1st=10, 2nd=8, 3rd=5, 4th=3, 5th=1, 6th+=0
 */
import { renderPage, setActiveNav, toast, fmt, ordinal, placementColor } from '../ui.js';
import {
  getUserPredictions,
  submitPrediction,
  scorePredictions,
  getSession,
} from '../state.js';
import { renderTeamLogoBadge } from '../data/teamLogos.js';
import { getDayStatus, getMatchStatus } from '../data/schedule.js';

const PLACEMENT_PTS = { 1: 10, 2: 8, 3: 5, 4: 3, 5: 1 };

const DAY_STATUS_ICON = {
  UPCOMING: 'lock_clock',
  OPEN: 'radio_button_checked',
  LOCKED: 'lock',
};

export function renderPredictions(store, router) {
  setActiveNav('predictions');
  const session = getSession();
  if (!session) { router.navigate('/login'); return; }

  const { matches, schedule } = store;

  if (!matches.length || !schedule.days.length) {
    renderPage(`<div class="container mx-auto py-12"><div class="hud-card p-12 text-center border border-outline-variant max-w-xl mx-auto"><span class="material-symbols-outlined text-5xl text-outline mb-4">folder_off</span><h2 class="font-headline font-bold text-2xl uppercase tracking-wider text-on-surface">NO MATCH SCHEDULE</h2></div></div>`);
    return;
  }

  const matchById = Object.fromEntries(matches.map(m => [m.id, m]));

  // Default to the first OPEN day; else the first UPCOMING day; else the last day.
  const now = new Date();
  const openDay = schedule.days.find(d => getDayStatus(d, now) === 'OPEN');
  const upcomingDay = schedule.days.find(d => getDayStatus(d, now) === 'UPCOMING');
  let selectedDayKey = dayKey(openDay || upcomingDay || schedule.days[schedule.days.length - 1]);
  let selectedMatchId = null;
  let selectedTeamId = null;

  function currentDay() {
    return schedule.days.find(d => dayKey(d) === selectedDayKey);
  }

  function renderContent() {
    const day = currentDay();
    const dayStatus = getDayStatus(day, new Date());
    const dayMatches = day.matchIds.map(id => matchById[id]).filter(Boolean);

    scorePredictions(matches);
    const predictions = getUserPredictions();

    if (!selectedMatchId || !dayMatches.some(m => m.id === selectedMatchId)) {
      selectedMatchId = dayMatches[0]?.id ?? null;
    }
    const currentMatch = dayMatches.find(m => m.id === selectedMatchId) || dayMatches[0];
    const currentPred = currentMatch ? predictions[currentMatch.id] : null;
    const matchStatus = currentMatch ? getMatchStatus(currentMatch, day, new Date()) : 'UPCOMING';

    if (currentMatch && (!selectedTeamId || !currentMatch.teams.some(t => String(t.teamId) === String(selectedTeamId)))) {
      selectedTeamId = currentPred?.predictedTeamId || currentMatch.winner?.teamId || currentMatch.teams[0]?.teamId || null;
    }

    const activeTeam = currentMatch ? (currentMatch.teams.find(t => String(t.teamId) === String(selectedTeamId)) || currentMatch.teams[0]) : null;
    const isPicked = currentPred && activeTeam && String(currentPred.predictedTeamId) === String(activeTeam.teamId);

    const userTotal = Object.values(predictions).reduce((s, p) => s + (p.points ?? 0), 0);
    const predictedCount = Object.keys(predictions).length;
    const perfectPicks = Object.values(predictions).filter(p => p.points === 10).length;

    renderPage(`
      <div class="flex flex-col gap-6 pb-12">

        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-6">
          <div>
            <div class="font-headline font-bold text-xs text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
              <span class="material-symbols-outlined text-base">target</span> MATCH PREDICTIONS PROTOCOL
            </div>
            <h1 class="font-headline font-bold text-3xl md:text-4xl text-white uppercase tracking-tight">TACTICAL PREDICTOR</h1>
          </div>

          <!-- Performance Bar -->
          <div class="grid grid-cols-3 gap-3 bg-[#1A1A1C] p-3 border border-outline-variant">
            <div class="text-center px-3 border-r border-outline-variant">
              <div class="font-headline font-bold text-primary text-xl">${fmt(userTotal)}</div>
              <div class="font-label text-[9px] text-outline uppercase tracking-widest">TOTAL PTS</div>
            </div>
            <div class="text-center px-3 border-r border-outline-variant">
              <div class="font-headline font-bold text-white text-xl">${predictedCount}/${matches.length}</div>
              <div class="font-label text-[9px] text-outline uppercase tracking-widest">PICKS MADE</div>
            </div>
            <div class="text-center px-3">
              <div class="font-headline font-bold text-status-success text-xl">${perfectPicks}</div>
              <div class="font-label text-[9px] text-outline uppercase tracking-widest">PERFECT 10s</div>
            </div>
          </div>
        </div>

        <!-- Day Tab Bar -->
        <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-none" id="day-tab-bar">
          ${schedule.days.map(d => {
            const status = getDayStatus(d, now);
            const isSelected = dayKey(d) === selectedDayKey;
            return `
              <button class="day-tab-btn px-4 py-2.5 shrink-0 hud-card text-left transition-all border ${isSelected ? 'border-primary bg-primary/10' : 'border-outline-variant hover:border-outline'}" data-day-key="${dayKey(d)}">
                <div class="flex items-center justify-between gap-3 mb-1">
                  <span class="font-headline font-bold text-xs text-white uppercase">${d.label}</span>
                  <span class="material-symbols-outlined text-xs ${status === 'OPEN' ? 'text-status-success' : 'text-outline'}">${DAY_STATUS_ICON[status]}</span>
                </div>
                <div class="font-label text-[10px] text-outline uppercase">${status}</div>
              </button>
            `;
          }).join('')}
        </div>

        ${!currentMatch ? `
          <div class="hud-card p-8 text-center border border-outline-variant bg-[#1A1A1C]">
            <div class="font-headline font-bold text-sm text-white uppercase">NO MATCHES CONFIGURED FOR THIS DAY</div>
          </div>
        ` : `

        <!-- Match Select Selector Carousel -->
        <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-none" id="match-selector-bar">
          ${dayMatches.map(m => {
            const pred = predictions[m.id];
            const isSelected = m.id === currentMatch.id;
            return `
              <button class="match-select-btn px-4 py-2.5 shrink-0 hud-card text-left transition-all border ${isSelected ? 'border-primary bg-primary/10' : 'border-outline-variant hover:border-outline'}" data-match-id="${m.id}">
                <div class="flex items-center justify-between gap-3 mb-1">
                  <span class="font-headline font-bold text-xs text-white uppercase">${m.phase} D${m.day} G${m.game}</span>
                  ${pred ? `<span class="material-symbols-outlined text-xs text-primary">check_circle</span>` : `<span class="w-1.5 h-1.5 bg-outline rounded-full"></span>`}
                </div>
                <div class="font-label text-[10px] text-outline uppercase">${m.hasResults ? `WINNER: ${m.winner?.teamName ?? '—'}` : 'NOT YET PLAYED'}</div>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Dual Pane Predictor Canvas -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          <!-- Left Pane: Teams List -->
          <div class="lg:col-span-5 hud-card border border-outline-variant bg-[#1A1A1C] relative overflow-hidden flex flex-col">
            <div class="p-4 border-b border-outline-variant bg-[#131314] flex justify-between items-center">
              <h2 class="font-headline font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-lg">groups</span> PARTICIPATING TEAMS
              </h2>
              <span class="font-label text-[10px] text-outline uppercase tracking-widest">${currentMatch.teams.length} TEAMS</span>
            </div>

            <div class="p-3 flex flex-col gap-2 max-h-[600px] overflow-y-auto" id="team-list">
              ${currentMatch.hasResults ? [...currentMatch.teams].sort((a,b) => a.rank - b.rank).map(team => renderTeamRow(team, activeTeam, currentPred)).join('')
                : currentMatch.teams.map(team => renderTeamRow(team, activeTeam, currentPred)).join('') || `<div class="p-6 text-center font-label text-outline uppercase text-xs">No team list available yet for this match.</div>`}
            </div>
          </div>

          <!-- Right Pane: Active Team Telemetry & Pick Panel -->
          <div class="lg:col-span-7 flex flex-col gap-6">

            <div class="hud-card border border-outline-variant bg-[#1A1A1C] p-6 md:p-8 relative overflow-hidden">
              ${activeTeam ? `
              <div class="flex justify-between items-start mb-6">
                <div>
                  <div class="flex items-center gap-3 mb-1">
                    <h2 class="font-headline font-bold text-3xl md:text-4xl text-white uppercase tracking-tight">${activeTeam.teamName}</h2>
                    ${activeTeam.rank === 1 ? `
                      <span class="bg-status-success/20 border border-status-success/40 text-status-success font-headline font-bold text-xs px-2.5 py-1 uppercase tracking-wider flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">emoji_events</span> 1ST PLACE WINNER
                      </span>
                    ` : ''}
                  </div>
                  <p class="font-body text-xs text-outline">Telemetry performance card for Game ${currentMatch.game} (${currentMatch.phase})</p>
                </div>

                ${renderTeamLogoBadge(activeTeam.teamName, 'w-16 h-16', 'border-2 border-primary')}
              </div>

              <!-- Bento Stats Grid -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div class="hud-card p-3 text-center bg-[#0E0E0F]">
                  <div class="font-label text-[10px] font-bold text-outline uppercase tracking-wider mb-1">ACTUAL FINISH</div>
                  <div class="font-headline font-bold text-2xl" style="color:${currentMatch.hasResults ? placementColor(activeTeam.rank) : '#a98a7d'}">${currentMatch.hasResults ? ordinal(activeTeam.rank) : '—'}</div>
                </div>
                <div class="hud-card p-3 text-center bg-[#0E0E0F]">
                  <div class="font-label text-[10px] font-bold text-outline uppercase tracking-wider mb-1">TOTAL KILLS</div>
                  <div class="font-headline font-bold text-white text-2xl">${activeTeam.totalKills ?? 0}</div>
                </div>
                <div class="hud-card p-3 text-center bg-[#0E0E0F]">
                  <div class="font-label text-[10px] font-bold text-outline uppercase tracking-wider mb-1">TOTAL DAMAGE</div>
                  <div class="font-headline font-bold text-white text-2xl">${fmt(activeTeam.totalDamage ?? 0)}</div>
                </div>
                <div class="hud-card p-3 text-center bg-[#0E0E0F]">
                  <div class="font-label text-[10px] font-bold text-outline uppercase tracking-wider mb-1">PAYOUT VALUE</div>
                  <div class="font-headline font-bold text-primary text-2xl">${currentMatch.hasResults ? (PLACEMENT_PTS[activeTeam.rank] ?? 0) : '?'} PTS</div>
                </div>
              </div>

              <!-- Points Decay Curve Reference -->
              <div class="p-4 border border-outline-variant bg-[#131314] mb-6">
                <div class="font-headline font-bold text-xs text-outline uppercase tracking-widest mb-3 flex items-center justify-between">
                  <span>DECAY SCORING CURVE</span>
                  <span class="text-primary font-bold">1ST PLACE = 10 PTS</span>
                </div>
                <div class="grid grid-cols-5 gap-2 text-center font-label text-xs">
                  <div class="p-2 border border-outline-variant ${activeTeam.rank===1?'bg-primary/20 border-primary text-primary font-bold':''}">1st: 10pt</div>
                  <div class="p-2 border border-outline-variant ${activeTeam.rank===2?'bg-primary/20 border-primary text-primary font-bold':''}">2nd: 8pt</div>
                  <div class="p-2 border border-outline-variant ${activeTeam.rank===3?'bg-primary/20 border-primary text-primary font-bold':''}">3rd: 5pt</div>
                  <div class="p-2 border border-outline-variant ${activeTeam.rank===4?'bg-primary/20 border-primary text-primary font-bold':''}">4th: 3pt</div>
                  <div class="p-2 border border-outline-variant ${activeTeam.rank===5?'bg-primary/20 border-primary text-primary font-bold':''}">5th: 1pt</div>
                </div>
              </div>

              <!-- Action Button -->
              ${renderActionButton(matchStatus, activeTeam, currentPred, isPicked)}
              ` : `<div class="text-center py-12 font-label text-outline uppercase text-xs">No teams configured for this match yet.</div>`}
            </div>

          </div>

        </div>
        `}

      </div>
    `);

    // Handlers
    document.querySelectorAll('.day-tab-btn').forEach(btn => {
      btn.onclick = () => {
        selectedDayKey = btn.dataset.dayKey;
        selectedMatchId = null;
        selectedTeamId = null;
        renderContent();
      };
    });

    document.querySelectorAll('.match-select-btn').forEach(btn => {
      btn.onclick = () => {
        selectedMatchId = btn.dataset.matchId;
        selectedTeamId = null;
        renderContent();
      };
    });

    document.querySelectorAll('.team-select-btn').forEach(btn => {
      btn.onclick = () => {
        selectedTeamId = btn.dataset.teamId;
        renderContent();
      };
    });

    const confirmBtn = document.getElementById('confirm-pick-btn');
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        try {
          submitPrediction(currentMatch.id, activeTeam.teamId, activeTeam.teamName, { isOpen: matchStatus === 'OPEN' });
          scorePredictions(store.matches);
          toast(`Prediction confirmed: ${activeTeam.teamName}`, 'success');
          renderContent();
        } catch (err) {
          toast(err.message, 'error');
        }
      };
    }
  }

  renderContent();
}

function dayKey(d) {
  return `${d.phase}_D${d.day}`;
}

function renderTeamRow(team, activeTeam, currentPred) {
  const isSelected = activeTeam && String(team.teamId) === String(activeTeam.teamId);
  const isWinner = team.rank === 1;
  const isUserPick = currentPred && String(currentPred.predictedTeamId) === String(team.teamId);

  return `
    <button class="team-select-btn p-3 border transition-all flex items-center gap-4 text-left relative group ${isSelected ? 'border-primary bg-primary/10' : 'border-outline-variant hover:border-outline bg-[#0E0E0F]'}" data-team-id="${team.teamId}">
      ${renderTeamLogoBadge(team.teamName, 'w-10 h-10', isSelected ? 'border-2 border-primary' : 'border border-outline-variant')}

      <div class="flex-1 min-w-0">
        <div class="font-headline font-bold text-base text-white truncate flex items-center gap-2 uppercase">
          ${team.teamName}
          ${isWinner ? `<span class="material-symbols-outlined text-status-success text-sm">emoji_events</span>` : ''}
        </div>
        <div class="font-label text-xs text-outline flex items-center gap-3 mt-0.5">
          <span>FINISH: <strong style="color:${placementColor(team.rank)}">${team.rank ? ordinal(team.rank) : '—'}</strong></span>
          <span>KILLS: ${team.totalKills ?? 0}</span>
        </div>
      </div>

      <div class="flex flex-col items-end gap-1">
        ${isUserPick ? `
          <span class="bg-primary text-black font-headline font-bold text-[10px] px-2 py-0.5 uppercase tracking-wider">YOUR PICK</span>
        ` : ''}
        <span class="font-headline font-bold text-xs text-outline">${PLACEMENT_PTS[team.rank] ?? 0} PTS</span>
      </div>
    </button>
  `;
}

function renderActionButton(matchStatus, activeTeam, currentPred, isPicked) {
  if (matchStatus === 'UPCOMING') {
    return `
      <div class="w-full py-4 font-headline font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 border border-outline-variant text-outline bg-[#0E0E0F]">
        <span class="material-symbols-outlined text-xl">lock_clock</span> OPENS AFTER THE PREVIOUS DAY LOCKS
      </div>
    `;
  }
  if (matchStatus === 'LOCKED_PENDING_RESULTS') {
    return `
      <div class="w-full py-4 font-headline font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 border border-outline-variant text-outline bg-[#0E0E0F]">
        <span class="material-symbols-outlined text-xl">lock</span> PREDICTIONS LOCKED — AWAITING RESULTS
      </div>
    `;
  }
  if (matchStatus === 'RESOLVED') {
    if (currentPred) {
      return `
        <div class="w-full py-4 font-headline font-bold text-lg uppercase tracking-widest flex items-center justify-center gap-2 border border-outline-variant text-white bg-[#0E0E0F]">
          <span class="material-symbols-outlined text-xl">how_to_vote</span>
          PICK CONFIRMED FOR ${currentPred.predictedTeamName} (${currentPred.points ?? 0} PTS)
        </div>
      `;
    }
    return `
      <div class="w-full py-4 font-headline font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 border border-outline-variant text-outline bg-[#0E0E0F]">
        <span class="material-symbols-outlined text-xl">block</span> NO PICK SUBMITTED — MATCH RESOLVED
      </div>
    `;
  }
  // OPEN
  return `
    <button id="confirm-pick-btn" class="btn-primary w-full py-4 font-headline font-bold text-lg uppercase tracking-widest flex items-center justify-center gap-2">
      <span class="material-symbols-outlined text-xl">how_to_vote</span>
      ${isPicked ? `PICK CONFIRMED FOR ${activeTeam.teamName}` : `LOCK IN PREDICTION FOR ${activeTeam.teamName}`}
    </button>
  `;
}
