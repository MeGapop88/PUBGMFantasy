"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { CompareButton } from "@/components/compare/CompareTray";
import { TeamBadge, TrendBadge } from "@/components/ui";
import { fmt, fmtPower, getInitials } from "@/lib/format";
import { MAX_PER_TEAM, type Trend } from "@/lib/scoring";

export type PlayerCardData = {
  uid: string;
  name: string;
  teamName: string;
  teamInitials: string;
  teamLogo: string | null;
  avgPower: number;
  avgEliminations: number;
  avgDamage: number;
  kd: number;
  matchesPlayed: number;
  trend: Trend | null;
  /** Cutout headshot. Null for the two operatives without one. */
  photo?: string | null;
};

export type SelectMode = {
  selected: boolean;
  /** Blocked because the squad is full or this team is capped. */
  disabled: boolean;
  /** Specifically blocked by the 2-per-team cap — worth saying out loud. */
  capped: boolean;
  onSelect: () => void;
};

/** How far the card leans, in degrees, at the edges. */
const TILT = 10;

/** Competition label under the team name — the reference card's league line. */
const LEAGUE = "PMGO GLOBAL FINALS";

const FORM: Record<string, { dot: string; label: string }> = {
  up: { dot: "bg-status-success", label: "TRENDING UP" },
  down: { dot: "bg-red-400", label: "TRENDING DOWN" },
  flat: { dot: "bg-outline", label: "STEADY FORM" },
};

/**
 * The operative card — one component behind the roster, each team's profile,
 * the fantasy draft grid and the active squad, so the four can't drift apart.
 *
 * Geometry follows the Player Card v2 reference: the 340×500 portrait format
 * (held as an aspect ratio so it survives a responsive grid), 24px corners, the
 * number watermark top-right, the cutout between them, and a bottom block of
 * name → pills → three stats → status line. Colours stay Tactical Protocol.
 *
 * Follows the cursor: the card leans on two axes and a soft accent spotlight
 * tracks the pointer, with the crest, portrait and text block on separate Z
 * planes so the parallax reads as depth rather than a flat rotation.
 *
 * Motion is suppressed under prefers-reduced-motion by the .tilt-card rule in
 * globals.css, which overrides the inline transform.
 */
export default function PlayerCard({
  player,
  showTeam = true,
  select,
  role,
  slot,
  compare,
}: {
  player: PlayerCardData;
  showTeam?: boolean;
  /** Omit to link to the dossier; pass to make the card a draft toggle. */
  select?: SelectMode;
  /** Squad-only: positional role label, shown as a pill under the name. */
  role?: string;
  /** Squad-only: 1–4. Takes over the watermark, as the reference card's
      jersey number does. */
  slot?: number;
  /** Comparison toggle. Rendered outside the card's own link/button, since
      nesting one interactive element in another is invalid. */
  compare?: { picked: boolean; onToggle: () => void };
}) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [spot, setSpot] = useState({ x: 50, y: 40 });
  const [hover, setHover] = useState(false);

  const inert = select?.disabled ?? false;
  const form = FORM[player.trend ?? "flat"] ?? FORM.flat;

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    if (inert) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ rx: -(py - 0.5) * 2 * TILT, ry: (px - 0.5) * 2 * TILT });
    setSpot({ x: px * 100, y: py * 100 });
  };

  const reset = () => {
    setTilt({ rx: 0, ry: 0 });
    setSpot({ x: 50, y: 40 });
    setHover(false);
  };

  const ease =
    "transform 420ms cubic-bezier(0.16,1,0.3,1), border-color 320ms ease, box-shadow 420ms ease, color 240ms ease";

  const lit = hover || (select?.selected ?? false);

  const shell = {
    transformStyle: "preserve-3d" as const,
    transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${hover && !inert ? 1.02 : 1})`,
    transition: ease,
    borderColor: lit ? "rgba(255,107,0,0.45)" : "#2E2E32",
    boxShadow: select?.selected
      ? "0 0 15px rgba(255,107,0,0.3)"
      : hover
        ? "0 30px 60px -30px rgba(0,0,0,0.75)"
        : "0 16px 40px -30px rgba(0,0,0,0.7)",
  };

  // 340 × 500 in the reference, held as a ratio so the proportion survives a
  // responsive grid instead of depending on a fixed pixel height.
  const className = `tilt-card group relative flex aspect-[34/50] w-full flex-col overflow-hidden rounded-[24px] border text-left ${
    inert ? "cursor-not-allowed opacity-40" : "cursor-pointer"
  }`;

  const pill =
    "border border-primary/30 bg-primary/10 px-1.5 py-[2px] text-[9px] font-bold tracking-wide text-primary uppercase @[210px]:px-2.5 @[210px]:py-[3px] @[275px]:text-[11px]";

  const body = (
    <>
      {/* Ground + cursor spotlight */}
      <div className="absolute inset-0 overflow-hidden rounded-[24px]">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #1A1A1C 0%, #131314 62%, #0E0E0F 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(420px 300px at ${spot.x}% ${spot.y}%, rgba(255,107,0,0.12), transparent 70%)`,
            opacity: hover ? 1 : 0.35,
            transition: "opacity 320ms ease",
          }}
        />
      </div>

      {/* Number watermark, top-right as in the reference */}
      <span
        aria-hidden
        className="font-headline pointer-events-none absolute top-[9.6%] right-[5%] text-[40px] leading-[0.85] font-bold @[210px]:text-[56px] @[275px]:text-[72px]"
        style={{
          color: "rgba(237,234,227,0.06)",
          transform: `translateZ(${hover ? 12 : 0}px)`,
          transition: ease,
        }}
      >
        {slot ? String(slot).padStart(2, "0") : getInitials(player.name)}
      </span>

      {/* Top bar: crest, team, league, chevron */}
      <div
        className="relative flex shrink-0 items-center gap-2 p-2.5 @[210px]:gap-3 @[275px]:p-[18px]"
        style={{ transform: "translateZ(30px)" }}
      >
        <TeamBadge
          team={{
            teamName: player.teamName,
            logo: player.teamLogo,
            initials: player.teamInitials,
          }}
          size={30}
          className="rounded-[10px] border border-outline-variant @[275px]:rounded-[12px]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {showTeam && (
            <div className="truncate text-[10px] leading-none font-semibold text-paper @[275px]:text-[13px]">
              {player.teamName}
            </div>
          )}
          <div className="font-label hidden truncate text-[11px] leading-none text-outline uppercase @[210px]:block">
            {LEAGUE}
          </div>
        </div>
        {/* Decorative only — the compare toggle takes this corner when present. */}
        {!compare && (
          <span
            aria-hidden
            className={`font-headline shrink-0 text-[20px] leading-none transition-transform ${
              lit ? "translate-x-[3px] text-primary" : "text-outline"
            }`}
          >
            ›
          </span>
        )}
      </div>

      {/* Portrait fills whatever is left between the two bars, so it can never
          run under the name the way a fixed offset does once the card is
          narrower than the reference's 340×500. */}
      <div
        className="pointer-events-none relative mx-[4%] min-h-0 flex-1"
        style={{
          transformStyle: "preserve-3d",
          transform: hover
            ? "translate3d(0, -22px, 80px) scale(1.06)"
            : "translate3d(0, 0, 24px) scale(1)",
          transition: ease,
          filter: hover
            ? "drop-shadow(0 26px 26px rgba(4,4,5,0.55))"
            : "drop-shadow(0 10px 16px rgba(4,4,5,0.5))",
        }}
      >
        {player.photo && (
          <Image
            src={player.photo}
            alt=""
            fill
            sizes="(max-width: 640px) 90vw, 340px"
            className="object-contain object-bottom"
          />
        )}
      </div>

      {/* Bottom: name → pills → stats → status */}
      <div
        className="relative flex shrink-0 flex-col gap-2 p-2.5 @[210px]:gap-3 @[275px]:gap-3.5 @[275px]:p-[18px]"
        style={{ transform: "translateZ(46px)" }}
      >
        {/* Blends the cutout's base into the block below it. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-16 h-16"
          style={{
            background: "linear-gradient(180deg, transparent 0%, #0E0E0F 100%)",
          }}
        />
        <div className="flex flex-col gap-1.5">
          <div className="font-headline truncate text-[15px] leading-[1.05] font-bold tracking-tight text-white uppercase @[210px]:text-[20px] @[275px]:text-[27px]">
            {player.name}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {role && <span className={pill}>{role}</span>}
            <span className={`${pill} flex items-center gap-1 tabular-nums`}>
              {fmtPower(player.avgPower)}
              <TrendBadge trend={player.trend} />
            </span>
            {select && <DraftPill select={select} />}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-0.5 border-t border-outline-variant pt-3">
          {[
            [player.kd.toFixed(2), "K/D"],
            [fmt(player.avgEliminations, 1), "AVG KILLS"],
            [fmt(player.avgDamage, 0), "AVG DMG"],
          ].map(([value, label]) => (
            <div key={label} className="flex min-w-0 flex-col gap-[3px]">
              <div className="font-headline text-[13px] leading-none font-bold text-on-surface tabular-nums @[210px]:text-[16px] @[275px]:text-[19px]">
                {value}
              </div>
              <div className="font-label truncate text-[8px] tracking-wide text-outline uppercase @[210px]:text-[10px] @[275px]:text-[11px]">
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="font-label flex items-center justify-between gap-2 text-[9px] text-outline @[275px]:text-[11px]">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${form.dot}`} />
            <span className="hidden truncate uppercase @[210px]:inline">{form.label}</span>
          </span>
          <span className="shrink-0 tabular-nums uppercase">{player.matchesPlayed} games</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="@container relative" style={{ perspective: "1200px", perspectiveOrigin: "50% 45%" }}>
      {select ? (
        <button
          type="button"
          onClick={select.onSelect}
          disabled={select.disabled}
          aria-pressed={select.selected}
          onMouseMove={onMove}
          onMouseEnter={() => !inert && setHover(true)}
          onMouseLeave={reset}
          className={className}
          style={shell}
        >
          {body}
        </button>
      ) : (
        <Link
          href={`/players/${player.uid}`}
          onMouseMove={onMove}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={reset}
          className={className}
          style={shell}
        >
          {body}
        </Link>
      )}

      {compare && (
        <CompareButton
          picked={compare.picked}
          onToggle={compare.onToggle}
          label={player.name}
          className="absolute top-2 right-2 z-30 h-7 w-7"
        />
      )}
    </div>
  );
}

function DraftPill({ select }: { select: SelectMode }): ReactNode {
  if (select.selected) {
    return (
      <span className="font-headline bg-primary px-2.5 py-[3px] text-[11px] font-bold tracking-wide text-black uppercase">
        DRAFTED
      </span>
    );
  }
  if (select.capped) {
    return (
      <span className="font-label border border-status-live/40 bg-status-live/10 px-2.5 py-[3px] text-[11px] font-bold tracking-wide text-status-live uppercase">
        CAP {MAX_PER_TEAM}/{MAX_PER_TEAM}
      </span>
    );
  }
  return null;
}
