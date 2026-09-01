"use client";

import { Reveal } from "@/components/landing/Reveal";
import LogoLoop from "@/components/LogoLoop";

/**
 * The 16 competing crests on a continuous loop.
 *
 * LogoLoop is React Bits (via the shadcn registry) and ships with no
 * dependencies of its own. `fadeOutColor` is set to the site ground so the strip
 * dissolves at both edges instead of clipping.
 */
export default function TeamMarquee({
  logos,
}: {
  logos: { src: string; alt: string; href: string }[];
}) {
  return (
    <Reveal className="border-b border-outline-variant bg-[#0E0E0F]/60 py-6">
      <LogoLoop
        logos={logos}
        speed={40}
        direction="left"
        logoHeight={34}
        gap={56}
        pauseOnHover
        scaleOnHover
        fadeOut
        fadeOutColor="#0a0a0b"
        ariaLabel="Competing teams"
      />
    </Reveal>
  );
}
