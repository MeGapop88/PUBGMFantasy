import type { CompareStat } from "@/components/compare/CompareDialog";
import { fmt, fmtPower } from "./format";

/** Everything the player comparison reads. A superset of the card's data. */
export type ComparablePlayer = {
  uid: string;
  name: string;
  teamName: string;
  teamLogo: string | null;
  teamInitials: string;
  avgPower: number;
  kd: number;
  avgEliminations: number;
  avgDamage: number;
  matchesPlayed: number;
};

export type ComparableTeam = {
  teamId: number;
  teamName: string;
  logo: string | null;
  initials: string;
  matchesPlayed: number;
  wins: number;
  top3: number;
  totalKills: number;
  totalPoints: number;
  totalPlacePts: number;
  totalDamage: number;
  avgPlacement: number;
};

const one = (n: number) => n.toFixed(1);
const two = (n: number) => n.toFixed(2);

export function playerStats(a: ComparablePlayer, b: ComparablePlayer): CompareStat[] {
  return [
    { label: "Power Score", a: a.avgPower, b: b.avgPower, format: fmtPower },
    { label: "K/D", a: a.kd, b: b.kd, format: two },
    { label: "Avg kills", a: a.avgEliminations, b: b.avgEliminations, format: one },
    { label: "Avg damage", a: a.avgDamage, b: b.avgDamage, format: (n) => fmt(n, 0) },
    { label: "Matches", a: a.matchesPlayed, b: b.matchesPlayed },
    {
      label: "Total damage",
      a: a.avgDamage * a.matchesPlayed,
      b: b.avgDamage * b.matchesPlayed,
      format: (n) => fmt(n, 0),
    },
  ];
}

export function teamStats(a: ComparableTeam, b: ComparableTeam): CompareStat[] {
  return [
    { label: "Total points", a: a.totalPoints, b: b.totalPoints },
    { label: "WWCD", a: a.wins, b: b.wins },
    { label: "Top 3 finishes", a: a.top3, b: b.top3 },
    { label: "Kills", a: a.totalKills, b: b.totalKills },
    { label: "Placement pts", a: a.totalPlacePts, b: b.totalPlacePts },
    { label: "Damage", a: a.totalDamage, b: b.totalDamage, format: (n) => fmt(n, 0) },
    // The only row where the smaller number wins.
    {
      label: "Avg placement",
      a: a.avgPlacement,
      b: b.avgPlacement,
      format: one,
      lowerIsBetter: true,
    },
    { label: "Matches", a: a.matchesPlayed, b: b.matchesPlayed },
  ];
}
