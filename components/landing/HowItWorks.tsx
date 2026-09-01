"use client";

import { Reveal, RevealGroup, RevealItem } from "@/components/landing/Reveal";
import SpotlightCard from "@/components/SpotlightCard";
import { Icon } from "@/components/ui";
import { MAX_PER_TEAM, POWER_WEIGHTS, SQUAD_SIZE } from "@/lib/scoring";

/**
 * The three rules of the draft, taken from lib/scoring.ts rather than restated
 * — the copy can't drift from the scoring that actually runs.
 *
 * SpotlightCard is React Bits (no dependencies); its spotlight colour is a prop,
 * so it takes the accent rather than shipping its stock white.
 */
const SPOTLIGHT = "rgba(255, 107, 0, 0.18)" as const;

export default function HowItWorks() {
  const steps = [
    {
      icon: "groups",
      step: "01",
      title: `PICK ${SQUAD_SIZE} OPERATIVES`,
      body: `Draft a squad from the full tournament field. Search, filter by team, sort by Power Score, K/D, average kills or damage — then lock it in.`,
    },
    {
      icon: "shield",
      step: "02",
      title: `MAX ${MAX_PER_TEAM} PER TEAM`,
      body: `You cannot stack one roster. At most ${MAX_PER_TEAM} operatives from any single team, enforced on the server, not just in the draft grid.`,
    },
    {
      icon: "leaderboard",
      step: "03",
      title: "SCORED ON POWER",
      body: `Each operative earns ${POWER_WEIGHTS.kill} per kill, ${POWER_WEIGHTS.knockout} per knockout, ${POWER_WEIGHTS.damage} per damage and ${POWER_WEIGHTS.survivalMinute} per minute survived. Your squad score is the sum.`,
    },
  ];

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-20">
      <Reveal className="mb-8 flex flex-col gap-2">
        <div className="font-headline flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase">
          <Icon name="groups" className="text-base" /> THE FANTASY DRAFT
        </div>
        <h2 className="font-headline text-3xl font-bold tracking-tight text-white uppercase md:text-4xl">
          Three rules. Then it&apos;s on you.
        </h2>
      </Reveal>

      <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-3" stagger={0.12}>
        {steps.map((s) => (
          <RevealItem key={s.step}>
            <SpotlightCard
              spotlightColor={SPOTLIGHT}
              className="hud-card relative h-full border border-outline-variant bg-[#1A1A1C] p-6"
            >
              <span
                aria-hidden
                className="font-headline absolute top-4 right-5 text-5xl font-bold text-primary/10"
              >
                {s.step}
              </span>
              <span className="mb-4 flex h-11 w-11 items-center justify-center border border-primary/40 bg-primary/10 text-primary">
                <Icon name={s.icon} className="text-xl" />
              </span>
              <h3 className="font-headline mb-2 text-lg font-bold tracking-wider text-white uppercase">
                {s.title}
              </h3>
              <p className="font-body text-sm leading-relaxed text-outline">{s.body}</p>
            </SpotlightCard>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
