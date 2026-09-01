import Link from "next/link";
import { notFound } from "next/navigation";

import TeamAccordion from "@/components/match/TeamAccordion";
import { Icon, StatTile, TeamBadge } from "@/components/ui";
import { ordinal, placementColor } from "@/lib/format";
import { getMatchDetail, getUserPredictions } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const match = await getMatchDetail(decodeURIComponent(id));
  if (!match) notFound();

  const predictions = await getUserPredictions(user.id);
  const pick = predictions.find((p) => p.matchId === match.id);
  const pickedRank = pick
    ? (match.teams.find((t) => t.teamId === pick.teamId)?.rank ?? null)
    : null;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Breadcrumb */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-outline-variant pb-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="btn-ghost font-headline flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider uppercase"
          >
            <Icon name="arrow_back" className="text-sm" /> TOURNAMENT COMMAND
          </Link>
          <span className="font-headline text-outline">/</span>
          <span className="font-headline text-sm font-bold text-primary uppercase">
            {match.phase} DAY {match.day} GAME {match.game}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="pulse-live h-2 w-2 bg-status-live" />
          <span className="font-headline text-xs font-bold tracking-widest text-white uppercase">
            MATCH RESULT TELEMETRY
          </span>
        </div>
      </div>

      {/* Hero summary */}
      <div className="hud-card relative flex flex-col items-start justify-between gap-6 overflow-hidden border border-outline-variant bg-[#1A1A1C] p-6 md:p-8 lg:flex-row lg:items-center">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity"
          style={{ backgroundImage: "url('/hero/tournament.jpg')" }}
        />

        <div className="relative z-10">
          <div className="font-headline mb-1 flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase">
            <Icon name="sports_esports" className="text-sm" /> OFFICIAL MATCH RECAP
          </div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-white uppercase md:text-5xl">
            {match.phase.toUpperCase()} — DAY {match.day} GAME {match.game}
          </h1>
          <p className="font-body mt-1 text-xs text-outline">
            {match.teams.length} TEAMS · {match.totalKills} TOTAL ELIMINATIONS
          </p>
        </div>

        <div className="relative z-10 grid w-full shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:w-auto">
          {match.winner && (
            <div className="hud-card min-w-[130px] border border-primary/40 bg-[#0E0E0F] p-3 text-center">
              <div className="font-label mb-1 flex items-center justify-center gap-1 text-[9px] font-bold tracking-wider text-status-success uppercase">
                <Icon name="emoji_events" className="text-xs" /> WWCD WINNER
              </div>
              <div className="mt-1 flex items-center justify-center gap-2">
                <TeamBadge team={match.winner} size={24} className="border border-primary" />
                <span className="font-headline truncate text-sm font-bold text-white uppercase">
                  {match.winner.teamName}
                </span>
              </div>
            </div>
          )}

          <StatTile label="MATCH KILLS" value={match.totalKills} accent className="min-w-[110px]" />

          {match.topKiller && (
            <StatTile
              label="TOP FRAGGER"
              value={`${match.topKiller.name} (${match.topKiller.eliminations}K)`}
              className="col-span-2 min-w-[120px] sm:col-span-1"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          {match.hasResults ? (
            <TeamAccordion
              teams={match.teams}
              initialTeamId={match.winner?.teamId ?? match.teams[0]?.teamId ?? null}
            />
          ) : (
            <div className="hud-card border border-outline-variant bg-[#0E0E0F] p-8 text-center">
              <Icon name="schedule" className="mb-2 block text-4xl text-outline" />
              <div className="font-headline text-sm font-bold tracking-wider text-white uppercase">
                MATCH NOT YET PLAYED
              </div>
              <div className="font-label mt-1 text-xs text-outline">
                Team standings will populate once this game&apos;s telemetry is ingested.
              </div>
            </div>
          )}
        </div>

        {/* Prediction payout widget */}
        <div className="hud-card flex min-w-0 flex-col gap-5 border border-outline-variant bg-[#1A1A1C] p-5 lg:sticky lg:top-[88px] lg:col-span-4">
          <div className="flex items-center justify-between border-b border-outline-variant pb-3">
            <span className="font-headline flex items-center gap-1 text-xs font-bold tracking-widest text-primary uppercase">
              <Icon name="troubleshoot" className="text-sm" /> MATCH PREDICTION
            </span>
            <span className="font-label text-[10px] text-outline uppercase">{match.phase}</span>
          </div>

          {pick ? (
            <>
              <div className="flex items-center gap-4 border border-outline-variant bg-[#0E0E0F] p-3.5">
                <TeamBadge team={pick.team} size={48} className="border-2 border-primary" />
                <div className="min-w-0">
                  <div className="font-label text-[9px] text-outline uppercase">PICKED WINNER</div>
                  <div className="font-headline truncate text-xl font-bold text-white uppercase">
                    {pick.team.name}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="hud-card bg-[#0E0E0F] p-3 text-center">
                  <div className="font-label mb-1 text-[9px] text-outline uppercase">
                    ACTUAL FINISH
                  </div>
                  <div
                    className="font-headline text-xl font-bold"
                    style={{ color: placementColor(pickedRank) }}
                  >
                    {pickedRank ? ordinal(pickedRank) : "—"}
                  </div>
                </div>
                <div className="hud-card bg-[#0E0E0F] p-3 text-center">
                  <div className="font-label mb-1 text-[9px] text-outline uppercase">
                    POINTS EARNED
                  </div>
                  <div className="font-headline text-2xl font-bold text-primary">
                    +{pick.pointsAwarded}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="border border-dashed border-outline-variant bg-[#0E0E0F] p-4 text-center">
              <div className="font-headline mb-1 text-sm font-bold text-white uppercase">
                NO PREDICTION SUBMITTED
              </div>
              <div className="font-label mb-3 text-xs text-outline">
                Lock in your pick for this match
              </div>
              <Link
                href="/predictions"
                className="btn-primary font-headline inline-flex px-4 py-2 text-xs font-bold uppercase"
              >
                MAKE PREDICTION
              </Link>
            </div>
          )}

          <div className="border-t border-outline-variant pt-4">
            <div className="font-headline mb-2 text-[11px] font-bold tracking-wider text-outline uppercase">
              PREDICTION REWARD SCALE
            </div>
            <div className="font-label grid grid-cols-5 gap-1 text-center text-[10px]">
              {[10, 8, 5, 3, 1].map((pts, i) => (
                <div
                  key={pts}
                  className={`border border-outline-variant p-1.5 ${
                    pickedRank === i + 1
                      ? "bg-primary/20 font-bold text-primary"
                      : "text-outline"
                  }`}
                >
                  {ordinal(i + 1)}: {pts}p
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/predictions"
            className="btn-primary font-headline flex w-full items-center justify-center gap-2 py-3 text-center text-sm font-bold tracking-wider uppercase"
          >
            <Icon name="how_to_vote" className="text-base" /> GO TO PREDICTIONS DOCK
          </Link>
        </div>
      </div>
    </div>
  );
}
