"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import CountUp from "@/components/CountUp";
import DecryptedText from "@/components/DecryptedText";
import { Icon } from "@/components/ui";

/**
 * Landing hero.
 *
 * Also carries the tournament numbers: they used to sit in a separate tile row
 * directly underneath, which restated the same four figures the hero already
 * listed in prose. One strip, one place.
 *
 * The backdrop is a still, parallaxed against the scroll rather than animated
 * on its own clock — the page only moves when the reader does.
 */
export default function Hero({
  signedIn,
  teams,
  operatives,
  matches,
  kills,
}: {
  signedIn: boolean;
  teams: number;
  operatives: number;
  matches: number;
  kills: number;
}) {
  const reduce = useReducedMotion();
  const ease = [0.16, 1, 0.3, 1] as const;
  const words = ["DRAFT", "FOUR", "OPERATIVES."];

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Hooks can't be conditional, so reduced motion flattens the output ranges
  // rather than skipping the transforms.
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["0%", "16%"]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.08, 1.2]);
  const fade = useTransform(scrollYProgress, [0, 0.9], reduce ? [1, 1] : [1, 0.15]);

  const rise = (i: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: reduce ? 0 : i * 0.08, duration: 0.6, ease },
  });

  const stats: [number, string][] = [
    [teams, "TEAMS"],
    [operatives, "OPERATIVES"],
    [matches, "MATCHES"],
    [kills, "ELIMINATIONS"],
  ];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-b border-outline-variant md:min-h-[660px]"
    >
      <motion.div
        aria-hidden
        style={{ y, scale, opacity: fade }}
        className="pointer-events-none absolute inset-0 will-change-transform"
      >
        <Image
          src="/hero/operative.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_28%] md:object-[72%_center]"
        />
      </motion.div>

      {/* Scrims. Wide, the subject sits hard right and the type side is darkened
          across; narrow, the crop is mostly subject, so the scrim runs top-down
          instead — a sideways one there would bury the whole frame. The accent
          bloom pulls the still's red towards the site's orange either way. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, #0a0a0b 4%, rgba(10,10,11,0.92) 34%, rgba(10,10,11,0.45) 64%, rgba(10,10,11,0.15) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 md:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,11,0.62) 0%, rgba(10,10,11,0.42) 38%, rgba(10,10,11,0.8) 78%, #0a0a0b 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(760px 460px at 12% 10%, rgba(255,107,0,0.20), transparent 64%), linear-gradient(to bottom, rgba(10,10,11,0.75) 0%, transparent 26%, transparent 62%, #0a0a0b 100%)",
        }}
      />

      <div className="relative mx-auto flex max-w-[1600px] flex-col gap-7 px-4 pt-16 pb-14 md:px-8 md:pt-24 md:pb-20">
        <motion.div {...rise(0)} className="flex items-center gap-2">
          <span className="pulse-live h-2 w-2 bg-status-live" />
          <DecryptedText
            text="PMGO GLOBAL FINALS · TELEMETRY LIVE"
            animateOn="view"
            sequential
            speed={28}
            characters="0123456789ABCDEF#*/"
            parentClassName="font-headline text-[11px] font-bold tracking-widest uppercase"
            className="text-status-live"
            encryptedClassName="text-status-live/40"
          />
        </motion.div>

        <h1 className="font-headline max-w-4xl text-5xl leading-[0.95] font-bold tracking-tight text-white uppercase sm:text-6xl lg:text-8xl">
          {words.map((w, i) => (
            <motion.span key={w} {...rise(i + 1)} className="mr-3 inline-block">
              {i === 2 ? <span className="text-primary">{w}</span> : w}
            </motion.span>
          ))}
        </h1>

        <motion.p {...rise(4)} className="font-body max-w-lg text-base text-outline sm:text-lg">
          Four operatives, no more than two from any one team, scored on Power Score
          across every game of the finals.
        </motion.p>

        <motion.div {...rise(5)} className="flex flex-wrap items-center gap-3">
          <Link
            href={signedIn ? "/fantasy" : "/login"}
            className="btn-primary font-headline flex items-center gap-2 px-7 py-3.5 text-sm font-bold tracking-widest uppercase"
          >
            <Icon name="groups" className="text-lg" />
            {signedIn ? "GO TO DRAFT" : "START YOUR SQUAD"}
          </Link>
          <Link
            href={signedIn ? "/dashboard" : "/login"}
            className="btn-ghost font-headline flex items-center gap-2 px-6 py-3.5 text-sm font-bold tracking-widest uppercase"
          >
            <Icon name="dashboard" className="text-lg" />
            VIEW STANDINGS
          </Link>
        </motion.div>

        <motion.dl
          {...rise(6)}
          className="mt-4 grid grid-cols-2 gap-px border border-outline-variant bg-outline-variant sm:max-w-2xl sm:grid-cols-4"
        >
          {stats.map(([value, label], i) => (
            <div key={label} className="bg-[#101012]/95 px-4 py-4 backdrop-blur-sm">
              <dd
                className={`font-headline text-2xl font-bold tracking-tight sm:text-3xl ${
                  i === 3 ? "text-primary" : "text-white"
                }`}
              >
                <CountUp to={value} separator="," duration={1.4} className="tabular-nums" />
              </dd>
              <dt className="font-label mt-0.5 text-[10px] tracking-widest text-outline uppercase">
                {label}
              </dt>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
