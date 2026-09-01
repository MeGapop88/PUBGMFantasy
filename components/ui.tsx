import Image from "next/image";
import type { ReactNode } from "react";

import type { Trend } from "@/lib/scoring";

/** A Material Symbol. Names must be listed in ICONS in app/layout.tsx. */
export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden>
      {name}
    </span>
  );
}

export type TeamLike = {
  teamName?: string;
  name?: string;
  logo?: string | null;
  initials?: string;
};

/**
 * Circular team badge: the logo if we have one, its initials if not.
 *
 * Contained rather than cropped — these are official transparent marks, so
 * object-cover would clip the edges of wide logos instead of fitting them.
 */
export function TeamBadge({
  team,
  size = 40,
  className = "border-2 border-primary",
}: {
  team: TeamLike;
  size?: number;
  className?: string;
}) {
  const name = team.teamName ?? team.name ?? "";
  const initials = team.initials ?? name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase();

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0E0E0F] ${className}`}
      style={{ width: size, height: size }}
      title={name}
    >
      {team.logo ? (
        <Image
          src={team.logo}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-contain p-0.5"
        />
      ) : (
        <span className="font-headline text-xs font-bold text-primary">{initials}</span>
      )}
    </span>
  );
}

/** Small stat block used across the hero rows and header cards. */
export function StatTile({
  label,
  value,
  sub,
  accent = false,
  className = "",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={`hud-card border border-outline-variant bg-[#0E0E0F] p-3 text-center ${className}`}>
      <div className="font-label mb-1 text-[10px] font-bold tracking-wider text-outline uppercase">
        {label}
      </div>
      <div
        className={`font-headline truncate text-2xl font-bold tracking-tight ${
          accent ? "text-primary" : "text-white"
        }`}
      >
        {value}
      </div>
      {sub ? (
        <div className="font-label mt-0.5 truncate text-[9px] font-bold text-primary">{sub}</div>
      ) : null}
    </div>
  );
}

/** Page header: eyebrow, title, and an optional right-hand slot. */
export function PageHead({
  eyebrow,
  icon,
  title,
  action,
}: {
  eyebrow: string;
  icon?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 border-b border-outline-variant pb-6 md:flex-row md:items-center">
      <div className="min-w-0">
        <div className="font-headline mb-1 flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase">
          {icon ? <Icon name={icon} className="text-base" /> : null}
          {eyebrow}
        </div>
        <h1 className="font-headline text-3xl font-bold tracking-tight text-white uppercase md:text-4xl">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}

/** Empty-state panel. */
export function EmptyState({
  icon = "folder_off",
  title,
  body,
  action,
}: {
  icon?: string;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="hud-card mx-auto max-w-xl border border-outline-variant p-12 text-center">
      <Icon name={icon} className="mb-4 block text-5xl text-outline" />
      <h2 className="font-headline mb-2 text-xl font-bold tracking-wider text-white uppercase">
        {title}
      </h2>
      {body ? <p className="font-label mb-4 text-xs text-outline">{body}</p> : null}
      {action}
    </div>
  );
}

/**
 * Form / action error. Actions return `{ error }` rather than throwing, and
 * this is where it surfaces.
 */
export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="font-label flex items-center gap-2 border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300"
    >
      <Icon name="error" className="text-sm" />
      {children}
    </p>
  );
}

export type PlayerView = "CARDS" | "LIST";

/** Cards-or-list switch for the roster and draft pools. */
export function ViewToggle({
  view,
  onChange,
}: {
  view: PlayerView;
  onChange: (v: PlayerView) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Layout"
      className="flex shrink-0 border border-outline-variant"
    >
      {(
        [
          ["CARDS", "grid_view"],
          ["LIST", "view_list"],
        ] as const
      ).map(([key, icon]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={view === key}
          title={key === "CARDS" ? "Card view" : "List view"}
          className={`font-headline flex items-center gap-1.5 px-3 py-2 text-xs font-bold tracking-wider uppercase transition-colors ${
            view === key ? "bg-primary/10 text-primary" : "text-outline hover:text-white"
          }`}
        >
          <Icon name={icon} className="text-base" />
          <span className="hidden sm:inline">{key}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Form trend arrow. Nothing renders for 'flat' or null — too little history, or
 * too small a change to call a direction.
 */
export function TrendBadge({ trend }: { trend: Trend | null }) {
  if (trend === "up") {
    return (
      <Icon name="arrow_upward" className="text-sm text-status-success" />
    );
  }
  if (trend === "down") {
    return <Icon name="arrow_downward" className="text-sm text-red-400" />;
  }
  return null;
}
