import assert from "node:assert/strict";
import { test } from "node:test";

import {
  matchPower,
  placementPoints,
  playerTrend,
  predictionPayout,
  teamMatchPoints,
  validateSquad,
  wouldExceedTeamCap,
} from "./scoring";

// ------------------------------------------------------------ match points

test("placement table hits the official boundaries", () => {
  assert.equal(placementPoints(1), 10);
  assert.equal(placementPoints(2), 6);
  assert.equal(placementPoints(3), 5);
  // 7th and 8th both score 1 — the only tie in the table.
  assert.equal(placementPoints(7), 1);
  assert.equal(placementPoints(8), 1);
  // The cliff: 9th onwards scores nothing.
  assert.equal(placementPoints(9), 0);
  assert.equal(placementPoints(16), 0);
});

test("placement points are 0 off the table rather than undefined", () => {
  assert.equal(placementPoints(0), 0);
  assert.equal(placementPoints(17), 0);
  assert.equal(placementPoints(-1), 0);
});

test("team match points are placement plus one per kill", () => {
  assert.equal(teamMatchPoints(1, 12), 22);
  assert.equal(teamMatchPoints(16, 3), 3); // no placement points, kills still count
  assert.equal(teamMatchPoints(8, 0), 1);
});

// ------------------------------------------------------------- power score

test("power score weights each stat as documented", () => {
  // 5 kills (60) + 3 knockouts (12) + 1000 damage (80) + 600s = 10min (15)
  assert.equal(
    matchPower({ killNum: 5, knockouts: 3, damage: 1000, survivalTime: 600 }),
    167,
  );
});

test("power score rounds to one decimal", () => {
  // 111 damage → 8.88, nothing else contributing.
  assert.equal(
    matchPower({ killNum: 0, knockouts: 0, damage: 111, survivalTime: 0 }),
    8.9,
  );
});

test("power score of an empty stat line is 0, not NaN", () => {
  assert.equal(
    matchPower({ killNum: 0, knockouts: 0, damage: 0, survivalTime: 0 }),
    0,
  );
});

// -------------------------------------------------------------- predictions

test("prediction payout decays across the top five and then stops", () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6, 16].map(predictionPayout),
    [10, 8, 5, 3, 1, 0, 0],
  );
});

// ------------------------------------------------------------- squad rules

const P = (uid: string, teamId: number) => ({ uid, teamId, teamName: `T${teamId}` });

test("a legal squad passes", () => {
  assert.equal(validateSquad([P("a", 1), P("b", 1), P("c", 2), P("d", 3)]), null);
});

test("squad must be exactly four", () => {
  assert.match(validateSquad([P("a", 1)]) ?? "", /exactly 4/);
  assert.match(
    validateSquad([P("a", 1), P("b", 2), P("c", 3), P("d", 4), P("e", 5)]) ?? "",
    /exactly 4/,
  );
});

test("the same operative cannot be drafted twice", () => {
  assert.match(
    validateSquad([P("a", 1), P("a", 1), P("c", 2), P("d", 3)]) ?? "",
    /twice/,
  );
});

test("a third operative from one team is refused", () => {
  const err = validateSquad([P("a", 5), P("b", 5), P("c", 5), P("d", 3)]);
  assert.match(err ?? "", /Max 2 operatives allowed from T5/);
});

test("the cap check sees a full team but still allows deselecting", () => {
  const drafted = [P("a", 5), P("b", 5)];
  // A third from team 5 is blocked...
  assert.equal(wouldExceedTeamCap(drafted, P("c", 5)), true);
  // ...a first from team 6 is not...
  assert.equal(wouldExceedTeamCap(drafted, P("c", 6)), false);
  // ...and removing one already drafted is never blocked.
  assert.equal(wouldExceedTeamCap(drafted, P("a", 5)), false);
});

// ------------------------------------------------------------------- trend

test("trend needs at least two matches to say anything", () => {
  assert.equal(playerTrend([]), null);
  assert.equal(playerTrend([120]), null);
});

test("trend is null when there is no prior form to compare against", () => {
  assert.equal(playerTrend([0, 0, 90]), null);
});

test("a change under 5% is flat, not a direction", () => {
  // prior avg 100, last 104 → +4%
  assert.equal(playerTrend([100, 100, 104]), "flat");
});

test("trend reads the last entry, so order decides the answer", () => {
  const chronological = [50, 50, 200]; // finished strong
  assert.equal(playerTrend(chronological), "up");
  // The same matches sorted wrongly invert the verdict — this is exactly the
  // bug that ordering by phase name used to produce.
  assert.equal(playerTrend([...chronological].reverse()), "down");
});
