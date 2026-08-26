/**
 * APP STATE — localStorage-backed state management
 * Handles: auth, predictions, fantasy teams
 */

const KEYS = {
  USERS:       'pmgo_users',
  SESSION:     'pmgo_session',
  PREDICTIONS: 'pmgo_predictions',
  FANTASY:     'pmgo_fantasy',
};

// ============================================================
// AUTH
// ============================================================

export function getUsers() {
  return JSON.parse(localStorage.getItem(KEYS.USERS) ?? '{}');
}

function saveUsers(users) {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

export function registerUser(username, password) {
  const users = getUsers();
  const key = username.toLowerCase().trim();
  if (!key) throw new Error('Username cannot be empty');
  if (users[key]) throw new Error('Username already taken');
  if (password.length < 4) throw new Error('Password must be at least 4 characters');
  users[key] = { username: username.trim(), passwordHash: btoa(password), createdAt: Date.now() };
  saveUsers(users);
  return { username: username.trim() };
}

export function loginUser(username, password) {
  const users = getUsers();
  const key = username.toLowerCase().trim();
  const user = users[key];
  if (!user) throw new Error('Username not found');
  if (user.passwordHash !== btoa(password)) throw new Error('Incorrect password');
  const session = { username: user.username, key, loginAt: Date.now() };
  localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
  return session;
}

export function getSession() {
  return JSON.parse(localStorage.getItem(KEYS.SESSION) ?? 'null');
}

export function logout() {
  localStorage.removeItem(KEYS.SESSION);
}

export function requireAuth(router) {
  if (!getSession()) {
    router.navigate('/login');
    return false;
  }
  return true;
}

// ============================================================
// PREDICTIONS
// ============================================================

/**
 * Get all predictions for current user.
 * Shape: { [matchId]: { predictedTeamId, predictedTeamName, submittedAt, points } }
 */
export function getUserPredictions() {
  const session = getSession();
  if (!session) return {};
  const all = JSON.parse(localStorage.getItem(KEYS.PREDICTIONS) ?? '{}');
  return all[session.key] ?? {};
}

/**
 * Submit or update a prediction for a match.
 */
export function submitPrediction(matchId, teamId, teamName) {
  const session = getSession();
  if (!session) throw new Error('Not logged in');
  const all = JSON.parse(localStorage.getItem(KEYS.PREDICTIONS) ?? '{}');
  if (!all[session.key]) all[session.key] = {};
  all[session.key][matchId] = {
    predictedTeamId:   teamId,
    predictedTeamName: teamName,
    submittedAt:       Date.now(),
    points:            null, // scored later
  };
  localStorage.setItem(KEYS.PREDICTIONS, JSON.stringify(all));
}

/**
 * Score predictions against real match results.
 * Scoring curve (base 10 pts max):
 *   1st=10, 2nd=8, 3rd=5, 4th=3, 5th=1, 6th+=0
 */
const PLACEMENT_POINTS = { 1: 10, 2: 8, 3: 5, 4: 3, 5: 1 };

export function scorePredictions(matches) {
  const all = JSON.parse(localStorage.getItem(KEYS.PREDICTIONS) ?? '{}');
  let changed = false;

  Object.keys(all).forEach(userKey => {
    const preds = all[userKey];
    Object.keys(preds).forEach(matchId => {
      const pred = preds[matchId];
      // Always re-score so existing saved predictions pick up the updated point scale
      const match = matches.find(m => m.id === matchId);
      if (!match) return;

      const team = match.teams.find(t => String(t.teamId) === String(pred.predictedTeamId));
      const placement = team?.rank ?? 16;
      const newPoints = PLACEMENT_POINTS[placement] ?? 0;
      
      if (pred.points !== newPoints || pred.actualPlacement !== placement) {
        pred.points = newPoints;
        pred.actualPlacement = placement;
        changed = true;
      }
    });
  });

  if (changed) localStorage.setItem(KEYS.PREDICTIONS, JSON.stringify(all));
  return all;
}

/**
 * Get prediction leaderboard across all users.
 */
export function getPredictionLeaderboard() {
  const all = JSON.parse(localStorage.getItem(KEYS.PREDICTIONS) ?? '{}');
  const users = getUsers();
  const lb = [];

  Object.keys(all).forEach(key => {
    const preds = all[key];
    const totalPoints = Object.values(preds).reduce((s, p) => s + (p.points ?? 0), 0);
    const totalPicks  = Object.values(preds).filter(p => p.points !== null).length;
    const correctPicks = Object.values(preds).filter(p => p.points === 10).length;
    lb.push({
      key,
      username: users[key]?.username ?? key,
      totalPoints,
      totalPicks,
      correctPicks,
    });
  });

  return lb.sort((a, b) => b.totalPoints - a.totalPoints);
}

// ============================================================
// FANTASY TEAMS
// ============================================================

export function getMyFantasyTeam() {
  const session = getSession();
  if (!session) return null;
  const all = JSON.parse(localStorage.getItem(KEYS.FANTASY) ?? '{}');
  return all[session.key] ?? null;
}

export function saveFantasyTeam(teamName, playerUIds, playerRegistry) {
  const session = getSession();
  if (!session) throw new Error('Not logged in');
  if (!teamName.trim()) throw new Error('Team name cannot be empty');
  if (playerUIds.length !== 4) throw new Error('Must select exactly 4 players');

  const teamCounts = {};
  playerUIds.forEach(uid => {
    const p = playerRegistry[uid];
    if (!p) throw new Error(`Player ${uid} not found`);
    teamCounts[p.teamId] = (teamCounts[p.teamId] ?? 0) + 1;
    if (teamCounts[p.teamId] > 2) {
      throw new Error(`Cannot pick more than 2 players from ${p.teamName}`);
    }
  });

  const all = JSON.parse(localStorage.getItem(KEYS.FANTASY) ?? '{}');
  const nameConflict = Object.entries(all).some(([key, team]) =>
    key !== session.key && team.teamName.toLowerCase() === teamName.trim().toLowerCase()
  );
  if (nameConflict) throw new Error('Team name already taken by another user');

  all[session.key] = {
    teamName: teamName.trim(),
    playerUIds,
    createdAt: all[session.key]?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
    lockedAt: null,
  };
  localStorage.setItem(KEYS.FANTASY, JSON.stringify(all));
}

export function getFantasyLeaderboard(playerRegistry) {
  const all  = JSON.parse(localStorage.getItem(KEYS.FANTASY) ?? '{}');
  const users = getUsers();
  const lb = [];

  Object.entries(all).forEach(([key, team]) => {
    let score = 0;
    const playerDetails = team.playerUIds.map(uid => {
      const p = playerRegistry[uid];
      if (p) score += p.totalMvpRate;
      return p ?? null;
    }).filter(Boolean);

    lb.push({
      key,
      username: users[key]?.username ?? key,
      teamName: team.teamName,
      score,
      players: playerDetails,
    });
  });

  return lb.sort((a, b) => b.score - a.score);
}
