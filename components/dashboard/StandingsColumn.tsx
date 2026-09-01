import { fmt } from "@/lib/format";
import { placementColor } from "@/lib/format";
import type { StandingsRow } from "@/lib/queries";
import { Icon, TeamBadge } from "@/components/ui";

const COLS = "grid-cols-[45px_1fr_60px_65px_75px_95px]";

/** Top three carry an inset accent glow, strongest at first. */
const GLOW: Record<number, string> = {
  1: "border-primary shadow-[inset_0_0_10px_rgba(255,107,0,0.4)]",
  2: "border-[#2E2E32] shadow-[inset_0_0_10px_rgba(255,107,0,0.25)]",
  3: "border-[#2E2E32] shadow-[inset_0_0_10px_rgba(255,107,0,0.15)]",
};

/**
 * Eight rows of the tournament table. Two of these sit side by side on wide
 * screens and stack on narrow ones.
 *
 * The scroll container is per column rather than around the pair — a single
 * wrapper around both lets the 500px minimum push the whole page sideways once
 * the grid collapses to one column.
 */
export default function StandingsColumn({ teams }: { teams: StandingsRow[] }) {
  return (
    <div className="min-w-0">
      {/* Phone: a compact row per team. The six-column table needs 500px, which
          on a 390px screen meant two side-scrolling boxes with TOTAL PTS —
          the one column that decides the standings — parked off-screen. */}
      <div className="flex flex-col gap-2 sm:hidden">
        {teams.map((t) => {
          const isTop3 = t.tournamentRank <= 3;
          return (
            <div
              key={t.teamId}
              className={`hud-card flex items-center gap-2.5 border bg-[#131314] p-2.5 ${
                isTop3 ? (GLOW[t.tournamentRank] ?? "border-outline-variant") : "border-outline-variant"
              }`}
            >
              <span
                className="font-headline w-7 shrink-0 text-center text-base font-bold"
                style={{ color: placementColor(t.tournamentRank) }}
              >
                #{t.tournamentRank}
              </span>
              <TeamBadge
                team={{ teamName: t.teamName, logo: t.logo, initials: t.initials }}
                size={28}
                className={isTop3 ? "border border-primary" : "border border-outline-variant"}
              />
              <span className="min-w-0 flex-1">
                <span className="font-headline block truncate text-sm font-bold text-white uppercase">
                  {t.teamName}
                </span>
                <span className="font-label block truncate text-[10px] text-outline">
                  {t.matchesPlayed}G · {t.wins} WWCD · {t.totalKills} K · +{t.totalPlacePts}
                </span>
              </span>
              <span className="font-headline shrink-0 text-lg font-bold text-primary tabular-nums">
                {t.totalPoints}
              </span>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto sm:block">
      <div className="flex min-w-[500px] flex-col gap-2.5">
        <div
          className={`grid ${COLS} font-headline items-center gap-2 border border-outline-variant bg-[#0E0E0F] px-3.5 py-2.5 text-xs font-bold tracking-wider text-outline uppercase`}
        >
          <div className="text-center">RANK</div>
          <div>TEAM</div>
          <div className="text-right">WWCD</div>
          <div className="text-right">KILLS</div>
          <div className="text-right">PLACE</div>
          <div className="text-right text-primary">TOTAL PTS</div>
        </div>

        <div className="flex flex-col gap-2">
          {teams.map((t) => {
            const rank = t.tournamentRank;
            const isTop3 = rank <= 3;

            return (
              <div
                key={t.teamId}
                className={`hud-card grid ${COLS} items-center gap-2 border bg-[#131314] p-3 transition-all hover:border-primary ${
                  isTop3 ? (GLOW[rank] ?? "border-outline-variant") : "border-outline-variant opacity-90"
                }`}
              >
                <div
                  className="font-headline text-center text-base font-bold"
                  style={{ color: placementColor(rank) }}
                >
                  #{rank}
                </div>

                <div className="flex min-w-0 items-center gap-2.5">
                  <TeamBadge
                    team={{ teamName: t.teamName, logo: t.logo, initials: t.initials }}
                    size={32}
                    className={isTop3 ? "border-2 border-primary" : "border border-outline-variant"}
                  />
                  <div className="min-w-0">
                    <span className="font-headline block truncate text-sm font-bold text-white uppercase">
                      {t.teamName}
                    </span>
                    <span className="font-label block truncate text-[9px] text-outline">
                      {t.matchesPlayed}G · {fmt(t.totalDamage)} DMG
                    </span>
                  </div>
                </div>

                <div className="font-headline flex items-center justify-end gap-0.5 text-right text-sm font-bold text-white">
                  {t.wins > 0 && (
                    <Icon name="emoji_events" className="text-[13px] text-status-success" />
                  )}
                  <span>{t.wins}</span>
                </div>

                <div className="font-headline text-right text-sm font-bold text-white">
                  {t.totalKills}
                </div>
                <div className="font-headline text-right text-xs font-bold text-outline">
                  +{t.totalPlacePts}
                </div>
                <div className="font-headline text-right text-lg font-bold text-primary">
                  {t.totalPoints}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
