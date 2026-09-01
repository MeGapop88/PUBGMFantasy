import MatchGrid, { type MatchSummary } from "@/components/dashboard/MatchGrid";
import StandingsColumn from "@/components/dashboard/StandingsColumn";
import { EmptyState, Icon, StatTile } from "@/components/ui";
import { fmt, fmtPower } from "@/lib/format";
import {
  getFinalsStandings,
  getMatchSummaries,
  getPlayerAggregates,
  getTeamAggregates,
} from "@/lib/queries";

export default async function DashboardPage() {
  const [standings, matches, players, teams] = await Promise.all([
    getFinalsStandings(),
    getMatchSummaries(),
    getPlayerAggregates(),
    getTeamAggregates(),
  ]);

  // With a roster-seeded team registry this only fires if the roster itself is
  // missing — i.e. the database was never seeded.
  if (teams.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          title="NO ROSTER DATA"
          body={
            <>
              Team and player roster could not be loaded. Run{" "}
              <code className="bg-black px-2 py-1 text-primary">npm run seed</code>.
            </>
          }
        />
      </div>
    );
  }

  const totalKills = players.reduce((s, p) => s + p.totalEliminations, 0);
  const topPower = players
    .filter((p) => p.matchesPlayed >= 3)
    .sort((a, b) => b.avgPower - a.avgPower)[0];

  const summaries: MatchSummary[] = matches.map((m) => ({
    key: m.key,
    phase: m.phase,
    day: m.day,
    game: m.game,
    hasResults: m.hasResults,
    teamCount: m.teamCount,
    totalKills: m.totalKills,
    topFrags: m.topFrags,
    winner: m.winner
      ? { name: m.winner.name, logo: m.winner.logo, initials: m.winner.initials }
      : null,
  }));

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Hero */}
      <div className="hud-card scanline-effect group relative flex min-h-[380px] flex-col overflow-hidden border border-outline-variant lg:h-[380px]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity transition-opacity duration-500 group-hover:opacity-50"
          style={{ backgroundImage: "url('/hero/tournament.jpg')" }}
        />

        <div className="relative z-20 flex items-start justify-between p-6">
          <div className="flex items-center gap-3 border border-outline-variant bg-[#0E0E0F]/90 px-3.5 py-1.5">
            <div className="pulse-live h-2.5 w-2.5 bg-status-live" />
            <span className="font-headline text-xs font-bold tracking-widest text-white uppercase">
              TELEMETRY ACTIVE
            </span>
          </div>
          <div className="flex flex-col items-end border border-outline-variant bg-[#0E0E0F]/90 px-4 py-2">
            <span className="font-label text-[10px] font-bold tracking-widest text-outline uppercase">
              STAGE OVERVIEW
            </span>
            <span className="font-headline text-base font-bold tracking-wider text-primary uppercase">
              {matches.length} MATCHES INGESTED
            </span>
          </div>
        </div>

        <div className="relative z-20 mt-auto flex flex-col items-start justify-between gap-6 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/80 to-transparent p-6 md:p-8 lg:flex-row lg:items-end">
          <div>
            <div className="font-headline mb-1 text-xs font-bold tracking-widest text-primary uppercase">
              PMGO TOURNAMENT COMMAND
            </div>
            <h1 className="font-headline mb-2 text-3xl font-bold tracking-tight text-white uppercase md:text-5xl">
              GLOBAL FINALS TELEMETRY
            </h1>
            <p className="font-body max-w-xl text-sm text-outline">
              Real-time spectator engine output ingested from Shadow Tracker. {teams.length} teams
              competing across {matches.length} games.
            </p>
          </div>

          <div className="grid w-full shrink-0 grid-cols-2 gap-3 md:grid-cols-4 lg:w-auto">
            <StatTile label="MATCHES" value={matches.length} className="min-w-[110px]" />
            <StatTile label="TEAMS" value={teams.length} className="min-w-[110px]" />
            <StatTile label="TOTAL KILLS" value={fmt(totalKills)} accent className="min-w-[110px]" />
            <StatTile
              label="TOP OPERATIVE"
              value={topPower?.name ?? "—"}
              sub={topPower ? fmtPower(topPower.avgPower) : undefined}
              className="min-w-[110px]"
            />
          </div>
        </div>
      </div>

      {/* Tournament standings — 2 columns of 8 */}
      <section className="hud-card flex flex-col gap-6 border border-outline-variant bg-[#1A1A1C] p-6 md:p-8">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-outline-variant pb-4 md:flex-row md:items-center">
          <div>
            <p className="font-headline mb-1 flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase">
              <span className="h-2 w-2 animate-pulse bg-status-live" /> TOURNAMENT STANDINGS (ALL
              FINALS GAMES)
            </p>
            <h2 className="font-headline text-2xl font-bold tracking-tight text-white uppercase md:text-3xl">
              PMGO FINALS OVERALL LEADERBOARD
            </h2>
          </div>

          <div className="border border-outline-variant bg-[#0E0E0F] px-4 py-2 text-right">
            <span className="font-label block text-[10px] tracking-wider text-outline uppercase">
              SCORING SYSTEM
            </span>
            <span className="font-headline text-xs font-bold text-primary uppercase">
              1 KILL = 1 PT + OFFICIAL PLACEMENT PTS
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
          <StandingsColumn teams={standings.slice(0, 8)} />
          <StandingsColumn teams={standings.slice(8, 16)} />
        </div>
      </section>

      <MatchGrid matches={summaries} />
    </div>
  );
}
