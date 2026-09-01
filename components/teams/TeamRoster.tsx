"use client";

import { useState } from "react";

import PlayerCard, { type PlayerCardData } from "@/components/PlayerCard";
import PlayerRow from "@/components/PlayerRow";
import CompareDialog from "@/components/compare/CompareDialog";
import CompareTray from "@/components/compare/CompareTray";
import { useCompare } from "@/components/compare/useCompare";
import { Icon, ViewToggle, type PlayerView } from "@/components/ui";
import { playerStats } from "@/lib/compare";

/**
 * A single team's operatives. Same cards-or-list switch as the main roster, but
 * without the search and team filters — there are only ever a handful here, and
 * every one of them is on the team whose page you are already looking at.
 */
export default function TeamRoster({ players }: { players: PlayerCardData[] }) {
  const [view, setView] = useState<PlayerView>("CARDS");
  const cmp = useCompare();
  const picked = cmp.ids.map((id) => players.find((p) => p.uid === id)).filter(Boolean) as PlayerCardData[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-headline flex items-center gap-2 text-xl font-bold tracking-wider text-white uppercase">
          <Icon name="badge" className="text-primary" /> TEAM ROSTER
        </h2>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {players.length === 0 ? (
        <div className="font-label py-12 text-center text-outline uppercase">
          No rostered operatives.
        </div>
      ) : view === "CARDS" ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {players.map((p) => (
            <PlayerCard
              key={p.uid}
              player={p}
              showTeam={false}
              compare={{ picked: cmp.isPicked(p.uid), onToggle: () => cmp.toggle(p.uid) }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {players.map((p) => (
            <PlayerRow
              key={p.uid}
              player={p}
              showTeam={false}
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
          stats={playerStats(picked[0], picked[1])}
        />
      )}
    </div>
  );
}
