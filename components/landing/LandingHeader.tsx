import Link from "next/link";

import { Icon } from "@/components/ui";

/**
 * Public header for the landing page.
 *
 * Navbar can't be reused here — it takes a SessionUser and a logout action, and
 * this page renders for anonymous visitors too.
 */
export default function LandingHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant bg-[#0A0A0B]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <span className="font-headline flex items-center gap-1.5 text-2xl font-bold tracking-tighter text-primary transition-transform group-hover:scale-105">
            <span className="text-xl">◈</span> PMGO
          </span>
          <span className="font-headline hidden border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-primary uppercase sm:inline-block">
            TACTICAL PROTOCOL
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={signedIn ? "/dashboard" : "/login"}
            className="btn-ghost font-headline hidden items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider uppercase sm:flex"
          >
            <Icon name="dashboard" className="text-sm" /> STANDINGS
          </Link>
          <Link
            href={signedIn ? "/fantasy" : "/login"}
            className="btn-primary font-headline flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider uppercase"
          >
            <Icon name={signedIn ? "groups" : "login"} className="text-sm" />
            {signedIn ? "GO TO DRAFT" : "SIGN IN"}
          </Link>
        </div>
      </div>
    </header>
  );
}
