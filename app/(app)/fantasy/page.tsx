import SquadBuilder, { type PoolPlayer } from "@/components/fantasy/SquadBuilder";
import { EmptyState } from "@/components/ui";
import { saveSquad } from "@/lib/actions";
import { getPlayerAggregates, getUserSquad } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function FantasyPage() {
  const user = await requireUser();
  const [aggregates, squad] = await Promise.all([
    getPlayerAggregates(),
    getUserSquad(user.id),
  ]);

  if (aggregates.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          title="NO PLAYER TELEMETRY INGESTED"
          body="Run npm run seed to unlock Fantasy Squad deployment."
        />
      </div>
    );
  }

  // 79 operatives — small enough to hand the whole pool to the client and
  // filter there, rather than round-tripping every keystroke.
  const pool: PoolPlayer[] = aggregates
    .slice()
    .sort((a, b) => b.totalPower - a.totalPower)
    .map((a) => ({
      uid: a.uid,
      name: a.name,
      teamId: a.teamId,
      teamName: a.teamName,
      teamInitials: a.teamInitials,
      teamLogo: a.teamLogo,
      photo: a.photo,
      avgPower: a.avgPower,
      kd: a.kd,
      avgEliminations: a.avgEliminations,
      avgDamage: a.avgDamage,
      matchesPlayed: a.matchesPlayed,
      trend: a.trend,
    }));

  return (
    <SquadBuilder
      pool={pool}
      initialUids={squad?.picks.map((p) => p.playerUid) ?? []}
      initialName={squad?.name ?? "SQUADRON ZERO"}
      saveAction={saveSquad}
    />
  );
}
