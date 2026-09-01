"use client";

import { useMemo, useState } from "react";

import PlayerCard, { type PlayerCardData } from "@/components/PlayerCard";
import PlayerRow from "@/components/PlayerRow";
import CompareDialog from "@/components/compare/CompareDialog";
import CompareTray from "@/components/compare/CompareTray";
import { useCompare } from "@/components/compare/useCompare";
import { Icon, ViewToggle, type PlayerView } from "@/components/ui";
import { playerStats } from "@/lib/compare";

export default function RosterGrid({ players }: { players: PlayerCardData[] }) {
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState("ALL");
  const [view, setView] = useState<PlayerView>("CARDS");
  const cmp = useCompare();
  const picked = cmp.ids.map((id) => players.find((p) => p.uid === id)).filter(Boolean) as PlayerCardData[];

  const teams = useMemo(
    () => [...new Set(players.map((p) => p.teamName))].sort(),
    [players],
  );

  let shown = players;
  if (team !== "ALL") shown = shown.filter((p) => p.teamName === team);
  if (query) {
    const q = query.toLowerCase();
    shown = shown.filter(
      (p) => p.name.toLowerCase().includes(q) || p.teamName.toLowerCase().includes(q),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Icon
            name="search"
            className="absolute top-1/2 left-3 -translate-y-1/2 text-lg text-outline"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search operative or team..."
            aria-label="Search operatives"
            className="font-body w-full border border-outline-variant bg-[#1A1A1C] py-2.5 pr-4 pl-10 text-sm text-on-surface focus:border-primary focus:outline-none"
          />
        </div>

        <ViewToggle view={view} onChange={setView} />

        <div className="scrollbar-none flex min-w-0 gap-1 overflow-x-auto pb-1">
          {["ALL", ...teams].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTeam(t)}
              aria-pressed={team === t}
              className={`font-headline shrink-0 px-3 py-2 text-xs font-bold uppercase ${
                team === t ? "btn-primary" : "hud-card text-outline hover:border-primary"
              }`}
            >
              {t === "ALL" ? "ALL TEAMS" : t}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="font-label py-12 text-center text-outline uppercase">
          No operatives matching parameters.
        </div>
      ) : view === "CARDS" ? (
        // Two up on a phone: the card scales its own type by container width,
        // so it stays legible at roughly 170px across.
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => (
            <PlayerCard
              key={p.uid}
              player={p}
              compare={{ picked: cmp.isPicked(p.uid), onToggle: () => cmp.toggle(p.uid) }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map((p) => (
            <PlayerRow
              key={p.uid}
              player={p}
              compare={{ picked: cmp.isPicked(p.uid), onToggle: () => cmp.toggle(p.uid) }}
            />
          ))}
        </div>
      )}

      <CompareTray
        items={picked.map((p) => ({ id: p.uid, name: p.name, logo: p.teamLogo, initials: p.teamInitials, photo: p.photo }))}
        onRemove={cmp.remove}
        onCompare={cmp.show}
        onClear={cmp.clear}
      />

      {picked.length === 2 && (
        <CompareDialog
          open={cmp.open}
          onClose={cmp.hide}
          title="Operative comparison"
          a={{ id: picked[0].uid, name: picked[0].name, subtitle: picked[0].teamName, logo: picked[0].teamLogo, initials: picked[0].teamInitials, kind: "player", photo: picked[0].photo }}
          b={{ id: picked[1].uid, name: picked[1].name, subtitle: picked[1].teamName, logo: picked[1].teamLogo, initials: picked[1].teamInitials, kind: "player", photo: picked[1].photo }}
          stats={playerStats(
            { ...picked[0], uid: picked[0].uid },
            { ...picked[1], uid: picked[1].uid },
          )}
        />
      )}
    </div>
  );
}
