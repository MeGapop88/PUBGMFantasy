import Boards from "@/components/leaderboard/Boards";
import { getFantasyStandings, getPredictorStandings } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function LeaderboardPage() {
  const user = await requireUser();
  const [fantasy, predictors] = await Promise.all([
    getFantasyStandings(),
    getPredictorStandings(),
  ]);

  return (
    <Boards
      currentUserId={user.id}
      predictors={predictors}
      fantasy={fantasy.map((f) => ({
        squadId: f.squadId,
        userId: f.userId,
        userName: f.userName,
        squadName: f.squadName,
        score: f.score,
        roster: f.roster.map((p) => ({
          uid: p.uid,
          name: p.name,
          teamName: p.teamName,
          teamInitials: p.teamInitials,
          teamLogo: p.teamLogo,
          avgPower: p.avgPower,
        })),
      }))}
    />
  );
}
