import RosterGrid from "@/components/players/RosterGrid";
import { EmptyState, PageHead } from "@/components/ui";
import { getPlayerAggregates } from "@/lib/queries";

export default async function PlayersPage() {
  const aggregates = await getPlayerAggregates();

  if (aggregates.length === 0) {
    return (
      <div className="py-12">
        <EmptyState title="NO PLAYER TELEMETRY" body="Run npm run seed to load the roster." />
      </div>
    );
  }

  const teamCount = new Set(aggregates.map((a) => a.teamName)).size;

  const players = aggregates
    .slice()
    .sort((a, b) => b.totalPower - a.totalPower)
    .map((a) => ({
      uid: a.uid,
      name: a.name,
      teamName: a.teamName,
      teamInitials: a.teamInitials,
      teamLogo: a.teamLogo,
      photo: a.photo,
      avgPower: a.avgPower,
      avgEliminations: a.avgEliminations,
      avgDamage: a.avgDamage,
      kd: a.kd,
      matchesPlayed: a.matchesPlayed,
      trend: a.trend,
    }));

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHead
        eyebrow="COMPETITIVE PLAYER DATABASE"
        icon="badge"
        title="PLAYER TELEMETRY ROSTER"
        action={
          <div className="font-label border border-outline-variant bg-[#1A1A1C] p-3 text-xs text-outline">
            <span>
              {players.length} OPERATIVES · {teamCount} TEAMS
            </span>
          </div>
        }
      />

      <RosterGrid players={players} />
    </div>
  );
}
