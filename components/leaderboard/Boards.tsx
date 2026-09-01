"use client";

import Link from "next/link";
import { useState } from "react";

import { Icon, TeamBadge } from "@/components/ui";
import { fmt, fmtPower } from "@/lib/format";

export type FantasyRow = {
  squadId: string;
  userId: string;
  userName: string;
  squadName: string;
  score: number;
  roster: {
    uid: string;
    name: string;
    teamName: string;
    teamInitials: string;
    teamLogo: string | null;
    avgPower: number;
  }[];
};

export type PredictorRow = {
  userId: string;
  name: string;
  points: number;
  picks: number;
  perfect: number;
};

const RANK_COLOR: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };

function RankBadge({ rank }: { rank: number }) {
  return (
    <div
      className="font-headline flex h-12 w-12 shrink-0 items-center justify-center border text-xl font-bold"
      style={{
        borderColor: RANK_COLOR[rank] ?? "#2E2E32",
        color: RANK_COLOR[rank] ?? "#a98a7d",
      }}
    >
      #{rank}
    </div>
  );
}

export default function Boards({
  fantasy,
  predictors,
  currentUserId,
}: {
  fantasy: FantasyRow[];
  predictors: PredictorRow[];
  currentUserId: string;
}) {
  const [tab, setTab] = useState<"FANTASY" | "PREDICTIONS">("FANTASY");

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-outline-variant pb-6 md:flex-row md:items-center">
        <div>
          <div className="font-headline mb-1 flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase">
            <Icon name="leaderboard" className="text-base" /> GLOBAL COMPETITIVE STANDINGS
          </div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-white uppercase md:text-4xl">
            TOURNAMENT LEADERBOARD
          </h1>
        </div>

        <div className="flex gap-2">
          {(
            [
              ["FANTASY", "FANTASY SQUADS"],
              ["PREDICTIONS", "PREDICTORS"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
              className={`font-headline px-4 py-2 text-xs font-bold tracking-wider uppercase ${
                tab === key ? "btn-primary" : "hud-card text-outline hover:border-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {tab === "FANTASY"
          ? fantasy.length === 0
            ? <Empty
                icon="groups"
                title="NO FANTASY SQUADS LOCKED IN YET"
                body="Be the first operative to build and lock in a fantasy squad."
                href="/fantasy"
                cta="BUILD SQUAD DRAFT"
              />
            : fantasy.map((entry, i) => {
                const mine = entry.userId === currentUserId;
                return (
                  <div
                    key={entry.squadId}
                    className={`hud-card flex flex-col items-start justify-between gap-4 border p-4 transition-all md:flex-row md:items-center ${
                      mine
                        ? "border-primary bg-primary/10"
                        : "border-outline-variant bg-[#1A1A1C] hover:border-outline"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <RankBadge rank={i + 1} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-headline truncate text-lg font-bold text-white uppercase">
                            {entry.squadName}
                          </span>
                          {mine && (
                            <span className="font-headline bg-primary px-2 py-0.5 text-[9px] font-bold text-black uppercase">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="font-label mb-2 text-xs text-outline uppercase">
                          OPERATIVE: {entry.userName}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {entry.roster.map((p) => (
                            <Link
                              key={p.uid}
                              href={`/players/${p.uid}`}
                              className="font-label flex items-center gap-1.5 border border-outline-variant/60 bg-[#0E0E0F] px-2 py-1 text-[10px] text-outline hover:border-primary"
                            >
                              <TeamBadge
                                team={{
                                  teamName: p.teamName,
                                  logo: p.teamLogo,
                                  initials: p.teamInitials,
                                }}
                                size={16}
                                className="border border-outline-variant"
                              />
                              <strong className="text-white">{p.name}</strong>
                              <span className="font-bold text-primary">
                                {fmtPower(p.avgPower)}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full items-center justify-between border-t border-outline-variant pt-3 text-left md:w-auto md:flex-col md:items-end md:border-t-0 md:pt-0 md:text-right">
                      <span className="font-label text-[10px] text-outline uppercase">
                        TOTAL SQUAD POWER
                      </span>
                      <span className="font-headline text-2xl font-bold text-primary">
                        {fmtPower(entry.score)}
                      </span>
                    </div>
                  </div>
                );
              })
          : predictors.length === 0
            ? <Empty
                icon="target"
                title="NO PREDICTION TELEMETRY YET"
                body="Go to match predictions to lock in your picks."
                href="/predictions"
                cta="MAKE PREDICTIONS"
              />
            : predictors.map((entry, i) => {
                const mine = entry.userId === currentUserId;
                return (
                  <div
                    key={entry.userId}
                    className={`hud-card flex items-center justify-between gap-4 border p-4 transition-all ${
                      mine
                        ? "border-primary bg-primary/10"
                        : "border-outline-variant bg-[#1A1A1C] hover:border-outline"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <RankBadge rank={i + 1} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-headline truncate text-lg font-bold text-white uppercase">
                            {entry.name}
                          </span>
                          {mine && (
                            <span className="font-headline bg-primary px-2 py-0.5 text-[9px] font-bold text-black uppercase">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="font-label mt-0.5 text-xs text-outline uppercase">
                          {entry.picks} PICKS · {entry.perfect} PERFECT 10s
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="font-label text-[10px] text-outline uppercase">
                        PREDICTION POINTS
                      </div>
                      <div className="font-headline text-2xl font-bold text-primary">
                        {fmt(entry.points)} PTS
                      </div>
                    </div>
                  </div>
                );
              })}
      </div>
    </div>
  );
}

function Empty({
  icon,
  title,
  body,
  href,
  cta,
}: {
  icon: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="hud-card mx-auto max-w-xl border border-outline-variant p-12 text-center">
      <Icon name={icon} className="mb-4 block text-5xl text-outline" />
      <h3 className="font-headline mb-2 text-xl font-bold text-white uppercase">{title}</h3>
      <p className="font-body mb-4 text-xs text-outline">{body}</p>
      <Link
        href={href}
        className="btn-primary font-headline inline-flex px-6 py-2.5 text-xs font-bold uppercase"
      >
        {cta}
      </Link>
    </div>
  );
}
