"use client";

import Link from "next/link";

import { Reveal } from "@/components/landing/Reveal";
import ShinyText from "@/components/ShinyText";
import { Icon } from "@/components/ui";
import { fmt } from "@/lib/format";
import { PREDICTION_PAYOUT } from "@/lib/scoring";

/**
 * Predictions and the final call-to-action, merged into one band.
 *
 * They were two stacked full-width sections saying much the same thing; the
 * second mode of play is a footnote to the draft, not a peer of it.
 */
export default function Closer({
  signedIn,
  kills,
  matches,
}: {
  signedIn: boolean;
  kills: number;
  matches: number;
}) {
  return (
    <section className="border-t border-outline-variant">
      <div className="mx-auto grid max-w-[1600px] gap-px bg-outline-variant px-0 md:grid-cols-[1.4fr_1fr]">
        <Reveal className="bg-background px-4 py-14 md:px-8 md:py-20">
          <h2 className="font-headline text-3xl font-bold tracking-tight uppercase md:text-4xl">
            <ShinyText
              text="Your squad is four picks away."
              color="#ffffff"
              shineColor="#ff6b00"
              speed={4}
              spread={28}
            />
          </h2>
          <p className="font-body mt-3 max-w-md text-sm text-outline">
            {fmt(kills)} eliminations logged across {matches} games. Every one of them is
            worth points to somebody.
          </p>
          <Link
            href={signedIn ? "/fantasy" : "/login"}
            className="btn-primary font-headline mt-7 inline-flex items-center gap-2 px-8 py-4 text-sm font-bold tracking-widest uppercase"
          >
            <Icon name="groups" className="text-lg" />
            {signedIn ? "GO TO DRAFT" : "START YOUR SQUAD"}
          </Link>
        </Reveal>

        <Reveal delay={0.12} className="bg-[#101012] px-4 py-14 md:px-8 md:py-20">
          <div className="font-headline mb-2 flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase">
            <Icon name="target" className="text-base" /> ALSO IN PLAY
          </div>
          <h3 className="font-headline mb-2 text-xl font-bold tracking-tight text-white uppercase">
            Call one winner per game
          </h3>
          <p className="font-body mb-5 text-sm text-outline">
            One locked pick per match. The payout decays across the top five finishes,
            and picks close on a real deadline.
          </p>
          <div className="font-label grid grid-cols-5 gap-1 text-center text-[10px]">
            {PREDICTION_PAYOUT.map((pts, i) => (
              <div
                key={pts}
                className={`border p-2 ${
                  i === 0
                    ? "border-primary bg-primary/15 font-bold text-primary"
                    : "border-outline-variant text-outline"
                }`}
              >
                <div className="font-headline text-base">{pts}</div>
                <div className="mt-0.5">{i + 1}
                  {["st", "nd", "rd", "th", "th"][i]}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
