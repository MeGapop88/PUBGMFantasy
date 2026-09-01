"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Icon, TeamBadge } from "@/components/ui";

export type MatchSummary = {
  key: string;
  phase: string;
  day: number;
  game: number;
  hasResults: boolean;
  teamCount: number;
  totalKills: number;
  topFrags: number;
  winner: { name: string; logo: string | null; initials: string } | null;
};

/**
 * The tournament's matches, grouped by day, filtered by phase.
 *
 * Phase order is explicit rather than alphabetical — sorting the names puts
 * Finals before League, which is the wrong way round.
 */
const PHASE_ORDER = ["League", "Finals"];

export default function MatchGrid({ matches }: { matches: MatchSummary[] }) {
  const phases = PHASE_ORDER.filter((p) => matches.some((m) => m.phase === p));
  const [phase, setPhase] = useState<string>(phases[0] ?? "ALL");
  const [pageId, setPageId] = useState<string | null>(null);

  const shown = phase === "ALL" ? matches : matches.filter((m) => m.phase === phase);

  // One page per phase+day, never per day alone: under ALL MATCHES that would
  // put League Day 1 and Finals Day 1 on the same page.
  const pages = [...new Map(shown.map((m) => [`${m.phase}_D${m.day}`, m])).keys()]
    .map((id) => {
      const [p, d] = id.split("_D");
      return {
        id,
        phase: p,
        day: Number(d),
        label: phase === "ALL" ? `${p} D${d}` : `DAY ${d}`,
        matches: shown.filter((m) => m.phase === p && m.day === Number(d)),
      };
    })
    .sort((a, b) => PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase) || a.day - b.day);

  // Derived rather than synced: switching phase can strip the selected page out
  // from under us, and falling back here avoids an effect that renders one
  // frame of nothing first.
  const index = Math.max(0, pages.findIndex((p) => p.id === pageId));
  const page = pages[index] ?? pages[0];
  const go = (i: number) => setPageId(pages[i]?.id ?? null);

  // Stepping with the arrows can walk the active chip past the edge of its
  // scroller, so drag it back into view whenever the page changes.
  const chipsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chipsRef.current
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [page?.id]);

  const tab = (value: string, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setPhase(value)}
      aria-pressed={phase === value}
      className={`font-headline px-4 py-1.5 text-xs font-bold tracking-wider uppercase ${
        phase === value ? "btn-primary" : "hud-card text-on-surface-variant hover:border-primary"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-outline-variant pb-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-headline flex items-center gap-2 text-2xl font-bold tracking-wider text-white uppercase">
            <Icon name="apps" className="text-primary" /> MATCH GRID TELEMETRY
          </h2>
          <p className="font-label mt-0.5 text-xs text-outline">
            Click any match card to inspect the game results &amp; player performance
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {phases.map((p) => tab(p, p))}
          {tab("ALL", "ALL MATCHES")}
        </div>
      </div>

      {/* Day paginator */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Previous day"
          className="hud-card flex shrink-0 items-center justify-center border border-outline-variant p-2 text-outline transition-colors enabled:hover:border-primary enabled:hover:text-primary disabled:opacity-30"
        >
          <Icon name="chevron_left" className="text-lg" />
        </button>

        <div ref={chipsRef} className="scrollbar-none flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
          {pages.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => go(i)}
              aria-pressed={p.id === page?.id}
              className={`font-headline shrink-0 border px-3 py-2 text-xs font-bold tracking-wider uppercase transition-colors ${
                p.id === page?.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-outline-variant text-outline hover:border-outline hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index >= pages.length - 1}
          aria-label="Next day"
          className="hud-card flex shrink-0 items-center justify-center border border-outline-variant p-2 text-outline transition-colors enabled:hover:border-primary enabled:hover:text-primary disabled:opacity-30"
        >
          <Icon name="chevron_right" className="text-lg" />
        </button>
      </div>

      {page && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-headline flex items-center gap-2 text-base font-bold tracking-widest text-primary uppercase">
              <span className="h-2 w-2 bg-primary" /> {page.phase} DAY {page.day}
            </h3>
            <span className="font-label text-xs tracking-widest text-outline uppercase">
              {page.matches.length} GAMES · {index + 1}/{pages.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {page.matches.map((m) => (
              <Link
                key={m.key}
                href={`/match/${m.key}`}
                className="hud-card @container group relative flex flex-col justify-between overflow-hidden border border-outline-variant bg-[#1A1A1C] p-3 transition-all hover:border-primary @[220px]:p-5"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-headline text-base font-bold tracking-wider text-white @[220px]:text-xl">
                        GAME {m.game}
                      </span>
                      <span className="font-headline hidden border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary uppercase @[220px]:inline">
                        {m.phase}
                      </span>
                    </div>
                    <Icon
                      name="arrow_forward"
                      className="text-lg text-outline transition-colors group-hover:text-primary"
                    />
                  </div>

                  <div className="mb-4 h-px bg-outline-variant" />

                  <div className="mb-3 grid grid-cols-3 gap-1 text-center @[220px]:mb-4 @[220px]:gap-2">
                    {[
                      ["TEAMS", m.teamCount],
                      ["KILLS", m.totalKills],
                      ["FRAGS", m.topFrags],
                    ].map(([label, value], i) => (
                      <div
                        key={label as string}
                        className="border border-outline-variant/60 bg-[#0E0E0F] p-2"
                      >
                        <div
                          className={`font-headline text-sm font-bold @[220px]:text-lg ${i === 2 ? "text-primary" : "text-white"}`}
                        >
                          {value}
                        </div>
                        <div className="font-label truncate text-[8px] tracking-wider text-outline uppercase @[220px]:text-[9px]">
                          {label === "FRAGS" ? (
                            <>
                              <span className="hidden @[220px]:inline">TOP </span>
                              FRAGS
                            </>
                          ) : (
                            label
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {m.winner ? (
                    <div className="mb-2 flex items-center justify-between gap-2 border border-status-success/20 bg-status-success/5 p-2.5">
                      <span className="font-label flex shrink-0 items-center gap-1 text-[10px] font-bold tracking-widest text-status-success uppercase">
                        <Icon name="emoji_events" className="text-xs" />
                        <span className="hidden @[220px]:inline">WINNER</span>
                      </span>
                      <div className="flex items-center gap-2 truncate">
                        <TeamBadge
                          team={m.winner}
                          size={20}
                          className="border border-status-success/60"
                        />
                        <span className="font-headline truncate text-xs font-bold tracking-wide text-white uppercase @[220px]:text-sm">
                          {m.winner.name}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="font-label mb-2 border border-dashed border-outline-variant p-2.5 text-center text-[9px] tracking-widest text-outline uppercase @[220px]:text-[10px]">
                      NOT PLAYED
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-outline-variant/40 pt-2 text-xs text-outline">
                  <span className="font-label hidden text-[10px] uppercase @[220px]:inline">INSPECT TELEMETRY</span>
                  <span className="font-headline flex items-center gap-0.5 font-bold text-primary uppercase transition-transform group-hover:translate-x-1">
                    <span className="hidden @[220px]:inline">VIEW RESULT</span>
                    <Icon name="chevron_right" className="text-sm" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}