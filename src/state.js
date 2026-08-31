/**
 * STATE & PERSISTENCE MANAGEMENT
 * Handles user auth sessions, match prediction scoring, and fantasy squad persistence.
 * Uses Player & Squad Power Scores.
 */

const STORAGE_KEYS = {
  SESSION: 'pmgo_session',
  USERS: 'pmgo_users',
  PREDICTIONS: 'pmgo_predictions',
  FANTASY: 'pmgo_fantasy',
};

// ============================================================
// 1. AUTHENTICATION
// ============================================================

export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function register(username, password) {
  if (!username || username.trim().length < 2) {
    throw new Error('Callsign must be at least 2 characters.');
  }
  if (!password || password.length < 4) {
    throw new Error('Access code must be at least 4 characters.');
  }

  const users = getUsers();
  const key = username.trim().toLowerCase();

  if (users[key]) {
    throw new Error('Operative callsign already registered. Please login.');
  }

  users[key] = {
    username: username.trim(),
    password,
    registeredAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  const session = { key, username: username.trim() };
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  return session;
}

export function login(username, password) {
  const users = getUsers();
  const key = username.trim().toLowerCase();
  const user = users[key];

  if (!user || user.password !== password) {
    throw new Error('Invalid callsign or access code.');
  }

  const session = { key, username: user.username };
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  return session;
}

export const loginUser = login;
export const registerUser = register;

export function logout() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

function getUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ============================================================
// 2. MATCH PREDICTIONS
// ============================================================

export function getUserPredictions() {
  const session = getSession();
  if (!session) return {};
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.PREDICTIONS) || '{}');
    return all[session.key] || {};
  } catch {
    return {};
  }
}

export function submitPrediction(matchId, teamId, teamName, { isOpen } = {}) {
  const session = getSession();
  if (!session) throw new Error('Authentication required.');
  if (!isOpen) throw new Error('Prediction window closed for this match.');

  const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.PREDICTIONS) || '{}');
  if (!all[session.key]) all[session.key] = {};

  all[session.key][matchId] = {
    matchId,
    predictedTeamId: teamId,
    predictedTeamName: teamName,
    submittedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(all));
  return all[session.key][matchId];
}

export function scorePredictions(matches) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.PREDICTIONS) || '{}');
  const pointsMap = { 1: 10, 2: 8, 3: 5, 4: 3, 5: 1 };

  Object.keys(all).forEach(userKey => {
    const userPreds = all[userKey];
    Object.keys(userPreds).forEach(matchId => {
      const pred = userPreds[matchId];
      const match = matches.find(m => m.id === matchId);
      if (match) {
        const finishedTeam = match.teams.find(t => String(t.teamId) === String(pred.predictedTeamId));
        if (finishedTeam) {
          pred.actualPlacement = finishedTeam.rank;
          pred.points = pointsMap[finishedTeam.rank] ?? 0;
        }
      }
    });
  });

  localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(all));
}

// ============================================================
// 3. FANTASY SQUAD
// ============================================================

export function getMyFantasyTeam() {
  const session = getSession();
  if (!session) return null;
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.FANTASY) || '{}');
    return all[session.key] || null;
  } catch {
    return null;
  }
}

export function saveFantasyTeam(teamName, playerUIds, playerRegistry) {
  const session = getSession();
  if (!session) throw new Error('Authentication required.');

  if (!teamName || !teamName.trim()) {
    throw new Error('Squad designation name required.');
  }
  if (!playerUIds || playerUIds.length !== 4) {
    throw new Error('Squad must consist of exactly 4 operatives.');
  }

  // Validate max 2 from same team
  const teamCounts = {};
  playerUIds.forEach(uid => {
    const p = playerRegistry[uid];
    if (p) {
      teamCounts[p.teamId] = (teamCounts[p.teamId] || 0) + 1;
      if (teamCounts[p.teamId] > 2) {
        throw new Error(`Max 2 operatives allowed from ${p.teamName}.`);
      }
    }
  });

  const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.FANTASY) || '{}');
  all[session.key] = {
    teamName: teamName.trim(),
    playerUIds,
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEYS.FANTASY, JSON.stringify(all));
  return all[session.key];
}

// ============================================================
// 4. LEADERBOARDS
// ============================================================

export function getFantasyLeaderboard(playerRegistry) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.FANTASY) || '{}');
  const users = getUsers();

  const entries = Object.keys(all).map(userKey => {
    const data = all[userKey];
    const username = users[userKey]?.username || userKey;
    const players = data.playerUIds.map(uid => playerRegistry[uid]).filter(Boolean);
    const score = players.reduce((s, p) => s + (p.avgPower || 0), 0);

    return {
      key: userKey,
      username,
      teamName: data.teamName,
      players,
      score,
      savedAt: data.savedAt,
    };
  });

  return entries.sort((a, b) => b.score - a.score);
}

export function getPredictionLeaderboard() {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.PREDICTIONS) || '{}');
  const users = getUsers();

  const entries = Object.keys(all).map(userKey => {
    const preds = all[userKey];
    const username = users[userKey]?.username || userKey;
    const picks = Object.values(preds);
    const totalPoints = picks.reduce((s, p) => s + (p.points ?? 0), 0);
    const correctPicks = picks.filter(p => p.points === 10).length;

    return {
      key: userKey,
      username,
      totalPoints,
      totalPicks: picks.length,
      correctPicks,
    };
  });

  return entries.sort((a, b) => b.totalPoints - a.totalPoints || b.correctPicks - a.correctPicks);
}
