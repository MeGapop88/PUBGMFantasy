import PredictionPane, {
  type PredDay,
} from "@/components/predictions/PredictionPane";
import { EmptyState, PageHead } from "@/components/ui";
import { lockPrediction, scoreResolvedPredictions } from "@/lib/actions";
import { fmt } from "@/lib/format";
import { getSchedule, getUserPredictions } from "@/lib/queries";
import { getDayStatus, getMatchStatus } from "@/lib/schedule";
import { requireUser } from "@/lib/session";

export default async function PredictionsPage() {
  const user = await requireUser();

  // Bring any pick whose match has since resolved up to date before reading.
  await scoreResolvedPredictions();

  const [schedule, predictions] = await Promise.all([
    getSchedule(),
    getUserPredictions(user.id),
  ]);

  if (schedule.length === 0) {
    return (
      <div className="py-12">
        <EmptyState title="NO MATCH SCHEDULE" body="Run npm run seed to build the tournament." />
      </div>
    );
  }

  const now = new Date();

  const days: PredDay[] = schedule.map((d) => ({
    id: d.id,
    label: d.label,
    status: getDayStatus(d, now),
    matches: d.matches.map((m) => ({
      key: m.key,
      phase: m.phase,
      day: m.day,
      game: m.game,
      hasResults: m.hasResults,
      status: getMatchStatus(m, d, now),
      winnerName: m.results.find((r) => r.rank === 1)?.team.name ?? null,
      teams: m.results.map((r) => ({
        teamId: r.teamId,
        teamName: r.team.name,
        initials: r.team.initials,
        logo: r.team.logo,
        rank: r.rank,
        kills: r.kills,
        damage: r.damage,
      })),
    })),
  }));

  const picks = Object.fromEntries(
    predictions.map((p) => [
      p.match.key,
      { teamId: p.teamId, teamName: p.team.name, pointsAwarded: p.pointsAwarded },
    ]),
  );

  const totalMatches = schedule.reduce((s, d) => s + d.matches.length, 0);
  const totalPoints = predictions.reduce((s, p) => s + p.pointsAwarded, 0);
  const perfect = predictions.filter((p) => p.pointsAwarded === 10).length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHead
        eyebrow="MATCH PREDICTIONS PROTOCOL"
        icon="target"
        title="TACTICAL PREDICTOR"
        action={
          <div className="grid grid-cols-3 gap-3 border border-outline-variant bg-[#1A1A1C] p-3">
            <div className="border-r border-outline-variant px-3 text-center">
              <div className="font-headline text-xl font-bold text-primary">
                {fmt(totalPoints)}
              </div>
              <div className="font-label text-[9px] tracking-widest text-outline uppercase">
                TOTAL PTS
              </div>
            </div>
            <div className="border-r border-outline-variant px-3 text-center">
              <div className="font-headline text-xl font-bold text-white">
                {predictions.length}/{totalMatches}
              </div>
              <div className="font-label text-[9px] tracking-widest text-outline uppercase">
                PICKS MADE
              </div>
            </div>
            <div className="px-3 text-center">
              <div className="font-headline text-xl font-bold text-status-success">{perfect}</div>
              <div className="font-label text-[9px] tracking-widest text-outline uppercase">
                PERFECT 10s
              </div>
            </div>
          </div>
        }
      />

      <PredictionPane days={days} picks={picks} lockAction={lockPrediction} />
    </div>
  );
}
