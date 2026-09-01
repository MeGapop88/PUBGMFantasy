import Link from "next/link";
import { notFound } from "next/navigation";

import TeamRoster from "@/components/teams/TeamRoster";
import { Icon, TeamBadge } from "@/components/ui";
import { fmt } from "@/lib/format";
import { getPlayerAggregates, getTeamAggregates } from "@/lib/queries";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [teams, players] = await Promise.all([getTeamAggregates(), getPlayerAggregates()]);

  const team = teams.find((t) => String(t.teamId) === id);
  if (!team) notFound();

  const roster = players
    .filter((p) => p.teamId === team.teamId)
    .sort((a, b) => b.avgPower - a.avgPower);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <Link
          href="/teams"
          className="btn-ghost font-headline inline-flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider uppercase"
        >
          <Icon name="arrow_back" className="text-base" /> BACK TO TEAMS
        </Link>
      </div>

      <div className="hud-card relative flex flex-col items-start justify-between gap-6 overflow-hidden border border-outline-variant bg-[#1A1A1C] p-6 md:flex-row md:items-center md:p-8">
        <div className="flex min-w-0 items-center gap-5">
          <TeamBadge
            team={{ teamName: team.teamName, logo: team.logo, initials: team.initials }}
            size={80}
            className="border-2 border-primary"
          />
          <div className="min-w-0">
            <div className="font-headline truncate text-3xl font-bold tracking-tight text-white uppercase md:text-4xl">
              {team.teamName}
            </div>
            <div className="font-label mt-1 text-xs text-outline uppercase">
              {roster.length} ROSTERED OPERATIVES
            </div>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 md:w-auto">
          {[
            ["WWCD WINS", team.wins, true],
            ["TOTAL KILLS", team.totalKills, false],
            ["AVG PLACEMENT", fmt(team.avgPlacement, 1), false],
            ["MATCHES", team.matchesPlayed, false],
          ].map(([label, value, accent]) => (
            <div
              key={label as string}
              className="hud-card min-w-[100px] bg-[#0E0E0F] p-3 text-center"
            >
              <div
                className={`font-headline text-xl font-bold ${accent ? "text-primary" : "text-white"}`}
              >
                {value}
              </div>
              <div className="font-label text-[9px] text-outline uppercase">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <TeamRoster
        players={roster.map((p) => ({
          uid: p.uid,
          name: p.name,
          teamName: p.teamName,
          teamInitials: p.teamInitials,
          teamLogo: p.teamLogo,
          photo: p.photo,
          avgPower: p.avgPower,
          avgEliminations: p.avgEliminations,
          avgDamage: p.avgDamage,
          kd: p.kd,
          matchesPlayed: p.matchesPlayed,
          trend: p.trend,
        }))}
      />
    </div>
  );
}
