"use client";

import { useEffect, useRef } from "react";

import Image from "next/image";

import { Icon, TeamBadge } from "@/components/ui";
import { getInitials } from "@/lib/format";

/** One side of the comparison — a team or an operative. */
export type CompareSide = {
  id: string;
  name: string;
  subtitle: string;
  /** Team crest. The avatar for a team, the small tag beside an operative. */
  logo: string | null;
  initials: string;
  /** Which portrait to lead with. A team shows its crest; an operative shows
      their own headshot, so a squad of four teammates is still tellable apart. */
  kind: "team" | "player";
  /** Operative headshot. Null for the two without one — they fall back to
      initials rather than borrowing the team crest. */
  photo?: string | null;
};

export type CompareStat = {
  label: string;
  a: number;
  b: number;
  /** How the raw number is shown. Defaults to a plain integer. */
  format?: (n: number) => string;
  /** Placement and similar: the smaller number is the better one. */
  lowerIsBetter?: boolean;
};

/**
 * Side-by-side comparison in a native <dialog>.
 *
 * Native rather than a hand-rolled overlay: Escape, the top layer, backdrop
 * rendering and focus containment all come from the platform, so the only
 * things left to write are the close-on-backdrop-click and the layout.
 *
 * A drawer at every width: bottom-anchored and slid up from below, capped to a
 * readable column on wide screens rather than becoming a centred box. Sizing
 * and the slide live in the `.compare` rule in globals.css.
 */
export default function CompareDialog({
  open,
  onClose,
  title,
  a,
  b,
  stats,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  a: CompareSide;
  b: CompareSide;
  stats: CompareStat[];
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Escape and the close button both fire `close`; funnel them to one handler
  // so the parent's state can never drift from the element's.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handle = () => onClose();
    el.addEventListener("close", handle);
    return () => el.removeEventListener("close", handle);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="compare"
      aria-label={title}
      // The dialog element fills the viewport, so a click landing on it rather
      // than the panel inside is a click on the backdrop.
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col lg:max-w-3xl">
        <div className="hud-card flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-b-0 border-outline-variant bg-[#131314] sm:max-h-[86dvh]">
          {/* Grab handle — the affordance that says this came up from below. */}
          <div className="flex shrink-0 justify-center pt-2.5 pb-1">
            <span aria-hidden className="h-1 w-10 rounded-full bg-outline/50" />
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant bg-[#1A1A1C] px-4 pt-2 pb-3">
            <h2 className="font-headline flex items-center gap-2 text-base font-bold tracking-wider text-white uppercase">
              <Icon name="compare_arrows" className="text-lg text-primary" />
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close comparison"
              className="shrink-0 p-1 text-outline transition-colors hover:text-white"
            >
              <Icon name="close" className="text-xl" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-px border-b border-outline-variant bg-outline-variant">
              {[a, b].map((side) => (
                <div
                  key={side.id}
                  className="flex flex-col items-center gap-2 bg-[#1A1A1C] p-4 text-center"
                >
                  <SideAvatar side={side} />
                  <div className="min-w-0 w-full">
                    <div className="font-headline truncate text-sm font-bold text-white uppercase sm:text-lg">
                      {side.name}
                    </div>
                    <div className="font-label flex min-w-0 items-center justify-center gap-1.5 text-[10px] text-outline uppercase">
                      {side.kind === "player" && side.logo && (
                        <TeamBadge
                          team={{ teamName: side.subtitle, logo: side.logo, initials: side.initials }}
                          size={14}
                          className="rounded-[4px] border-0"
                        />
                      )}
                      <span className="truncate">{side.subtitle}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col">
              {stats.map((s) => (
                <StatRow key={s.label} stat={s} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

/** Headshot for an operative, crest for a team, initials when neither exists. */
function SideAvatar({ side }: { side: CompareSide }) {
  if (side.kind === "team") {
    return (
      <TeamBadge
        team={{ teamName: side.name, logo: side.logo, initials: side.initials }}
        size={64}
        className="rounded-[12px] border border-primary/50"
      />
    );
  }

  if (side.photo) {
    return (
      <div className="relative h-24 w-full max-w-[96px] sm:h-28 sm:max-w-[112px]">
        <Image
          src={side.photo}
          alt=""
          fill
          sizes="112px"
          className="object-contain object-bottom"
        />
      </div>
    );
  }

  return (
    <div className="font-headline flex h-24 w-full max-w-[96px] items-center justify-center border border-outline-variant bg-[#0E0E0F] text-2xl font-bold text-primary/40 sm:h-28 sm:max-w-[112px]">
      {getInitials(side.name)}
    </div>
  );
}

function StatRow({ stat }: { stat: CompareStat }) {
  const fmt = stat.format ?? ((n: number) => String(Math.round(n)));
  const better = stat.lowerIsBetter
    ? stat.a === stat.b
      ? null
      : stat.a < stat.b
        ? "a"
        : "b"
    : stat.a === stat.b
      ? null
      : stat.a > stat.b
        ? "a"
        : "b";

  // Bars are shares of the pair, not of some absolute maximum — the point is
  // the gap between these two, and a zero-zero row must not divide by zero.
  const total = Math.abs(stat.a) + Math.abs(stat.b);
  const share = (v: number) => (total > 0 ? (Math.abs(v) / total) * 100 : 50);

  return (
    <div className="border-b border-outline-variant/50 px-4 py-3 last:border-b-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span
          className={`font-headline text-sm font-bold tabular-nums sm:text-base ${
            better === "a" ? "text-primary" : "text-on-surface"
          }`}
        >
          {fmt(stat.a)}
        </span>
        <span className="font-label shrink-0 text-[10px] tracking-widest text-outline uppercase">
          {stat.label}
        </span>
        <span
          className={`font-headline text-sm font-bold tabular-nums sm:text-base ${
            better === "b" ? "text-primary" : "text-on-surface"
          }`}
        >
          {fmt(stat.b)}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex h-1.5 flex-1 justify-end overflow-hidden bg-[#0E0E0F]">
          <div
            className={better === "a" ? "bg-primary" : "bg-outline/50"}
            style={{ width: `${share(stat.a)}%` }}
          />
        </div>
        <div className="flex h-1.5 flex-1 overflow-hidden bg-[#0E0E0F]">
          <div
            className={better === "b" ? "bg-primary" : "bg-outline/50"}
            style={{ width: `${share(stat.b)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
