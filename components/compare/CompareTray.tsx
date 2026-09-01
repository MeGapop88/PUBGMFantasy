"use client";

import Image from "next/image";

import { Icon, TeamBadge } from "@/components/ui";

export type TrayItem = {
  id: string;
  name: string;
  logo: string | null;
  initials: string;
  /** Operative headshot, when the tray is holding players. */
  photo?: string | null;
};

/**
 * Floating strip listing what is selected for comparison.
 *
 * `offsetClass` exists because the fantasy draft already pins a dock to the
 * bottom of the viewport — the tray has to stack above it rather than land on
 * top of it.
 */
export default function CompareTray({
  items,
  onRemove,
  onCompare,
  onClear,
  offsetClass = "bottom-0",
}: {
  items: TrayItem[];
  onRemove: (id: string) => void;
  onCompare: () => void;
  onClear: () => void;
  offsetClass?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className={`fixed inset-x-0 z-30 ${offsetClass}`}>
      <div className="mx-auto max-w-[1600px] px-3 pb-3">
        <div className="hud-card flex items-center gap-2 border border-primary/40 bg-[#131314] p-2.5 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.8)]">
          <span className="font-label hidden shrink-0 text-[10px] tracking-widest text-outline uppercase sm:inline">
            Compare
          </span>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            {items.map((it) => (
              <span
                key={it.id}
                className="flex min-w-0 items-center gap-1.5 border border-outline-variant bg-[#1A1A1C] py-1 pr-1 pl-1.5"
              >
                {it.photo ? (
                  <span className="relative h-6 w-5 shrink-0 overflow-hidden">
                    <Image
                      src={it.photo}
                      alt=""
                      fill
                      sizes="20px"
                      className="object-contain object-bottom"
                    />
                  </span>
                ) : (
                  <TeamBadge
                    team={{ teamName: it.name, logo: it.logo, initials: it.initials }}
                    size={22}
                    className="rounded-[6px] border border-outline-variant"
                  />
                )}
                <span className="font-headline truncate text-[11px] font-bold text-white uppercase">
                  {it.name}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(it.id)}
                  aria-label={`Remove ${it.name} from comparison`}
                  className="shrink-0 p-0.5 text-outline hover:text-red-400"
                >
                  <Icon name="close" className="text-sm" />
                </button>
              </span>
            ))}

            {items.length === 1 && (
              <span className="font-label hidden shrink-0 text-[10px] text-outline uppercase sm:inline">
                pick one more
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClear}
            aria-label="Clear comparison"
            className="shrink-0 p-1.5 text-outline transition-colors hover:text-white"
          >
            <Icon name="close" className="text-base" />
          </button>

          <button
            type="button"
            onClick={onCompare}
            disabled={items.length < 2}
            // The label is icon-only below sm, so it needs a name of its own.
            aria-label="Open comparison"
            className="btn-primary font-headline flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs font-bold tracking-wider uppercase"
          >
            <Icon name="compare_arrows" className="text-base" />
            <span className="hidden sm:inline">COMPARE</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** The per-item toggle that feeds the tray. */
export function CompareButton({
  picked,
  onToggle,
  label,
  className = "",
}: {
  picked: boolean;
  onToggle: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={picked}
      title={picked ? `Remove ${label} from comparison` : `Compare ${label}`}
      aria-label={picked ? `Remove ${label} from comparison` : `Compare ${label}`}
      className={`flex items-center justify-center border transition-colors ${
        picked
          ? "border-primary bg-primary text-black"
          : "border-outline-variant bg-[#0E0E0F]/90 text-outline hover:border-primary hover:text-primary"
      } ${className}`}
    >
      <Icon name="compare_arrows" className="text-sm" />
    </button>
  );
}
