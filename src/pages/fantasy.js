/**
 * FANTASY DRAFT & ACTIVE SQUAD PAGE
 * Designed to match Stitch "Fantasy Draft (Desktop)" & "My Team - Active (Desktop)"
 * Team Logo Integration
 */
import { renderPage, setActiveNav, toast, fmt, fmtMvp, fmtTime, getInitials } from '../ui.js';
import { getMyFantasyTeam, saveFantasyTeam, getSession } from '../state.js';
import { renderTeamLogoBadge } from '../data/teamLogos.js';

export function renderFantasy(store, router) {
  setActiveNav('fantasy');
  const session = getSession();
  if (!session) { router.navigate('/login'); return; }

  const { players: playerRegistry, teams: teamRegistry } = store;
  const allPlayers = Object.values(playerRegistry).sort((a, b) => b.totalMvpRate - a.totalMvpRate);

  if (!allPlayers.length) {
    renderPage(`
      <div class="container mx-auto py-12">
        <div class="hud-card p-12 text-center border border-outline-variant max-w-xl mx-auto">
          <span class="material-symbols-outlined text-5xl text-outline mb-4">folder_off</span>
          <h2 class="font-headline font-bold text-2xl uppercase tracking-wider text-on-surface">NO PLAYER TELEMETRY INGESTED</h2>
          <p class="font-label text-sm text-outline">Add match JSON files in public/data/ to unlock Fantasy Squad deployment.</p>
        </div>
      </div>
    `);
    return;
  }

  const existingTeam = getMyFantasyTeam();
  let selectedUIds = existingTeam?.playerUIds ? [...existingTeam.playerUIds] : [];
  let teamName = existingTeam?.teamName || 'SQUADRON ZERO';
  let viewMode = (existingTeam && selectedUIds.length === 4) ? 'ACTIVE' : 'DRAFT'; // 'ACTIVE' | 'DRAFT'

  let teamFilter = 'ALL';
  let searchQuery = '';
  const allTeamNames = [...new Set(allPlayers.map(p => p.teamName))].sort();

  function getTeamCounts() {
    const counts = {};
    selectedUIds.forEach(uid => {
      const p = playerRegistry[uid];
      if (p) counts[p.teamId] = (counts[p.teamId] ?? 0) + 1;
    });
    return counts;
  }

  function renderContent() {
    if (viewMode === 'ACTIVE' && selectedUIds.length === 4) {
      renderActiveSquadView();
    } else {
      renderDraftView();
    }
  }

  /**
   * EXACT STITCH DESIGN: "My Team - Active (Desktop)"
   */
  function renderActiveSquadView() {
    const squadPlayers = selectedUIds.map(uid => playerRegistry[uid]).filter(Boolean);
    const totalMvp = squadPlayers.reduce((s, p) => s + p.totalMvpRate, 0);
    const totalKd  = squadPlayers.reduce((s, p) => s + p.kd, 0);
    const avgKd    = (totalKd / squadPlayers.length).toFixed(2);
    const totalDmg = squadPlayers.reduce((s, p) => s + p.totalDamage, 0);

    const roles = ['IN-GAME LEADER', 'ENTRY FRAGGER', 'SUPPORT', 'FLEX OPERATIVE'];

    renderPage(`
      <div class="flex flex-col gap-8 pb-12">
        
        <!-- Team Header Panel -->
        <section class="hud-card border border-outline-variant bg-[#1A1A1C] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-end justify-between shadow-2xl relative overflow-hidden">
          <div class="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div class="flex flex-col gap-2 relative z-10 mb-4 md:mb-0">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-primary text-3xl">shield</span>
              <h1 class="font-headline font-bold text-3xl md:text-5xl text-white uppercase tracking-tighter">${teamName}</h1>
            </div>
            <p class="font-label text-xs text-primary tracking-[0.2em] font-bold uppercase flex items-center gap-2">
              <span class="w-2 h-2 bg-status-success rounded-full animate-pulse"></span> STATUS: ACTIVE DEPLOYMENT
            </p>
          </div>

          <div class="flex flex-col sm:flex-row items-start sm:items-end gap-6 relative z-10 w-full md:w-auto">
            <div class="flex gap-6 border-l-2 border-outline-variant pl-4">
              <div class="flex flex-col">
                <span class="font-label text-[10px] font-bold text-outline uppercase tracking-wider">TEAM AVG K/D</span>
                <span class="font-headline font-bold text-2xl text-white">${avgKd}</span>
              </div>
              <div class="flex flex-col">
                <span class="font-label text-[10px] font-bold text-outline uppercase tracking-wider">TOTAL DMG</span>
                <span class="font-headline font-bold text-white text-2xl">${fmt(totalDmg)}</span>
              </div>
              <div class="flex flex-col">
                <span class="font-label text-[10px] font-bold text-primary uppercase tracking-wider">TOTAL MVP SCORE</span>
                <span class="font-headline font-bold text-primary text-2xl">${fmtMvp(totalMvp)}</span>
              </div>
            </div>

            <button id="toggle-draft-btn" class="btn-secondary px-6 py-2.5 font-headline font-bold text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(255,107,0,0.2)]">
              <span class="material-symbols-outlined text-base">edit_note</span> MANAGE ROSTER
            </button>
          </div>
        </section>

        <!-- 4 Player Trading Cards Grid -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[580px]">
          ${squadPlayers.map((player, idx) => {
            const role = roles[idx % roles.length];
            const slotNum = String(idx + 1).padStart(2, '0');

            return `
              <article class="hud-card relative border border-outline-variant bg-[#1A1A1C] overflow-hidden group cursor-pointer transition-all duration-300 flex flex-col justify-end min-h-[500px]" onclick="window.location.hash='/player/${player.uId}'">
                
                <div class="absolute inset-0 bg-cover bg-top grayscale group-hover:grayscale-0 transition-all duration-500 opacity-70 group-hover:scale-105"
                  style="background-image: url('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80')">
                </div>

                <div class="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/80 to-transparent z-10"></div>
                <div class="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/40 to-transparent mix-blend-multiply z-10"></div>

                <div class="relative z-20 p-5 flex flex-col gap-4">
                  
                  <div class="flex justify-between items-start">
                    <div>
                      <h2 class="font-headline font-bold text-2xl md:text-3xl text-white uppercase leading-none truncate max-w-[170px]">${player.playerName}</h2>
                      <div class="flex items-center gap-1.5 mt-1.5">
                        <span class="font-label text-[10px] font-bold text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 uppercase tracking-wider">${role}</span>
                      </div>
                      <div class="flex items-center gap-2 mt-2">
                        ${renderTeamLogoBadge(player.teamName, 'w-5 h-5', 'border border-primary/50')}
                        <span class="font-label text-[11px] text-outline uppercase tracking-wider">${player.teamName}</span>
                      </div>
                    </div>

                    <div class="w-8 h-8 rounded-full border border-primary flex items-center justify-center bg-background shrink-0">
                      <span class="font-headline font-bold text-xs text-primary">${slotNum}</span>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2 border-t border-outline-variant/80 pt-3 text-xs">
                    <div class="flex flex-col">
                      <span class="font-label text-[9px] text-outline uppercase">AVG MVP RATE</span>
                      <span class="font-headline font-bold text-primary text-base">${fmtMvp(player.avgMvpRate)}</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-label text-[9px] text-outline uppercase">K/D RATIO</span>
                      <span class="font-headline font-bold text-white text-base">${player.kd.toFixed(2)}</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-label text-[9px] text-outline uppercase">AVG KILLS</span>
                      <span class="font-headline font-bold text-white text-base">${fmt(player.avgEliminations, 1)}</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-label text-[9px] text-outline uppercase">AVG DAMAGE</span>
                      <span class="font-headline font-bold text-white text-base">${fmt(player.avgDamage, 0)}</span>
                    </div>
                  </div>

                </div>

              </article>
            `;
          }).join('')}
        </section>

      </div>
    `);

    const toggleBtn = document.getElementById('toggle-draft-btn');
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        viewMode = 'DRAFT';
        renderContent();
      };
    }
  }

  /**
   * EXACT STITCH DESIGN: "Fantasy Draft (Desktop)"
   */
  function renderDraftView() {
    const teamCounts = getTeamCounts();

    let filtered = allPlayers;
    if (teamFilter !== 'ALL') filtered = filtered.filter(p => p.teamName === teamFilter);
    if (searchQuery) filtered = filtered.filter(p =>
      p.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.teamName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalMvp = selectedUIds.reduce((s, uid) => {
      const p = playerRegistry[uid];
      return s + (p?.totalMvpRate ?? 0);
    }, 0);

    renderPage(`
      <div class="flex flex-col lg:flex-row h-[calc(100vh-5rem)] -mx-4 -my-8 md:-mx-8 overflow-hidden bg-background">
        
        <!-- Left: Player Grid Section -->
        <section class="flex-1 flex flex-col px-4 md:px-8 py-6 h-full overflow-y-auto border-r border-[#2E2E32]">
          
          <!-- Filter Bar -->
          <div class="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 p-4 hud-card bg-[#1A1A1C] border border-[#2E2E32]">
            <div class="relative w-full md:w-96">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
              <input id="player-search" class="w-full bg-[#1A1A1C] text-white pl-10 pr-4 py-2 border-b-2 border-b-[#2E2E32] focus:border-b-primary outline-none font-headline font-bold text-xs uppercase tracking-wider placeholder:text-outline transition-colors" placeholder="SEARCH PLAYERS..." type="text" value="${searchQuery}"/>
            </div>
            
            <div class="flex gap-4 w-full md:w-auto">
              <div class="relative w-full md:w-56">
                <select id="team-select" class="w-full appearance-none bg-[#1A1A1C] text-white px-4 py-2 border-b-2 border-b-[#2E2E32] focus:border-b-primary outline-none font-headline font-bold text-xs uppercase tracking-wider cursor-pointer">
                  <option value="ALL" ${teamFilter === 'ALL' ? 'selected' : ''}>ALL TEAMS (${allTeamNames.length})</option>
                  ${allTeamNames.map(t => `<option value="${t}" ${teamFilter === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
                <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">arrow_drop_down</span>
              </div>
            </div>
          </div>

          <!-- Live Indicator HUD Bar -->
          <div class="flex items-center gap-2 mb-4">
            <div class="w-2 h-2 bg-status-live animate-pulse"></div>
            <span class="font-headline font-bold text-xs text-status-live uppercase tracking-widest">LIVE DRAFT POOL (${filtered.length} AVAILABLE)</span>
            <div class="h-[1px] flex-1 bg-gradient-to-r from-[#2E2E32] to-transparent ml-4"></div>
          </div>

          <!-- Player Cards Grid (With Team Logo Badges) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-20 md:pb-6" id="player-grid">
            ${filtered.map(p => {
              const isSelected = selectedUIds.includes(p.uId);
              const count = teamCounts[p.teamId] ?? 0;
              const wouldExceedCap = !isSelected && count >= 2;
              const wouldExceedMax = !isSelected && selectedUIds.length >= 4;
              const isDisabled = wouldExceedCap || wouldExceedMax;

              return `
                <div class="hud-card flex flex-col relative group cursor-pointer transition-all overflow-hidden h-64 border ${isSelected ? 'border-primary shadow-[0_0_15px_rgba(255,107,0,0.3)]' : isDisabled ? 'opacity-40 border-outline-variant cursor-not-allowed' : 'border-[#2E2E32] hover:border-primary'} bg-[#1A1A1C]" data-uid="${p.uId}">
                  
                  <div class="absolute inset-0 z-0">
                    <div class="w-full h-full bg-cover bg-top grayscale group-hover:grayscale-0 transition-all duration-500 opacity-40 group-hover:opacity-70" style="background-image: url('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=500&q=80')"></div>
                    <div class="absolute bottom-0 w-full h-24 bg-primary/20 mix-blend-color-burn"></div>
                    <div class="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent"></div>
                  </div>

                  <!-- Card Top Bar (Team Logo Badge + MVP Rate) -->
                  <div class="relative z-10 flex justify-between p-4 items-start">
                    ${renderTeamLogoBadge(p.teamName, 'w-10 h-10', isSelected ? 'border-2 border-primary' : 'border border-outline-variant')}

                    <div class="bg-[#0A0A0B]/90 border border-outline-variant px-2.5 py-1 flex flex-col items-center justify-center">
                      <span class="font-label text-[9px] text-outline font-bold uppercase tracking-wider leading-none">MVP RATE</span>
                      <span class="font-headline font-bold text-base text-primary leading-none mt-1">${fmtMvp(p.avgMvpRate)}</span>
                    </div>
                  </div>

                  <!-- Card Bottom Section -->
                  <div class="relative z-10 mt-auto p-4 border-t border-[#2E2E32] bg-[#0A0A0B]/90 backdrop-blur-sm">
                    <div class="font-label text-[10px] text-outline font-bold uppercase tracking-wider">${p.teamName}</div>
                    <div class="font-headline font-bold text-xl text-white uppercase tracking-wide truncate flex items-center justify-between">
                      <span>${p.playerName}</span>
                      ${isSelected ? `<span class="bg-primary text-black font-headline text-[10px] font-bold px-1.5 py-0.5">DRAFTED</span>` : ''}
                    </div>
                    
                    <div class="flex gap-4 mt-2 font-headline font-bold text-xs text-on-surface">
                      <div class="flex flex-col"><span class="text-outline text-[9px] font-label">K/D</span><span>${p.kd.toFixed(2)}</span></div>
                      <div class="flex flex-col"><span class="text-outline text-[9px] font-label">AVG K</span><span>${fmt(p.avgEliminations, 1)}</span></div>
                      <div class="flex flex-col"><span class="text-outline text-[9px] font-label">AVG DMG</span><span>${fmt(p.avgDamage, 0)}</span></div>
                    </div>

                    ${wouldExceedCap ? `<div class="font-label text-[9px] text-status-live uppercase font-bold mt-1">CAP REACHED (2/2)</div>` : ''}
                  </div>

                </div>
              `;
            }).join('') || `<div class="col-span-full text-center py-16 font-label text-outline uppercase">No players match current parameters.</div>`}
          </div>

        </section>

        <!-- Right Panel: MY ROSTER -->
        <section class="w-full lg:w-[400px] h-full flex flex-col bg-[#131314] border-l border-[#2E2E32] z-30 shrink-0">
          
          <div class="p-6 border-b border-[#2E2E32] bg-[#1A1A1C]">
            <div class="flex justify-between items-center mb-3">
              <h2 class="font-headline font-bold text-2xl text-white uppercase tracking-wider">MY ROSTER</h2>
              ${existingTeam && selectedUIds.length === 4 ? `
                <button id="view-active-btn" class="text-xs text-primary hover:underline font-headline font-bold uppercase">VIEW DEPLOYMENT →</button>
              ` : ''}
            </div>
            
            <div>
              <input id="team-name-input" type="text" placeholder="FANTASY TEAM NAME" value="${teamName}" class="w-full bg-[#1A1A1C] text-white px-4 py-3 border-b-2 border-b-[#2E2E32] focus:border-b-primary outline-none font-headline font-bold text-sm uppercase tracking-wider placeholder:text-outline transition-colors" />
            </div>
          </div>

          <!-- Slots Container -->
          <div class="flex-1 p-6 flex flex-col gap-3 overflow-y-auto">
            ${[0,1,2,3].map(i => {
              const uid = selectedUIds[i];
              const p = uid ? playerRegistry[uid] : null;
              const count = p ? teamCounts[p.teamId] : 0;
              const isLimit = count >= 2;

              if (p) {
                return `
                  <div class="hud-card p-3 flex items-center gap-3 relative overflow-hidden group border border-[#2E2E32] bg-[#1A1A1C]">
                    <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                    
                    ${renderTeamLogoBadge(p.teamName, 'w-10 h-10', 'border border-outline-variant')}

                    <div class="flex-1 min-w-0">
                      <div class="font-label text-[10px] text-outline uppercase flex items-center gap-1.5 truncate">
                        <span>${p.teamName}</span>
                        ${isLimit ? `<span class="material-symbols-outlined text-[14px] text-primary" title="Team cap reached (2/2)">warning</span>` : ''}
                      </div>
                      <div class="font-headline font-bold text-lg leading-tight text-white uppercase truncate">${p.playerName}</div>
                    </div>

                    <div class="font-headline font-bold text-base text-primary">${fmtMvp(p.avgMvpRate)}</div>

                    <button class="remove-btn text-outline hover:text-red-400 p-1" data-uid="${p.uId}">
                      <span class="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                `;
              } else {
                return `
                  <div class="border border-dashed border-[#2E2E32] bg-[#0E0E0F] p-4 flex items-center justify-center h-[72px] cursor-pointer hover:border-primary transition-colors">
                    <div class="font-headline font-bold text-xs text-outline flex items-center gap-2 uppercase tracking-wider">
                      <span class="material-symbols-outlined text-sm">add</span> SELECT PLAYER
                    </div>
                  </div>
                `;
              }
            }).join('')}

            <!-- Combined Stats & Warning Section -->
            <div class="mt-4 border-t border-[#2E2E32] pt-4 flex flex-col gap-3">
              <div class="flex justify-between items-center">
                <span class="font-headline font-bold text-xs text-outline uppercase">COMBINED MVP RATE</span>
                <span class="font-headline font-bold text-2xl text-primary">${fmtMvp(totalMvp)}</span>
              </div>

              <div class="bg-[#1A1A1C] border-l-2 border-primary p-3 flex gap-3 items-start">
                <span class="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">info</span>
                <div class="text-xs">
                  <div class="font-headline font-bold text-white uppercase">MAX 2 PER TEAM</div>
                  <div class="text-outline font-label text-[11px] mt-0.5">Roster cap limits maximum 2 players from the same real-life team.</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Action Bar -->
          <div class="p-6 border-t border-[#2E2E32] bg-[#1A1A1C]">
            <div class="flex items-center justify-between mb-3 font-headline font-bold text-xs text-outline uppercase">
              <span>DRAFT STATUS</span>
              <span class="text-primary">${selectedUIds.length}/4 PLAYERS</span>
            </div>
            
            <button id="save-squad-btn" class="btn-primary w-full py-3.5 font-headline font-bold text-base uppercase tracking-widest flex items-center justify-center gap-2" ${selectedUIds.length !== 4 ? 'disabled' : ''}>
              <span class="material-symbols-outlined text-lg">save</span>
              SAVE TEAM (${selectedUIds.length}/4)
            </button>
          </div>

        </section>

      </div>
    `);

    // Handlers
    const viewActiveBtn = document.getElementById('view-active-btn');
    if (viewActiveBtn) {
      viewActiveBtn.onclick = () => {
        viewMode = 'ACTIVE';
        renderContent();
      };
    }

    const searchInput = document.getElementById('player-search');
    if (searchInput) {
      searchInput.oninput = e => {
        searchQuery = e.target.value;
        renderContent();
      };
    }

    const teamSelect = document.getElementById('team-select');
    if (teamSelect) {
      teamSelect.onchange = e => {
        teamFilter = e.target.value;
        renderContent();
      };
    }

    document.querySelectorAll('#player-grid .hud-card').forEach(card => {
      card.onclick = () => {
        const uid = card.dataset.uid;
        if (selectedUIds.includes(uid)) {
          selectedUIds = selectedUIds.filter(id => id !== uid);
        } else {
          if (selectedUIds.length >= 4) { toast('Max 4 players allowed', 'warning'); return; }
          selectedUIds.push(uid);
        }
        renderContent();
      };
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.onclick = e => {
        e.stopPropagation();
        const uid = btn.dataset.uid;
        selectedUIds = selectedUIds.filter(id => id !== uid);
        renderContent();
      };
    });

    const teamInput = document.getElementById('team-name-input');
    if (teamInput) {
      teamInput.oninput = e => {
        teamName = e.target.value;
      };
    }

    const saveBtn = document.getElementById('save-squad-btn');
    if (saveBtn) {
      saveBtn.onclick = () => {
        const inputVal = document.getElementById('team-name-input')?.value;
        teamName = inputVal || teamName;
        try {
          saveFantasyTeam(teamName, selectedUIds, playerRegistry);
          toast('Fantasy Squad Roster Saved!', 'success');
          viewMode = 'ACTIVE';
          renderContent();
        } catch (err) {
          toast(err.message, 'error');
        }
      };
    }
  }

  renderContent();
}
