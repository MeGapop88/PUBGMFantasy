"use client";

import { useState, useTransition } from "react";

import { ErrorNote, Icon, TeamBadge } from "@/components/ui";
import type { ActionResult } from "@/lib/actions";
import { fmt, ordinal, placementColor } from "@/lib/format";
import { PREDICTION_PAYOUT, predictionPayout } from "@/lib/scoring";
import type { DayStatus, MatchStatus } from "@/lib/schedule";

export type PredTeam = {
  teamId: number;
  teamName: string;
  initials: string;
  logo: string | null;
  rank: number;
  kills: number;
  damage: number;
};

export type PredMatch = {
  key: string;
  phase: string;
  day: number;
  game: number;
  hasResults: boolean;
  status: MatchStatus;
  winnerName: string | null;
  teams: PredTeam[];
};

export type PredDay = {
  id: string;
  label: string;
  status: DayStatus;
  matches: PredMatch[];
};

const DAY_STATUS_ICON: Record<DayStatus, string> = {
  UPCOMING: "lock_clock",
  OPEN: "radio_button_checked",
  LOCKED: "lock",
};

export default function PredictionPane({
  days,
  picks,
  lockAction,
}: {
  days: PredDay[];
  /** Keyed by match key. */
  picks: Record<string, { teamId: number; teamName: string; pointsAwarded: number }>;
  lockAction: (matchKey: string, teamId: number) => Promise<ActionResult>;
}) {
  // Default to the open day, else the first upcoming one, else the last.
  const initialDay =
    days.find((d) => d.status === "OPEN") ??
    days.find((d) => d.status === "UPCOMING") ??
    days[days.length - 1];

  const [dayId, setDayId] = useState(initialDay?.id ?? "");
  const [matchKey, setMatchKey] = useState<string | null>(initialDay?.matches[0]?.key ?? null);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [dockOpen, setDockOpen] = useState(false);

  const day = days.find((d) => d.id === dayId) ?? initialDay;
  const dayMatches = day?.matches ?? [];
  const match = dayMatches.find((m) => m.key === matchKey) ?? dayMatches[0] ?? null;
  const pick = match ? picks[match.key] : undefined;

  // Selection falls back to the current pick, then the winner, then the first
  // team — so the right pane always has something to show.
  const activeTeam =
    (match &&
      (match.teams.find((t) => t.teamId === teamId) ??
        match.teams.find((t) => t.teamId === pick?.teamId) ??
        match.teams.find((t) => t.rank === 1) ??
        match.teams[0])) ||
    null;

  const isPicked = Boolean(pick && activeTeam && pick.teamId === activeTeam.teamId);

  const selectDay = (id: string) => {
    const next = days.find((d) => d.id === id);
    setDayId(id);
    setMatchKey(next?.matches[0]?.key ?? null);
    setTeamId(null);
    setError(null);
  };

  const lock = () => {
    if (!match || !activeTeam) return;
    setError(null);
    startTransition(async () => {
      const result = await lockAction(match.key, activeTeam.teamId);
      if ("error" in result) setError(result.error);
    });
  };

  if (!day || !match) {
    return (
      <div className="hud-card border border-outline-variant bg-[#1A1A1C] p-8 text-center">
        <div className="font-headline text-sm font-bold text-white uppercase">
          NO MATCHES CONFIGURED FOR THIS DAY
        </div>
      </div>
    );
  }

  const orderedTeams = match.hasResults
    ? [...match.teams].sort((a, b) => a.rank - b.rank)
    : match.teams;

  return (
    <div className="flex flex-col gap-6 pb-28 lg:pb-0">
      {/* Day tabs */}
      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-2">
        {days.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => selectDay(d.id)}
            aria-pressed={d.id === day.id}
            className={`hud-card shrink-0 border px-4 py-2.5 text-left transition-all ${
              d.id === day.id
                ? "border-primary bg-primary/10"
                : "border-outline-variant hover:border-outline"
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="font-headline text-xs font-bold text-white uppercase">
                {d.label}
              </span>
              <Icon
                name={DAY_STATUS_ICON[d.status]}
                className={`text-xs ${d.status === "OPEN" ? "text-status-success" : "text-outline"}`}
              />
            </div>
            <div className="font-label text-[10px] text-outline uppercase">{d.status}</div>
          </button>
        ))}
      </div>

      {/* Match selector */}
      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-2">
        {dayMatches.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => {
              setMatchKey(m.key);
              setTeamId(null);
              setError(null);
            }}
            aria-pressed={m.key === match.key}
            className={`hud-card shrink-0 border px-4 py-2.5 text-left transition-all ${
              m.key === match.key
                ? "border-primary bg-primary/10"
                : "border-outline-variant hover:border-outline"
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="font-headline text-xs font-bold text-white uppercase">
                {m.phase} D{m.day} G{m.game}
              </span>
              {picks[m.key] ? (
                <Icon name="check_circle" className="text-xs text-primary" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-outline" />
              )}
            </div>
            <div className="font-label text-[10px] text-outline uppercase">
              {m.hasResults ? `WINNER: ${m.winnerName ?? "—"}` : "NOT YET PLAYED"}
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Teams */}
        <div className="hud-card relative flex min-w-0 flex-col overflow-hidden border border-outline-variant bg-[#1A1A1C] lg:col-span-5">
          <div className="flex items-center justify-between border-b border-outline-variant bg-[#131314] p-4">
            <h2 className="font-headline flex items-center gap-2 text-base font-bold tracking-wider text-white uppercase">
              <Icon name="groups" className="text-lg text-primary" /> PARTICIPATING TEAMS
            </h2>
            <span className="font-label text-[10px] tracking-widest text-outline uppercase">
              {match.teams.length} TEAMS
            </span>
          </div>

          <div className="flex flex-col gap-2 p-3 lg:max-h-[600px] lg:overflow-y-auto">
            {orderedTeams.length === 0 ? (
              <div className="font-label p-6 text-center text-xs text-outline uppercase">
                No team list available yet for this match.
              </div>
            ) : (
              orderedTeams.map((t) => {
                const selected = activeTeam?.teamId === t.teamId;
                const yours = pick?.teamId === t.teamId;

                return (
                  <button
                    key={t.teamId}
                    type="button"
                    onClick={() => setTeamId(t.teamId)}
                    aria-pressed={selected}
                    className={`relative flex items-center gap-4 border p-3 text-left transition-all ${
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-outline-variant bg-[#0E0E0F] hover:border-outline"
                    }`}
                  >
                    <TeamBadge
                      team={t}
                      size={40}
                      className={selected ? "border-2 border-primary" : "border border-outline-variant"}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="font-headline flex items-center gap-2 truncate text-base font-bold text-white uppercase">
                        {t.teamName}
                        {t.rank === 1 && match.hasResults && (
                          <Icon name="emoji_events" className="text-sm text-status-success" />
                        )}
                      </div>
                      <div className="font-label mt-0.5 flex items-center gap-3 text-xs text-outline">
                        <span>
                          FINISH:{" "}
                          <strong style={{ color: placementColor(t.rank) }}>
                            {match.hasResults ? ordinal(t.rank) : "—"}
                          </strong>
                        </span>
                        <span>KILLS: {match.hasResults ? t.kills : "—"}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {yours && (
                        <span className="font-headline bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wider text-black uppercase">
                          YOUR PICK
                        </span>
                      )}
                      <span className="font-headline text-xs font-bold text-outline">
                        {match.hasResults ? predictionPayout(t.rank) : "?"} PTS
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Active team + lock */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
          <div className="hud-card relative overflow-hidden border border-outline-variant bg-[#1A1A1C] p-6 md:p-8">
            {activeTeam ? (
              <>
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-3">
                      <h2 className="font-headline text-3xl font-bold tracking-tight text-white uppercase md:text-4xl">
                        {activeTeam.teamName}
                      </h2>
                      {activeTeam.rank === 1 && match.hasResults && (
                        <span className="font-headline flex items-center gap-1 border border-status-success/40 bg-status-success/20 px-2.5 py-1 text-xs font-bold tracking-wider text-status-success uppercase">
                          <Icon name="emoji_events" className="text-sm" /> 1ST PLACE WINNER
                        </span>
                      )}
                    </div>
                    <p className="font-body text-xs text-outline">
                      Telemetry performance card for Game {match.game} ({match.phase})
                    </p>
                  </div>

                  <TeamBadge team={activeTeam} size={64} className="border-2 border-primary" />
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="hud-card bg-[#0E0E0F] p-3 text-center">
                    <div className="font-label mb-1 text-[10px] font-bold tracking-wider text-outline uppercase">
                      ACTUAL FINISH
                    </div>
                    <div
                      className="font-headline text-2xl font-bold"
                      style={{
                        color: match.hasResults ? placementColor(activeTeam.rank) : "#a98a7d",
                      }}
                    >
                      {match.hasResults ? ordinal(activeTeam.rank) : "—"}
                    </div>
                  </div>
                  <div className="hud-card bg-[#0E0E0F] p-3 text-center">
                    <div className="font-label mb-1 text-[10px] font-bold tracking-wider text-outline uppercase">
                      TOTAL KILLS
                    </div>
                    <div className="font-headline text-2xl font-bold text-white">
                      {match.hasResults ? activeTeam.kills : "—"}
                    </div>
                  </div>
                  <div className="hud-card bg-[#0E0E0F] p-3 text-center">
                    <div className="font-label mb-1 text-[10px] font-bold tracking-wider text-outline uppercase">
                      TOTAL DAMAGE
                    </div>
                    <div className="font-headline text-2xl font-bold text-white">
                      {match.hasResults ? fmt(activeTeam.damage) : "—"}
                    </div>
                  </div>
                  <div className="hud-card bg-[#0E0E0F] p-3 text-center">
                    <div className="font-label mb-1 text-[10px] font-bold tracking-wider text-outline uppercase">
                      PAYOUT VALUE
                    </div>
                    <div className="font-headline text-2xl font-bold text-primary">
                      {match.hasResults ? predictionPayout(activeTeam.rank) : "?"} PTS
                    </div>
                  </div>
                </div>

                <div className="mb-6 border border-outline-variant bg-[#131314] p-4">
                  <div className="font-headline mb-3 flex items-center justify-between text-xs font-bold tracking-widest text-outline uppercase">
                    <span>DECAY SCORING CURVE</span>
                    <span className="font-bold text-primary">1ST PLACE = 10 PTS</span>
                  </div>
                  <div className="font-label grid grid-cols-5 gap-2 text-center text-xs">
                    {PREDICTION_PAYOUT.map((pts, i) => (
                      <div
                        key={pts}
                        className={`border border-outline-variant p-2 ${
                          match.hasResults && activeTeam.rank === i + 1
                            ? "border-primary bg-primary/20 font-bold text-primary"
                            : ""
                        }`}
                      >
                        {ordinal(i + 1)}: {pts}pt
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="mb-4">
                    <ErrorNote>{error}</ErrorNote>
                  </div>
                )}

                <div className="hidden lg:block">
                  <ActionButton
                    status={match.status}
                    pick={pick}
                    isPicked={isPicked}
                    teamName={activeTeam.teamName}
                    pending={pending}
                    onLock={lock}
                  />
                </div>
              </>
            ) : (
              <div className="font-label py-12 text-center text-xs text-outline uppercase">
                No teams configured for this match yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile prediction dock. The pick panel is the second column, so on a
          phone it lands below a 16-team list — LOCK IN used to sit 800px past
          the fold, meaning a tap on a team produced nothing you could see. */}
      {activeTeam && (
        <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
          {dockOpen && (
            <button
              type="button"
              aria-label="Close pick detail"
              onClick={() => setDockOpen(false)}
              className="fixed inset-0 -z-10 bg-black/60 backdrop-blur-[2px]"
            />
          )}

          <div className="border-t border-outline-variant bg-[#131314] shadow-[0_-12px_30px_-12px_rgba(0,0,0,0.8)]">
            {dockOpen && (
              <div className="max-h-[55vh] overflow-y-auto border-b border-outline-variant p-4">
                <div className="mb-3 grid grid-cols-3 gap-2">
                  <div className="hud-card bg-[#0E0E0F] p-2.5 text-center">
                    <div className="font-label mb-1 text-[9px] tracking-wider text-outline uppercase">
                      FINISH
                    </div>
                    <div
                      className="font-headline text-lg font-bold"
                      style={{ color: match.hasResults ? placementColor(activeTeam.rank) : "#a98a7d" }}
                    >
                      {match.hasResults ? ordinal(activeTeam.rank) : "—"}
                    </div>
                  </div>
                  <div className="hud-card bg-[#0E0E0F] p-2.5 text-center">
                    <div className="font-label mb-1 text-[9px] tracking-wider text-outline uppercase">
                      KILLS
                    </div>
                    <div className="font-headline text-lg font-bold text-white">
                      {match.hasResults ? activeTeam.kills : "—"}
                    </div>
                  </div>
                  <div className="hud-card bg-[#0E0E0F] p-2.5 text-center">
                    <div className="font-label mb-1 text-[9px] tracking-wider text-outline uppercase">
                      DAMAGE
                    </div>
                    <div className="font-headline text-lg font-bold text-white">
                      {match.hasResults ? fmt(activeTeam.damage) : "—"}
                    </div>
                  </div>
                </div>

                <div className="font-label grid grid-cols-5 gap-1 text-center text-[10px]">
                  {PREDICTION_PAYOUT.map((pts, i) => (
                    <div
                      key={pts}
                      className={`border border-outline-variant p-1.5 ${
                        match.hasResults && activeTeam.rank === i + 1
                          ? "border-primary bg-primary/20 font-bold text-primary"
                          : "text-outline"
                      }`}
                    >
                      {ordinal(i + 1)}: {pts}
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <ErrorNote>{error}</ErrorNote>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3">
              <button
                type="button"
                onClick={() => setDockOpen((v) => !v)}
                aria-expanded={dockOpen}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <TeamBadge
                  team={activeTeam}
                  size={34}
                  className="rounded-[10px] border border-outline-variant"
                />
                <span className="min-w-0 flex-1">
                  <span className="font-headline block truncate text-sm leading-none font-bold text-white uppercase">
                    {activeTeam.teamName}
                  </span>
                  <span className="font-label mt-1 block text-[10px] text-outline uppercase">
                    {isPicked ? "Your pick · " : ""}
                    {match.hasResults ? `${predictionPayout(activeTeam.rank)} pts` : "payout TBD"}
                  </span>
                </span>
                <Icon
                  name={dockOpen ? "expand_more" : "expand_less"}
                  className="shrink-0 text-lg text-outline"
                />
              </button>

              <div className="w-[46%] shrink-0">
                <ActionButton
                  status={match.status}
                  pick={pick}
                  isPicked={isPicked}
                  teamName={activeTeam.teamName}
                  pending={pending}
                  onLock={lock}
                  compact
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  status,
  pick,
  isPicked,
  teamName,
  pending,
  onLock,
  compact = false,
}: {
  status: MatchStatus;
  pick?: { teamName: string; pointsAwarded: number };
  isPicked: boolean;
  teamName: string;
  pending: boolean;
  onLock: () => void;
  /** Dock variant: the labels have to survive a half-width button. */
  compact?: boolean;
}) {
  const shell = compact
    ? "font-headline flex w-full items-center justify-center gap-1.5 border border-outline-variant bg-[#0E0E0F] px-2 py-2.5 text-center text-[11px] font-bold tracking-wide uppercase"
    : "font-headline flex w-full items-center justify-center gap-2 border border-outline-variant bg-[#0E0E0F] py-4 text-sm font-bold tracking-widest uppercase";

  if (status === "UPCOMING") {
    return (
      <div className={`${shell} text-outline`}>
        <Icon name="lock_clock" className={compact ? "text-base" : "text-xl"} />
        {compact ? "NOT OPEN" : "OPENS AFTER THE PREVIOUS DAY LOCKS"}
      </div>
    );
  }

  if (status === "LOCKED_PENDING_RESULTS") {
    return (
      <div className={`${shell} text-outline`}>
        <Icon name="lock" className={compact ? "text-base" : "text-xl"} />
        {compact ? "LOCKED" : "PREDICTIONS LOCKED — AWAITING RESULTS"}
      </div>
    );
  }

  if (status === "RESOLVED") {
    return pick ? (
      <div className={`${shell} text-white`}>
        <Icon name="how_to_vote" className={compact ? "text-base" : "text-xl"} />
        {compact ? `${pick.pointsAwarded} PTS` : `PICK CONFIRMED FOR ${pick.teamName} (${pick.pointsAwarded} PTS)`}
      </div>
    ) : (
      <div className={`${shell} text-outline`}>
        <Icon name="block" className={compact ? "text-base" : "text-xl"} />
        {compact ? "NO PICK" : "NO PICK SUBMITTED — MATCH RESOLVED"}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onLock}
      disabled={pending}
      className={
        compact
          ? "btn-primary font-headline flex w-full items-center justify-center gap-1.5 px-2 py-2.5 text-[11px] font-bold tracking-wide uppercase"
          : "btn-primary font-headline flex w-full items-center justify-center gap-2 py-4 text-lg font-bold tracking-widest uppercase"
      }
    >
      <Icon name="how_to_vote" className={compact ? "text-base" : "text-xl"} />
      {pending
        ? compact
          ? "LOCKING…"
          : "LOCKING…"
        : compact
          ? isPicked
            ? "PICKED"
            : "LOCK IN"
          : isPicked
            ? `PICK CONFIRMED FOR ${teamName}`
            : `LOCK IN PREDICTION FOR ${teamName}`}
    </button>
  );
}
