import Link from "next/link";

import Closer from "@/components/landing/Closer";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import LandingHeader from "@/components/landing/LandingHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/Reveal";
import TeamMarquee from "@/components/landing/TeamMarquee";
import PlayerCard from "@/components/PlayerCard";
import { TeamCard } from "@/components/teams/TeamsView";
import { Icon } from "@/components/ui";
import { getFinalsStandings, getMatchSummaries, getPlayerAggregates } from "@/lib/queries";
import { getSessionUser } from "@/lib/session";

/**
 * Public landing page.
 *
 * Outside app/(app), so it has no session guard — an anonymous visitor used to
 * be bounced from / straight to /login and never saw what the product was.
 * Signed-in visitors get the same page with the CTAs re-pointed, rather than a
 * redirect, so it stays reachable without logging out.
 *
 * Five bands: hero (which carries the tournament numbers), the crest strip, the
 * three draft rules, the field, and the closer. Operatives and teams share one
 * band because they are the same claim — here is who you are drafting — and two
 * separate headed sections made the page read as a list of lists.
 */
export default async function LandingPage() {
  const [user, players, standings, matches] = await Promise.all([
    getSessionUser(),
    getPlayerAggregates(),
    getFinalsStandings(),
    getMatchSummaries(),
  ]);

  const signedIn = Boolean(user);
  const kills = players.reduce((s, p) => s + p.totalEliminations, 0);

  const topOperatives = [...players].sort((a, b) => b.avgPower - a.avgPower).slice(0, 4);
  const topTeams = standings.slice(0, 4);

  const logos = standings
    .filter((t) => t.logo)
    .map((t) => ({ src: t.logo as string, alt: t.teamName, href: `/teams/${t.teamId}` }));

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <LandingHeader signedIn={signedIn} />

      <main className="flex-1">
        <Hero
          signedIn={signedIn}
          teams={standings.length}
          operatives={players.length}
          matches={matches.length}
          kills={kills}
        />

        <TeamMarquee logos={logos} />

        <HowItWorks />

        {/* The field — operatives and teams under one header */}
        <section className="mx-auto max-w-[1600px] px-4 pb-20 md:px-8">
          <Reveal className="mb-8 flex flex-col gap-2">
            <div className="font-headline flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase">
              <Icon name="badge" className="text-base" /> THE FIELD
            </div>
            <h2 className="font-headline text-3xl font-bold tracking-tight text-white uppercase md:text-4xl">
              Who you&apos;re drafting from.
            </h2>
          </Reveal>

          <Row
            label="Top operatives by Power Score"
            href={signedIn ? "/players" : "/login"}
            cta={`ALL ${players.length}`}
          >
            {topOperatives.map((p) => (
              <RevealItem key={p.uid}>
                <PlayerCard
                  player={{
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
                  }}
                />
              </RevealItem>
            ))}
          </Row>

          <Row
            label="Teams leading the finals"
            href={signedIn ? "/teams" : "/login"}
            cta={`ALL ${standings.length}`}
          >
            {topTeams.map((t) => (
              <RevealItem key={t.teamId}>
                <TeamCard
                  team={{
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
                  }}
                />
              </RevealItem>
            ))}
          </Row>
        </section>

        <Closer signedIn={signedIn} kills={kills} matches={matches.length} />
      </main>

      <footer className="border-t border-outline-variant px-4 py-6 md:px-8">
        <div className="font-label mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 text-[10px] tracking-widest text-outline uppercase sm:flex-row">
          <span>PMGO ARENA · TACTICAL PROTOCOL</span>
          <span>Independent fantasy table · not affiliated with any organizer</span>
        </div>
      </footer>
    </div>
  );
}

/** A labelled 2-up/4-up card row inside the field band. */
function Row({
  label,
  href,
  cta,
  children,
}: {
  label: string;
  href: string;
  cta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10 last:mb-0">
      <Reveal className="mb-4 flex items-baseline justify-between gap-3 border-b border-outline-variant pb-2">
        <h3 className="font-label text-[11px] tracking-widest text-outline uppercase">
          {label}
        </h3>
        <Link
          href={href}
          className="font-headline flex shrink-0 items-center gap-1 text-[11px] font-bold tracking-wider text-primary uppercase hover:underline"
        >
          {cta} <Icon name="chevron_right" className="text-sm" />
        </Link>
      </Reveal>
      <RevealGroup className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {children}
      </RevealGroup>
    </div>
  );
}
