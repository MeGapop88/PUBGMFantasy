"use client";

import Link from "next/link";
import { useState } from "react";

import CompareDialog from "@/components/compare/CompareDialog";
import CompareTray, { CompareButton } from "@/components/compare/CompareTray";
import { useCompare } from "@/components/compare/useCompare";
import { Icon, TeamBadge, ViewToggle, type PlayerView } from "@/components/ui";
import { teamStats } from "@/lib/compare";
import { fmt } from "@/lib/format";

export type TeamCardData = {
  teamId: number;
  teamName: string;
  initials: string;
  logo: string | null;
  matchesPlayed: number;
  wins: number;
  totalKills: number;
  totalPoints: number;
  totalDamage: number;
  top3: number;
  totalPlacePts: number;
  avgPlacement: number;
};

/** Cards two-up on a phone, or a dense list — same switch as the roster. */
export default function TeamsView({ teams }: { teams: TeamCardData[] }) {
  const [view, setView] = useState<PlayerView>("CARDS");
  const cmp = useCompare();
  const picked = cmp.ids
    .map((id) => teams.find((t) => String(t.teamId) === id))
    .filter((t): t is TeamCardData => Boolean(t));

  const compareFor = (t: TeamCardData) => ({
    picked: cmp.isPicked(String(t.teamId)),
    onToggle: () => cmp.toggle(String(t.teamId)),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-label text-xs text-outline uppercase">
          {teams.length} teams
        </span>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === "CARDS" ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {teams.map((t) => (
            <TeamCard key={t.teamId} team={t} compare={compareFor(t)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {teams.map((t) => (
            <TeamRow key={t.teamId} team={t} compare={compareFor(t)} />
          ))}
        </div>
      )}

      <CompareTray
        items={picked.map((t) => ({ id: String(t.teamId), name: t.teamName, logo: t.logo, initials: t.initials }))}
        onRemove={cmp.remove}
        onCompare={cmp.show}
        onClear={cmp.clear}
      />

      {picked.length === 2 && (
        <CompareDialog
          open={cmp.open}
          onClose={cmp.hide}
          title="Team comparison"
          a={{ id: String(picked[0].teamId), name: picked[0].teamName, subtitle: `${picked[0].matchesPlayed} matches`, logo: picked[0].logo, initials: picked[0].initials, kind: "team" }}
          b={{ id: String(picked[1].teamId), name: picked[1].teamName, subtitle: `${picked[1].matchesPlayed} matches`, logo: picked[1].logo, initials: picked[1].initials, kind: "team" }}
          stats={teamStats(picked[0], picked[1])}
        />
      )}
    </div>
  );
}

/** Type scales off the card's own width, so it survives being half a phone. */
export function TeamCard({
  team,
  compare,
}: {
  team: TeamCardData;
  /** Omit on surfaces with no comparison tray — the landing page. */
  compare?: { picked: boolean; onToggle: () => void };
}) {
  return (
    <div className="@container relative">
      <Link
        href={`/teams/${team.teamId}`}
        className="hud-card group flex h-full flex-col justify-between border border-outline-variant bg-[#1A1A1C] p-3 transition-all hover:border-primary @[220px]:p-4"
      >
        <div>
          <div className="mb-3 flex items-center gap-2 @[220px]:gap-3 @[220px]:mb-4">
            <TeamBadge
              team={{ teamName: team.teamName, logo: team.logo, initials: team.initials }}
              size={40}
              className="border border-primary/50 transition-transform group-hover:scale-105"
            />
            <div className="min-w-0">
              <div className="font-headline truncate text-sm font-bold text-white uppercase transition-colors group-hover:text-primary @[220px]:text-lg">
                {team.teamName}
              </div>
              <div className="font-label text-[10px] text-outline uppercase @[220px]:text-xs">
                {team.matchesPlayed} matches
              </div>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-1 border border-outline-variant/60 bg-[#0E0E0F] p-2 text-center @[220px]:p-2.5">
            {[
              [team.wins, "WWCD", true],
              [team.totalKills, "KILLS", false],
              [team.totalPoints, "PTS", false],
            ].map(([value, label, accent]) => (
              <div key={label as string}>
                <div
                  className={`font-headline text-sm font-bold @[220px]:text-base ${
                    accent ? "text-primary" : "text-white"
                  }`}
                >
                  {value}
                </div>
                <div className="font-label text-[8px] text-outline uppercase">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant/40 pt-2 text-[10px] text-outline @[220px]:text-xs">
          <span className="font-label truncate">{fmt(team.totalDamage)} DMG</span>
          <span className="font-headline flex shrink-0 items-center gap-0.5 font-bold text-primary uppercase transition-transform group-hover:translate-x-1">
            <span className="hidden @[220px]:inline">ROSTER</span>
            <Icon name="chevron_right" className="text-sm" />
          </span>
        </div>
      </Link>

      {compare && (
        <CompareButton
          picked={compare.picked}
          onToggle={compare.onToggle}
          label={team.teamName}
          className="absolute top-2 right-2 z-20 h-7 w-7"
        />
      )}
    </div>
  );
}

function TeamRow({
  team,
  compare,
}: {
  team: TeamCardData;
  compare: { picked: boolean; onToggle: () => void };
}) {
  return (
    <div className="flex items-stretch gap-2">
    <Link
      href={`/teams/${team.teamId}`}
      className="group flex min-w-0 flex-1 items-center gap-3 border border-outline-variant bg-[#1A1A1C] p-2.5 transition-colors hover:border-primary"
    >
      <TeamBadge
        team={{ teamName: team.teamName, logo: team.logo, initials: team.initials }}
        size={34}
        className="rounded-[10px] border border-outline-variant"
      />

      <div className="min-w-0 flex-1">
        <div className="font-headline truncate text-sm font-bold text-white uppercase transition-colors group-hover:text-primary">
          {team.teamName}
        </div>
        <div className="font-label truncate text-[10px] text-outline uppercase">
          {team.matchesPlayed} matches · {fmt(team.totalDamage)} dmg
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-5 sm:flex">
        {[
          [team.wins, "WWCD"],
          [team.totalKills, "KILLS"],
        ].map(([value, label]) => (
          <div key={label as string} className="flex w-14 flex-col items-end">
            <span className="font-headline text-sm font-bold text-on-surface tabular-nums">
              {value}
            </span>
            <span className="font-label text-[9px] tracking-wide text-outline uppercase">
              {label}
            </span>
          </div>
        ))}
      </div>

      <span className="font-headline flex shrink-0 items-center gap-1 border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-bold text-primary tabular-nums">
        {team.totalPoints} PTS
      </span>

      <Icon
        name="chevron_right"
        className="shrink-0 text-lg text-outline transition-colors group-hover:text-primary"
      />
    </Link>
      <CompareButton
        picked={compare.picked}
        onToggle={compare.onToggle}
        label={team.teamName}
        className="w-11 shrink-0"
      />
    </div>
  );
}
