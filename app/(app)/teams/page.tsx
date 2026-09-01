import TeamsView from "@/components/teams/TeamsView";
import { EmptyState, PageHead } from "@/components/ui";
import { getTeamAggregates } from "@/lib/queries";

export default async function TeamsPage() {
  const teams = await getTeamAggregates();

  if (teams.length === 0) {
    return (
      <div className="py-12">
        <EmptyState title="NO TEAM ROSTER DATA" body="Run npm run seed to load the roster." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHead eyebrow="TOURNAMENT PARTICIPANTS" icon="shield" title="COMPETING TEAMS" />

      <TeamsView
        teams={teams.map((t) => ({
          teamId: t.teamId,
          teamName: t.teamName,
          initials: t.initials,
          logo: t.logo,
          matchesPlayed: t.matchesPlayed,
          wins: t.wins,
          totalKills: t.totalKills,
          totalPoints: t.totalPoints,
          totalDamage: t.totalDamage,
          top3: t.top3,
          totalPlacePts: t.totalPlacePts,
          avgPlacement: t.avgPlacement,
        }))}
      />
    </div>
  );
}
