"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@/components/ui";
import type { SessionUser } from "@/lib/session";

const LINKS = [
  { href: "/dashboard", icon: "dashboard", label: "TOURNAMENT", hint: "Standings & match telemetry" },
  { href: "/predictions", icon: "target", label: "PREDICTIONS", hint: "Lock one pick per game" },
  { href: "/fantasy", icon: "groups", label: "FANTASY SQUAD", hint: "Draft four operatives" },
  { href: "/leaderboard", icon: "leaderboard", label: "LEADERBOARD", hint: "Squads & predictors" },
  { href: "/teams", icon: "shield", label: "TEAMS", hint: "16 competing teams" },
  { href: "/players", icon: "badge", label: "PLAYER ROSTER", hint: "79 operatives" },
] as const;

export default function Navbar({
  user,
  logoutAction,
}: {
  user: SessionUser | null;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  // A match page is reached from the dashboard, so it keeps that tab lit.
  const isActive = (href: string) =>
    pathname.startsWith(href) || (href === "/dashboard" && pathname.startsWith("/match"));

  // Route change closes the drawer — otherwise it stays open over the new page.
  useEffect(() => setOpen(false), [pathname]);

  // Escape, and no scrolling the page behind the drawer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const ease = [0.16, 1, 0.3, 1] as const;

  // The nav carries backdrop-blur, and a backdrop-filter ancestor becomes the
  // containing block for fixed descendants — the drawer would resolve against
  // the 68px header instead of the viewport and collapse. Portal it to body.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <nav className="sticky top-0 z-50 border-b border-outline-variant bg-[#0A0A0B]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between gap-6 px-4 md:px-8">
        <Link href="/dashboard" className="group flex shrink-0 items-center gap-3">
          <span className="font-headline flex items-center gap-1.5 text-2xl font-bold tracking-tighter text-primary transition-transform group-hover:scale-105">
            <span className="text-xl">◈</span> PMGO
          </span>
          <span className="font-headline hidden border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-primary uppercase 2xl:inline-block">
            TACTICAL PROTOCOL
          </span>
        </Link>

        <div className="hidden h-full min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              title={l.label}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`font-headline relative flex h-full shrink-0 items-center gap-2 px-2.5 py-2 text-sm font-bold tracking-wider uppercase transition-colors xl:px-3 ${
                isActive(l.href)
                  ? "border-b-2 border-primary bg-primary/5 text-primary"
                  : "text-outline hover:text-white"
              }`}
            >
              <Icon name={l.icon} className="text-lg" />
              <span className="hidden xl:inline">{l.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden min-w-0 items-center gap-2.5 border border-outline-variant bg-[#1A1A1C] px-3 py-1.5 sm:flex">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-primary/50 bg-[#0E0E0F] text-primary">
                  <Icon name="military_tech" className="text-base" />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="font-headline truncate text-xs leading-none font-bold tracking-wider text-white uppercase">
                    {user.name}
                  </span>
                  <span className="font-label mt-0.5 text-[9px] leading-none font-bold tracking-widest text-primary uppercase">
                    DIVISION I
                  </span>
                </div>
              </div>
              {/* Logout lives in the drawer on mobile — the header only has room
                  for the brand and the menu control. */}
              <form action={logoutAction} className="hidden sm:block">
                <button
                  type="submit"
                  title="Disconnect Session"
                  className="btn-ghost font-headline flex items-center gap-1 border border-outline-variant px-2.5 py-1.5 text-xs font-bold text-outline uppercase transition-all hover:border-red-400 hover:text-red-400"
                >
                  <Icon name="logout" className="text-sm" />
                  <span className="hidden sm:inline">LOGOUT</span>
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-primary font-headline flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider uppercase"
            >
              <Icon name="login" className="text-sm" />
              LOGIN
            </Link>
          )}

          <MenuButton open={open} onClick={() => setOpen((o) => !o)} reduce={Boolean(reduce)} />
        </div>
      </div>

      {mounted &&
        createPortal(
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              className="fixed inset-0 top-[68px] z-[60] bg-black/60 backdrop-blur-[2px] lg:hidden"
            />

            <motion.div
              id="mobile-menu"
              initial={reduce ? { opacity: 0 } : { x: "100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "100%" }}
              transition={{ duration: reduce ? 0 : 0.32, ease }}
              className="fixed top-[68px] right-0 bottom-0 z-[70] flex w-[86%] max-w-sm flex-col border-l border-outline-variant bg-[#131314] shadow-[-12px_0_36px_-12px_rgba(0,0,0,0.9)] lg:hidden"
            >
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {LINKS.map((l, i) => {
                  const active = isActive(l.href);
                  return (
                    <motion.div
                      key={l.href}
                      initial={reduce ? false : { opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      // Staggered by index so the list resolves top-down rather
                      // than snapping in as one block.
                      transition={{ delay: reduce ? 0 : 0.05 + i * 0.04, duration: 0.3, ease }}
                    >
                      <Link
                        href={l.href}
                        aria-current={active ? "page" : undefined}
                        className={`font-headline mb-1.5 flex items-center gap-3 border p-3 transition-colors ${
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-outline-variant bg-[#1A1A1C] text-outline active:border-primary"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center border ${
                            active
                              ? "border-primary/50 bg-primary/10 text-primary"
                              : "border-outline-variant bg-[#0E0E0F]"
                          }`}
                        >
                          <Icon name={l.icon} className="text-lg" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold tracking-wider uppercase">
                            {l.label}
                          </span>
                          <span className="font-label mt-0.5 block truncate text-[10px] text-outline normal-case">
                            {l.hint}
                          </span>
                        </span>
                        {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {user && (
                <div className="shrink-0 border-t border-outline-variant bg-[#1A1A1C] p-3">
                  <div className="mb-2 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-primary/50 bg-[#0E0E0F] text-primary">
                      <Icon name="military_tech" className="text-lg" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-headline truncate text-sm font-bold text-white uppercase">
                        {user.name}
                      </div>
                      <div className="font-label truncate text-[10px] text-outline">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="btn-ghost font-headline flex w-full items-center justify-center gap-2 py-2.5 text-xs font-bold tracking-wider uppercase hover:border-red-400 hover:text-red-400"
                    >
                      <Icon name="logout" className="text-base" /> DISCONNECT SESSION
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>,
          document.body,
        )}
    </nav>
  );
}

/** Hamburger that morphs into a close cross. */
function MenuButton({
  open,
  onClick,
  reduce,
}: {
  open: boolean;
  onClick: () => void;
  reduce: boolean;
}) {
  const t = { duration: reduce ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] as const };
  const bar = "absolute left-1/2 h-[2px] w-5 -translate-x-1/2 bg-current";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls="mobile-menu"
      aria-label={open ? "Close navigation menu" : "Open navigation menu"}
      className={`relative h-10 w-10 shrink-0 border transition-colors lg:hidden ${
        open ? "border-primary bg-primary/10 text-primary" : "border-outline-variant bg-[#1A1A1C] text-white"
      }`}
    >
      <motion.span
        className={bar}
        initial={false}
        animate={open ? { top: "50%", rotate: 45, y: -1 } : { top: "34%", rotate: 0, y: 0 }}
        transition={t}
      />
      <motion.span
        className={bar}
        style={{ top: "50%", y: -1 }}
        initial={false}
        animate={{ opacity: open ? 0 : 1, scaleX: open ? 0.4 : 1 }}
        transition={t}
      />
      <motion.span
        className={bar}
        initial={false}
        animate={open ? { top: "50%", rotate: -45, y: -1 } : { top: "66%", rotate: 0, y: 0 }}
        transition={t}
      />
    </button>
  );
}
