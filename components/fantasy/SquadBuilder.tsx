"use client";

import { useMemo, useState, useTransition } from "react";

import PlayerCard from "@/components/PlayerCard";
import PlayerRow from "@/components/PlayerRow";
import CompareDialog from "@/components/compare/CompareDialog";
import CompareTray from "@/components/compare/CompareTray";
import { useCompare } from "@/components/compare/useCompare";
import { ErrorNote, Icon, TeamBadge, TrendBadge, ViewToggle, type PlayerView } from "@/components/ui";
import type { ActionResult } from "@/lib/actions";
import { fmt, fmtPower } from "@/lib/format";
import { playerStats } from "@/lib/compare";
import { MAX_PER_TEAM, SQUAD_SIZE, validateSquad, wouldExceedTeamCap } from "@/lib/scoring";
import type { Trend } from "@/lib/scoring";

export type PoolPlayer = {
  uid: string;
  name: string;
  teamId: number;
  teamName: string;
  teamInitials: string;
  teamLogo: string | null;
  avgPower: number;
  kd: number;
  avgEliminations: number;
  avgDamage: number;
  matchesPlayed: number;
  trend: Trend | null;
  photo: string | null;
};

const ROLES = ["IN-GAME LEADER", "ENTRY FRAGGER", "SUPPORT", "FLEX OPERATIVE"];

type SortKey = "POWER" | "KD" | "KILLS" | "DAMAGE" | "NAME";

/** Every sort but NAME reads high-to-low, which is what a draft board wants. */
const SORTS: Record<SortKey, (a: PoolPlayer, b: PoolPlayer) => number> = {
  POWER: (a, b) => b.avgPower - a.avgPower,
  KD: (a, b) => b.kd - a.kd,
  KILLS: (a, b) => b.avgEliminations - a.avgEliminations,
  DAMAGE: (a, b) => b.avgDamage - a.avgDamage,
  NAME: (a, b) => a.name.localeCompare(b.name),
};

const SORT_LABELS: Record<SortKey, string> = {
  POWER: "POWER",
  KD: "K/D",
  KILLS: "AVG KILLS",
  DAMAGE: "AVG DMG",
  NAME: "NAME A–Z",
};

export default function SquadBuilder({
  pool,
  initialUids,
  initialName,
  saveAction,
}: {
  pool: PoolPlayer[];
  initialUids: string[];
  initialName: string;
  saveAction: (name: string, uids: string[]) => Promise<ActionResult>;
}) {
  const [uids, setUids] = useState<string[]>(initialUids);
  const [name, setName] = useState(initialName);
  const [view, setView] = useState<"ACTIVE" | "DRAFT">(
    initialUids.length === SQUAD_SIZE ? "ACTIVE" : "DRAFT",
  );
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [sort, setSort] = useState<SortKey>("POWER");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [layout, setLayout] = useState<PlayerView>("CARDS");
  const cmp = useCompare();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const byUid = useMemo(() => new Map(pool.map((p) => [p.uid, p])), [pool]);
  const drafted = uids.map((u) => byUid.get(u)).filter((p): p is PoolPlayer => Boolean(p));
  const teamNames = useMemo(
    () => [...new Set(pool.map((p) => p.teamName))].sort(),
    [pool],
  );

  // Declared after byUid on purpose: reading it above the map's own const would
  // hit the temporal dead zone the moment a comparison id existed.
  const compared = cmp.ids
    .map((id) => byUid.get(id))
    .filter((p): p is PoolPlayer => Boolean(p));

  const totalPower = drafted.reduce((s, p) => s + p.avgPower, 0);

  const save = () => {
    setError(null);
    const problem = validateSquad(drafted);
    if (problem) {
      setError(problem);
      return;
    }
    startTransition(async () => {
      const result = await saveAction(name, uids);
      if ("error" in result) setError(result.error);
      else setView("ACTIVE");
    });
  };

  const toggle = (p: PoolPlayer) => {
    setError(null);
    if (uids.includes(p.uid)) {
      setUids(uids.filter((u) => u !== p.uid));
      return;
    }
    if (uids.length >= SQUAD_SIZE) {
      setError(`Squad is full — ${SQUAD_SIZE} operatives maximum.`);
      return;
    }
    // The cap is checked before the pick lands, not only at save time.
    if (wouldExceedTeamCap(drafted, p)) {
      setError(`Max ${MAX_PER_TEAM} operatives allowed from ${p.teamName}.`);
      return;
    }
    setUids([...uids, p.uid]);
  };

  // ------------------------------------------------------------- ACTIVE view
  if (view === "ACTIVE" && drafted.length === SQUAD_SIZE) {
    const avgKd = drafted.reduce((s, p) => s + p.kd, 0) / drafted.length;
    const totalDmg = drafted.reduce((s, p) => s + p.avgDamage * p.matchesPlayed, 0);

    return (
      <div className="flex flex-col gap-8 pb-12">
        <section className="hud-card relative flex flex-col items-start justify-between overflow-hidden border border-outline-variant bg-[#1A1A1C] p-6 shadow-2xl md:flex-row md:items-end md:p-8">
          <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />

          <div className="relative z-10 mb-4 flex flex-col gap-2 md:mb-0">
            <div className="flex items-center gap-3">
              <Icon name="shield" className="text-3xl text-primary" />
              <h1 className="font-headline text-3xl font-bold tracking-tighter text-white uppercase md:text-5xl">
                {name}
              </h1>
            </div>
            <p className="font-label flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-primary uppercase">
              <span className="h-2 w-2 animate-pulse rounded-full bg-status-success" /> STATUS:
              ACTIVE DEPLOYMENT
            </p>
          </div>

          <div className="relative z-10 flex w-full flex-col items-start gap-6 sm:flex-row sm:items-end md:w-auto">
            <div className="flex gap-6 border-l-2 border-outline-variant pl-4">
              <div className="flex flex-col">
                <span className="font-label text-[10px] font-bold tracking-wider text-outline uppercase">
                  TEAM AVG K/D
                </span>
                <span className="font-headline text-2xl font-bold text-white">
                  {avgKd.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label text-[10px] font-bold tracking-wider text-outline uppercase">
                  TOTAL DMG
                </span>
                <span className="font-headline text-2xl font-bold text-white">
                  {fmt(totalDmg)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label text-[10px] font-bold tracking-wider text-primary uppercase">
                  SQUAD POWER
                </span>
                <span className="font-headline text-2xl font-bold text-primary">
                  {fmtPower(totalPower)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setView("DRAFT")}
              className="btn-secondary font-headline flex items-center gap-2 px-6 py-2.5 text-sm font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(255,107,0,0.2)]"
            >
              <Icon name="edit_note" className="text-base" /> MANAGE ROSTER
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {drafted.map((p, i) => (
            <PlayerCard
              key={p.uid}
              player={p}
              role={ROLES[i % ROLES.length]}
              slot={i + 1}
            />
          ))}
        </section>
      </div>
    );
  }

  // -------------------------------------------------------------- DRAFT view
  const selectFor = (p: PoolPlayer) => ({
    selected: uids.includes(p.uid),
    disabled: blocked(p),
    capped: !uids.includes(p.uid) && wouldExceedTeamCap(drafted, p),
    onSelect: () => toggle(p),
  });

  const blocked = (p: PoolPlayer) =>
    !uids.includes(p.uid) && (uids.length >= SQUAD_SIZE || wouldExceedTeamCap(drafted, p));

  let filtered = pool;
  if (teamFilter !== "ALL") filtered = filtered.filter((p) => p.teamName === teamFilter);
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(q) || p.teamName.toLowerCase().includes(q),
    );
  }
  // Drafted players stay visible even when hiding the unavailable — you need
  // them on screen to take one back out.
  if (availableOnly) filtered = filtered.filter((p) => uids.includes(p.uid) || !blocked(p));
  filtered = [...filtered].sort(SORTS[sort]);

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      {/* Pool */}
      <section className="flex min-w-0 flex-col">
        <div className="hud-card mb-6 flex flex-col gap-4 border border-outline-variant bg-[#1A1A1C] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Icon
                name="search"
                className="absolute top-1/2 left-3 -translate-y-1/2 text-lg text-outline"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SEARCH PLAYERS..."
                type="search"
                aria-label="Search players"
                className="font-headline w-full border-b-2 border-b-outline-variant bg-[#1A1A1C] py-2 pr-4 pl-10 text-xs font-bold tracking-wider text-white uppercase transition-colors outline-none placeholder:text-outline focus:border-b-primary"
              />
            </div>

            <div className="relative w-full sm:w-48">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="Sort players"
                className="font-headline w-full cursor-pointer appearance-none border-b-2 border-b-outline-variant bg-[#1A1A1C] py-2 pr-8 pl-4 text-xs font-bold tracking-wider text-white uppercase outline-none focus:border-b-primary"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <option key={k} value={k}>
                    SORT: {SORT_LABELS[k]}
                  </option>
                ))}
              </select>
              <Icon
                name="arrow_drop_down"
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-outline"
              />
            </div>

            <button
              type="button"
              onClick={() => setAvailableOnly((v) => !v)}
              aria-pressed={availableOnly}
              className={`font-headline flex shrink-0 items-center justify-center gap-1.5 border px-3 py-2 text-xs font-bold tracking-wider uppercase transition-colors ${
                availableOnly
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-outline-variant text-outline hover:border-outline"
              }`}
            >
              <Icon name={availableOnly ? "check_circle" : "filter_alt"} className="text-sm" />
              AVAILABLE
            </button>

            <ViewToggle view={layout} onChange={setLayout} />
          </div>

          {/* Chips beat a dropdown on a phone: one tap, and the whole field is
              visible instead of hidden behind a native picker. */}
          <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {["ALL", ...teamNames].map((t) => {
              const on = teamFilter === t;
              const count = t === "ALL" ? pool.length : pool.filter((p) => p.teamName === t).length;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTeamFilter(t)}
                  aria-pressed={on}
                  className={`font-headline flex shrink-0 items-center gap-1.5 border px-2.5 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-colors ${
                    on
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-outline-variant text-outline hover:border-outline hover:text-white"
                  }`}
                >
                  {t === "ALL" ? "ALL TEAMS" : t}
                  <span className={on ? "text-primary/70" : "text-outline/60"}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse bg-status-live" />
          <span className="font-headline text-xs font-bold tracking-widest text-status-live uppercase">
            LIVE DRAFT POOL ({filtered.length} AVAILABLE)
          </span>
          <div className="ml-4 h-px flex-1 bg-gradient-to-r from-outline-variant to-transparent" />
        </div>

        {filtered.length === 0 ? (
          <div className="font-label py-16 text-center text-outline uppercase">
            No players match current parameters.
          </div>
        ) : layout === "CARDS" ? (
          // Two up on a phone: the card scales its own type by container width,
          // so it stays legible at roughly 170px across.
          <div className="grid grid-cols-2 gap-3 pb-28 sm:gap-4 xl:grid-cols-3 xl:pb-0">
            {filtered.map((p) => (
              <PlayerCard
                key={p.uid}
                player={p}
                select={selectFor(p)}
                compare={{ picked: cmp.isPicked(p.uid), onToggle: () => cmp.toggle(p.uid) }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-28 xl:pb-0">
            {filtered.map((p) => (
              <PlayerRow
                key={p.uid}
                player={p}
                select={selectFor(p)}
                compare={{ picked: cmp.isPicked(p.uid), onToggle: () => cmp.toggle(p.uid) }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Roster rail */}
      <section className="hud-card hidden min-w-0 flex-col border border-outline-variant bg-[#131314] xl:sticky xl:top-[88px] xl:flex">
        <div className="border-b border-outline-variant bg-[#1A1A1C] p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-headline text-2xl font-bold tracking-wider text-white uppercase">
              MY ROSTER
            </h2>
            {initialUids.length === SQUAD_SIZE && (
              <button
                type="button"
                onClick={() => setView("ACTIVE")}
                className="font-headline text-xs font-bold text-primary uppercase hover:underline"
              >
                VIEW DEPLOYMENT →
              </button>
            )}
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="FANTASY TEAM NAME"
            aria-label="Squad name"
            className="font-headline w-full border-b-2 border-b-outline-variant bg-[#1A1A1C] px-4 py-3 text-sm font-bold tracking-wider text-white uppercase transition-colors outline-none placeholder:text-outline focus:border-b-primary"
          />
        </div>

        <div className="flex flex-1 flex-col gap-3 p-6">
          {Array.from({ length: SQUAD_SIZE }).map((_, i) => {
            const p = drafted[i];
            if (!p) {
              return (
                <div
                  key={`empty-${i}`}
                  className="flex h-[72px] items-center justify-center border border-dashed border-outline-variant bg-[#0E0E0F] p-4"
                >
                  <div className="font-headline flex items-center gap-2 text-xs font-bold tracking-wider text-outline uppercase">
                    <Icon name="add" className="text-sm" /> SELECT PLAYER
                  </div>
                </div>
              );
            }

            const atCap =
              drafted.filter((d) => d.teamId === p.teamId).length >= MAX_PER_TEAM;

            return (
              <div
                key={p.uid}
                className="hud-card relative flex items-center gap-3 overflow-hidden border border-outline-variant bg-[#1A1A1C] p-3"
              >
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-primary" />
                <TeamBadge
                  team={{ teamName: p.teamName, logo: p.teamLogo, initials: p.teamInitials }}
                  size={40}
                  className="border border-outline-variant"
                />

                <div className="min-w-0 flex-1">
                  <div className="font-label flex items-center gap-1.5 truncate text-[10px] text-outline uppercase">
                    <span className="truncate">{p.teamName}</span>
                    {atCap && (
                      <Icon
                        name="warning"
                        className="text-[14px] text-primary"
                      />
                    )}
                  </div>
                  <div className="font-headline truncate text-lg leading-tight font-bold text-white uppercase">
                    {p.name}
                  </div>
                </div>

                <div className="font-headline shrink-0 text-base font-bold text-primary">
                  {fmtPower(p.avgPower)}
                </div>

                <button
                  type="button"
                  onClick={() => setUids(uids.filter((u) => u !== p.uid))}
                  aria-label={`Remove ${p.name}`}
                  className="shrink-0 p-1 text-outline hover:text-red-400"
                >
                  <Icon name="close" className="text-base" />
                </button>
              </div>
            );
          })}

          <div className="mt-4 flex flex-col gap-3 border-t border-outline-variant pt-4">
            <div className="flex items-center justify-between">
              <span className="font-headline text-xs font-bold text-outline uppercase">
                COMBINED SQUAD POWER
              </span>
              <span className="font-headline text-2xl font-bold text-primary">
                {fmtPower(totalPower)}
              </span>
            </div>

            <div className="flex items-start gap-3 border-l-2 border-primary bg-[#1A1A1C] p-3">
              <Icon name="info" className="mt-0.5 shrink-0 text-base text-primary" />
              <div className="text-xs">
                <div className="font-headline font-bold text-white uppercase">
                  MAX {MAX_PER_TEAM} PER TEAM
                </div>
                <div className="font-label mt-0.5 text-[11px] text-outline">
                  Roster cap limits you to {MAX_PER_TEAM} players from the same real-life team.
                </div>
              </div>
            </div>

            <ErrorNote>{error}</ErrorNote>
          </div>
        </div>

        <div className="border-t border-outline-variant bg-[#1A1A1C] p-6">
          <div className="font-headline mb-3 flex items-center justify-between text-xs font-bold text-outline uppercase">
            <span>DRAFT STATUS</span>
            <span className="text-primary">
              {uids.length}/{SQUAD_SIZE} PLAYERS
            </span>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={uids.length !== SQUAD_SIZE || pending}
            className="btn-primary font-headline flex w-full items-center justify-center gap-2 py-3.5 text-base font-bold tracking-widest uppercase"
          >
            <Icon name="save" className="text-lg" />
            {pending ? "SAVING…" : `SAVE TEAM (${uids.length}/${SQUAD_SIZE})`}
          </button>
        </div>
      </section>

      <CompareTray
        items={compared.map((p) => ({ id: p.uid, name: p.name, logo: p.teamLogo, initials: p.teamInitials, photo: p.photo }))}
        onRemove={cmp.remove}
        onCompare={cmp.show}
        onClear={cmp.clear}
        offsetClass="bottom-[72px] xl:bottom-0"
      />

      {compared.length === 2 && (
        <CompareDialog
          open={cmp.open}
          onClose={cmp.hide}
          title="Operative comparison"
          a={{ id: compared[0].uid, name: compared[0].name, subtitle: compared[0].teamName, logo: compared[0].teamLogo, initials: compared[0].teamInitials, kind: "player", photo: compared[0].photo }}
          b={{ id: compared[1].uid, name: compared[1].name, subtitle: compared[1].teamName, logo: compared[1].teamLogo, initials: compared[1].teamInitials, kind: "player", photo: compared[1].photo }}
          stats={playerStats(compared[0], compared[1])}
        />
      )}

      {/* Mobile draft dock. The rail above is xl-only, so without this a phone
          user taps a card and gets no feedback until they have scrolled past
          all 79 of them — the roster panel used to start 43,000px down. */}
      <div className="fixed inset-x-0 bottom-0 z-40 xl:hidden">
        {dockOpen && (
          <button
            type="button"
            aria-label="Close roster"
            onClick={() => setDockOpen(false)}
            className="fixed inset-0 -z-10 bg-black/60 backdrop-blur-[2px]"
          />
        )}

        <div className="border-t border-outline-variant bg-[#131314] shadow-[0_-12px_30px_-12px_rgba(0,0,0,0.8)]">
          {dockOpen && (
            <div className="max-h-[55vh] overflow-y-auto border-b border-outline-variant p-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="FANTASY TEAM NAME"
                aria-label="Squad name"
                className="font-headline mb-3 w-full border-b-2 border-b-outline-variant bg-[#1A1A1C] px-3 py-2.5 text-sm font-bold tracking-wider text-white uppercase outline-none placeholder:text-outline focus:border-b-primary"
              />
              <div className="flex flex-col gap-2">
                {Array.from({ length: SQUAD_SIZE }).map((_, i) => {
                  const p = drafted[i];
                  if (!p) {
                    return (
                      <div
                        key={`slot-${i}`}
                        className="font-headline flex h-[56px] items-center justify-center border border-dashed border-outline-variant bg-[#0E0E0F] text-xs font-bold tracking-wider text-outline uppercase"
                      >
                        SLOT {i + 1} — EMPTY
                      </div>
                    );
                  }
                  return (
                    <div
                      key={p.uid}
                      className="flex items-center gap-3 border border-outline-variant bg-[#1A1A1C] p-2.5"
                    >
                      <TeamBadge
                        team={{ teamName: p.teamName, logo: p.teamLogo, initials: p.teamInitials }}
                        size={32}
                        className="rounded-[10px] border border-outline-variant"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-label truncate text-[10px] text-outline uppercase">
                          {p.teamName}
                        </div>
                        <div className="font-headline truncate text-sm font-bold text-white uppercase">
                          {p.name}
                        </div>
                      </div>
                      <span className="font-headline shrink-0 text-sm font-bold text-primary">
                        {fmtPower(p.avgPower)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setUids(uids.filter((u) => u !== p.uid))}
                        aria-label={`Remove ${p.name}`}
                        className="shrink-0 p-1 text-outline hover:text-red-400"
                      >
                        <Icon name="close" className="text-base" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3">
                <ErrorNote>{error}</ErrorNote>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3">
            <button
              type="button"
              onClick={() => setDockOpen((v) => !v)}
              aria-expanded={dockOpen}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="flex shrink-0 items-center gap-1.5">
                {Array.from({ length: SQUAD_SIZE }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full border transition-colors ${
                      drafted[i]
                        ? "border-primary bg-primary"
                        : "border-outline-variant bg-transparent"
                    }`}
                  />
                ))}
              </span>
              <span className="min-w-0">
                <span className="font-headline block text-sm leading-none font-bold text-white">
                  {uids.length}/{SQUAD_SIZE}{" "}
                  <span className="text-primary">{fmtPower(totalPower)}</span>
                </span>
                <span className="font-label mt-0.5 block text-[10px] text-outline uppercase">
                  {dockOpen ? "Tap to collapse" : "Tap to manage roster"}
                </span>
              </span>
              <Icon
                name={dockOpen ? "expand_more" : "expand_less"}
                className="shrink-0 text-lg text-outline"
              />
            </button>

            <button
              type="button"
              onClick={save}
              disabled={uids.length !== SQUAD_SIZE || pending}
              className="btn-primary font-headline flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-sm font-bold tracking-wider uppercase"
            >
              <Icon name="save" className="text-base" />
              {pending ? "SAVING…" : "SAVE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
  trend,
}: {
  label: string;
  value: string;
  accent?: boolean;
  trend?: Trend | null;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-label text-[9px] text-outline uppercase">{label}</span>
      <span
        className={`font-headline flex items-center gap-1 text-base font-bold ${
          accent ? "text-primary" : "text-white"
        }`}
      >
        {value}
        {trend !== undefined && <TrendBadge trend={trend ?? null} />}
      </span>
    </div>
  );
}
