import Link from "next/link";
import { notFound } from "next/navigation";

import { Icon, TeamBadge, TrendBadge } from "@/components/ui";
import { fmt, fmtPower, fmtTime, ordinal, placementColor } from "@/lib/format";
import { getPlayerDossier } from "@/lib/queries";

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const player = await getPlayerDossier(uid);
  if (!player) notFound();

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <Link
          href="/players"
          className="btn-ghost font-headline inline-flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider uppercase"
        >
          <Icon name="arrow_back" className="text-base" /> BACK TO ROSTER
        </Link>
      </div>

      {/* Header */}
      <div className="hud-card relative flex flex-col items-start justify-between gap-6 overflow-hidden border border-outline-variant bg-[#1A1A1C] p-6 md:flex-row md:items-center md:p-8">
        <div className="flex min-w-0 items-center gap-5">
          <TeamBadge
            team={{
              teamName: player.teamName,
              logo: player.teamLogo,
              initials: player.teamInitials,
            }}
            size={80}
            className="border-2 border-primary"
          />
          <div className="min-w-0">
            <div className="font-headline truncate text-3xl font-bold tracking-tight text-white uppercase md:text-4xl">
              {player.name}
            </div>
            <Link
              href={`/teams/${player.teamId}`}
              className="font-headline mt-0.5 block truncate text-base font-bold tracking-wider text-primary uppercase hover:underline"
            >
              {player.teamName}
            </Link>
            <div className="font-label mt-1 text-xs text-outline uppercase">
              TELEMETRY ID: {player.uid}
            </div>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 md:w-auto">
          <div className="hud-card min-w-[100px] bg-[#0E0E0F] p-3 text-center">
            <div className="font-headline flex items-center justify-center gap-1 text-xl font-bold text-primary">
              {fmtPower(player.avgPower)} <TrendBadge trend={player.trend} />
            </div>
            <div className="font-label text-[9px] text-outline uppercase">POWER SCORE</div>
          </div>
          <div className="hud-card min-w-[100px] bg-[#0E0E0F] p-3 text-center">
            <div className="font-headline text-xl font-bold text-white">
              {fmt(player.avgEliminations, 1)}
            </div>
            <div className="font-label text-[9px] text-outline uppercase">AVG KILLS</div>
          </div>
          <div className="hud-card min-w-[100px] bg-[#0E0E0F] p-3 text-center">
            <div className="font-headline text-xl font-bold text-white">
              {fmt(player.avgDamage, 0)}
            </div>
            <div className="font-label text-[9px] text-outline uppercase">AVG DMG</div>
          </div>
          <div className="hud-card min-w-[100px] bg-[#0E0E0F] p-3 text-center">
            <div className="font-headline text-xl font-bold text-white">
              {player.matchesPlayed}
            </div>
            <div className="font-label text-[9px] text-outline uppercase">MATCHES</div>
          </div>
        </div>
      </div>

      {/* Bests */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          ["HIGHEST MATCH POWER", fmtPower(player.bestPower), true],
          ["BEST KILL GAME", `${player.bestKills} KILLS`, false],
          ["BEST DAMAGE GAME", `${fmt(player.bestDamage)} DMG`, false],
        ].map(([label, value, accent]) => (
          <div
            key={label as string}
            className="hud-card border border-outline-variant bg-[#1A1A1C] p-5"
          >
            <div className="font-label mb-1 text-xs tracking-widest text-outline uppercase">
              {label}
            </div>
            <div
              className={`font-headline text-3xl font-bold ${accent ? "text-primary" : "text-white"}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Match log — chronological, League before Finals */}
      <div className="hud-card border border-outline-variant bg-[#1A1A1C] p-6">
        <h2 className="font-headline mb-4 flex items-center gap-2 text-xl font-bold tracking-wider text-white uppercase">
          <Icon name="table_rows" className="text-primary" /> MATCH-BY-MATCH TELEMETRY
        </h2>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>GAME</th>
                <th>STAGE</th>
                <th>FINISH</th>
                <th>KILLS</th>
                <th>DAMAGE</th>
                <th>KNOCKDOWNS</th>
                <th>SURVIVAL TIME</th>
                <th>POWER SCORE</th>
              </tr>
            </thead>
            <tbody>
              {player.matches.map((m) => (
                <tr key={m.matchKey}>
                  <td className="font-headline font-bold text-white uppercase">
                    <Link href={`/match/${m.matchKey}`} className="hover:text-primary">
                      D{m.day} GAME {m.game}
                    </Link>
                  </td>
                  <td>
                    <span className="font-headline border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary uppercase">
                      {m.phase}
                    </span>
                  </td>
                  <td
                    className="font-headline font-bold"
                    style={{ color: placementColor(m.rank) }}
                  >
                    {ordinal(m.rank)}
                  </td>
                  <td className="font-headline text-base font-bold text-white">
                    {m.eliminations}
                  </td>
                  <td>{fmt(m.damage)}</td>
                  <td>{m.knockdowns}</td>
                  <td>{fmtTime(m.survivalTime)}</td>
                  <td className="font-headline text-base font-bold text-primary">
                    {fmtPower(m.power)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
