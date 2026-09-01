"use client";

import Link from "next/link";

import type { PlayerCardData, SelectMode } from "@/components/PlayerCard";
import { CompareButton } from "@/components/compare/CompareTray";
import { Icon, TeamBadge, TrendBadge } from "@/components/ui";
import { fmt, fmtPower } from "@/lib/format";
import { MAX_PER_TEAM } from "@/lib/scoring";

const DOT: Record<string, string> = {
  up: "bg-status-success",
  down: "bg-red-400",
  flat: "bg-outline",
};

/**
 * Dense row alternative to PlayerCard, for the list view.
 *
 * Same data and the same select/link split, roughly a seventh of the height —
 * the whole point is scanning 79 operatives without 50 screens of scrolling.
 * The trailing stats drop away below `sm`, where there is no room for them.
 */
export default function PlayerRow({
  player,
  showTeam = true,
  select,
  compare,
}: {
  player: PlayerCardData;
  showTeam?: boolean;
  select?: SelectMode;
  /** Sits beside the row rather than inside it — a button cannot nest in a
      link, and the row itself is one or the other. */
  compare?: { picked: boolean; onToggle: () => void };
}) {
  const inert = select?.disabled ?? false;

  const className = `group flex w-full items-center gap-3 border p-2.5 text-left transition-colors ${
    select?.selected
      ? "border-primary bg-primary/10"
      : inert
        ? "cursor-not-allowed border-outline-variant bg-[#1A1A1C] opacity-40"
        : "border-outline-variant bg-[#1A1A1C] hover:border-primary"
  }`;

  const body = (
    <>
      <TeamBadge
        team={{
          teamName: player.teamName,
          logo: player.teamLogo,
          initials: player.teamInitials,
        }}
        size={34}
        className={
          select?.selected
            ? "rounded-[10px] border-2 border-primary"
            : "rounded-[10px] border border-outline-variant"
        }
      />

      <div className="min-w-0 flex-1">
        <div className="font-headline flex items-center gap-1.5 truncate text-sm font-bold text-white uppercase transition-colors group-hover:text-primary">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[player.trend ?? "flat"] ?? "bg-outline"}`}
          />
          <span className="truncate">{player.name}</span>
        </div>
        <div className="font-label truncate text-[10px] text-outline uppercase">
          {showTeam ? `${player.teamName} · ` : ""}
          {player.matchesPlayed} games
        </div>
      </div>

      {/* Secondary stats only where there is room for them. */}
      <div className="hidden shrink-0 items-center gap-5 sm:flex">
        {[
          [player.kd.toFixed(2), "K/D"],
          [fmt(player.avgEliminations, 1), "AVG K"],
          [fmt(player.avgDamage, 0), "AVG DMG"],
        ].map(([value, label]) => (
          <div key={label} className="flex w-14 flex-col items-end">
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
        {fmtPower(player.avgPower)}
        <TrendBadge trend={player.trend} />
      </span>

      <span className="shrink-0">
        {select ? (
          select.selected ? (
            <span className="font-headline bg-primary px-2 py-1 text-[10px] font-bold text-black uppercase">
              DRAFTED
            </span>
          ) : select.capped ? (
            <span className="font-label text-[9px] font-bold text-status-live uppercase">
              CAP {MAX_PER_TEAM}/{MAX_PER_TEAM}
            </span>
          ) : (
            <Icon name="add" className="text-lg text-primary" />
          )
        ) : (
          <Icon
            name="chevron_right"
            className="text-lg text-outline transition-colors group-hover:text-primary"
          />
        )}
      </span>
    </>
  );

  const row = select ? (
    <button
      type="button"
      onClick={select.onSelect}
      disabled={select.disabled}
      aria-pressed={select.selected}
      className={className}
    >
      {body}
    </button>
  ) : (
    <Link href={`/players/${player.uid}`} className={className}>
      {body}
    </Link>
  );

  if (!compare) return row;

  return (
    <div className="flex items-stretch gap-2">
      <div className="min-w-0 flex-1">{row}</div>
      <CompareButton
        picked={compare.picked}
        onToggle={compare.onToggle}
        label={player.name}
        className="w-11 shrink-0"
      />
    </div>
  );
}
