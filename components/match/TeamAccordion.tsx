"use client";

import Link from "next/link";
import { useState } from "react";

import { Icon, TeamBadge } from "@/components/ui";
import { fmt, fmtPower, fmtTime, placementColor } from "@/lib/format";

export type MatchTeam = {
  teamId: number;
  teamName: string;
  initials: string;
  logo: string | null;
  rank: number;
  kills: number;
  placePts: number;
  totalMatchPts: number;
  players: {
    uid: string;
    name: string;
    eliminations: number;
    knockdowns: number;
    damage: number;
    survivalTime: number;
    headShots: number;
    power: number;
  }[];
};

const COLS = "grid-cols-[50px_1fr_70px_80px_100px_40px]";

const GLOW: Record<number, string> = {
  1: "border-primary shadow-[inset_0_0_10px_rgba(255,107,0,0.4)]",
  2: "border-[#2E2E32] shadow-[inset_0_0_10px_rgba(255,107,0,0.25)]",
  3: "border-[#2E2E32] shadow-[inset_0_0_10px_rgba(255,107,0,0.15)]",
};

export default function TeamAccordion({
  teams,
  initialTeamId,
}: {
  teams: MatchTeam[];
  initialTeamId: number | null;
}) {
  const [openId, setOpenId] = useState<number | null>(initialTeamId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-headline flex items-center gap-2 text-xl font-bold tracking-wider text-white uppercase">
          <Icon name="format_list_numbered" className="text-primary" /> TEAM STANDINGS &amp; PLAYER
          ROSTERS
        </h2>
        <span className="font-label hidden text-xs text-outline uppercase sm:block">
          Click any team to inspect operatives
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div
            className={`grid ${COLS} font-headline gap-2 border border-outline-variant bg-[#0E0E0F] px-4 py-2.5 text-xs font-bold tracking-wider text-outline uppercase`}
          >
            <div className="text-center">RANK</div>
            <div>TEAM</div>
            <div className="text-right">KILLS</div>
            <div className="text-right">PLACE PTS</div>
            <div className="text-right text-primary">MATCH PTS</div>
            <div />
          </div>

          <div className="mt-2.5 flex flex-col gap-2.5">
            {teams.map((t) => {
              const isTop3 = t.rank <= 3;
              const isOpen = openId === t.teamId;

              return (
                <div
                  key={t.teamId}
                  className={`hud-card overflow-hidden border bg-[#1A1A1C] transition-all ${
                    isTop3 ? (GLOW[t.rank] ?? "border-outline-variant") : "border-outline-variant"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : t.teamId)}
                    aria-expanded={isOpen}
                    className={`grid ${COLS} w-full cursor-pointer items-center gap-2 p-3.5 text-left transition-colors select-none hover:bg-surface-container-high ${
                      isOpen ? "border-b border-outline-variant/60 bg-primary/5" : ""
                    }`}
                  >
                    <div
                      className="font-headline text-center text-lg font-bold"
                      style={{ color: placementColor(t.rank) }}
                    >
                      {t.rank}
                    </div>

                    <div className="flex min-w-0 items-center gap-3">
                      <TeamBadge
                        team={t}
                        size={32}
                        className={isTop3 ? "border-2 border-primary" : "border border-outline-variant"}
                      />
                      <div className="min-w-0">
                        <span className="font-headline block truncate text-base font-bold text-white uppercase">
                          {t.teamName}
                        </span>
                        {t.rank === 1 && (
                          <span className="font-label text-[9px] font-bold tracking-wider text-status-success uppercase">
                            WWCD 1ST PLACE
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="font-headline text-right text-base font-bold text-white">
                      {t.kills}
                    </div>
                    <div className="font-headline text-right text-sm font-bold text-outline">
                      +{t.placePts}
                    </div>
                    <div className="font-headline text-right text-xl font-bold text-primary">
                      {t.totalMatchPts} PTS
                    </div>

                    <div className="text-right text-outline">
                      <Icon
                        name="expand_more"
                        className={`text-lg transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="animate-fadeIn flex flex-col gap-3 bg-[#0E0E0F] p-4">
                      <div className="font-headline flex items-center gap-1.5 text-xs font-bold tracking-widest text-primary uppercase">
                        <Icon name="groups" className="text-sm" /> {t.teamName} OPERATIVE
                        PERFORMANCE
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead>
                            <tr className="font-headline border-b border-outline-variant/60 text-[10px] font-bold tracking-wider text-outline uppercase">
                              <th className="px-3 py-2">OPERATIVE</th>
                              <th className="px-3 py-2 text-right">KILLS</th>
                              <th className="px-3 py-2 text-right">KNOCKOUTS (KP)</th>
                              <th className="px-3 py-2 text-right">DAMAGE</th>
                              <th className="px-3 py-2 text-right">SURVIVAL</th>
                              <th className="px-3 py-2 text-right">HEADSHOTS</th>
                              <th className="px-3 py-2 text-right text-primary">POWER</th>
                            </tr>
                          </thead>
                          <tbody>
                            {t.players.map((p) => (
                              <tr
                                key={p.uid}
                                className="border-b border-outline-variant/30 transition-colors hover:bg-[#1A1A1C]"
                              >
                                <td className="px-3 py-2.5">
                                  <Link
                                    href={`/players/${p.uid}`}
                                    className="font-headline flex items-center gap-2 font-bold text-white uppercase hover:text-primary"
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    {p.name}
                                  </Link>
                                </td>
                                <td className="font-headline px-3 py-2.5 text-right text-sm font-bold text-white">
                                  {p.eliminations}
                                </td>
                                <td className="font-headline px-3 py-2.5 text-right font-bold text-outline">
                                  {p.knockdowns}
                                </td>
                                <td className="font-headline px-3 py-2.5 text-right text-white">
                                  {fmt(p.damage)}
                                </td>
                                <td className="font-label px-3 py-2.5 text-right text-outline">
                                  {fmtTime(p.survivalTime)}
                                </td>
                                <td className="font-headline px-3 py-2.5 text-right text-outline">
                                  {p.headShots}
                                </td>
                                <td className="font-headline px-3 py-2.5 text-right text-sm font-bold text-primary">
                                  {fmtPower(p.power)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
