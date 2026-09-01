# PMGO Arena

Fantasy squads and match predictions for the PUBG Mobile Global Open.

Ingests raw Shadow Tracker spectator telemetry, computes official tournament
placement points and per-player Power Scores, and serves them through a
military-HUD interface — the **Tactical Protocol** design system.

Draft four operatives from the roster, no more than two from any one team, and
score them on combined Power Score. Call one team per game and bank points on
where they actually finished. Both boards are scored from the same telemetry the
standings are built on — nothing is entered by hand.

Built with Next.js 15 (App Router), React 19, Prisma 6 and Tailwind v4.

---

## Quick start

```bash
npm install
cp .env.example .env      # then paste your Postgres connection string in
npx prisma db push        # create the tables
npm run seed              # 36 matches, 2304 stat rows, 10 demo users
npm run dev               # http://localhost:3000
```

Sign in with any seeded account — they all share one access code:

| Callsign | Email | Access code |
| --- | --- | --- |
| `Recon-01` | `recon01@pmgo.local` | `tactical123` |

The other nine follow the same pattern — `overwatch@`, `dropshot@`,
`killfeed@`, `zonecaller@`, `blueline@`, `thirdparty@`, `proneandy@`,
`lootgoblin@` and `botlobby@`, all `@pmgo.local` on the same code. Each has a
squad and picks, so both leaderboards are populated on first load.

Login is **email + access code**; the callsign is the display name shown on the
navbar and both leaderboards, and is collected once at registration.

`npm run seed` clears the tournament and user tables before writing. Do not run
it against a database holding real data.

---

## Scoring

All four formulas live in `lib/scoring.ts`. It is pure — no imports, no I/O —
and it is the only place points are computed. `lib/scoring.test.ts` covers the
table boundaries, the squad rules and the trend threshold.

**Team match points** — placement by finish, plus one point per kill.

| Finish | 1st | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th | 9th–16th |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Points | 10 | 6 | 5 | 4 | 3 | 2 | 1 | 1 | 0 |

**Player Power Score** — an absolute figure per match, precomputed at seed time.

```
kills × 12  ·  knockouts × 4  ·  damage × 0.08  ·  survival minutes × 1.5
```

Unlike an MVP *share*, it doesn't depend on what the other 63 players did, so a
score is comparable across matches and a squad total is just a sum.

**Prediction payout** — by where the team you picked actually finished. One
locked pick per game; calling an outright winner is worth ten times a
fifth-place hedge.

| Finish | 1st | 2nd | 3rd | 4th | 5th | 6th–16th |
| --- | --- | --- | --- | --- | --- | --- |
| Payout | 10 | 8 | 5 | 3 | 1 | 0 |

**Squad rules** — exactly 4 operatives, all distinct, at most 2 from any one
team. `validateSquad()` is called twice on purpose: in the draft grid to disable
a capped card, and in the server action to enforce it against a request that
never went through that grid.

---

## Routes

| Route | What it does |
| --- | --- |
| `/login` | Sign in / register a callsign |
| `/dashboard` | Tournament command: hero telemetry, 2×8 standings, phase-filtered match grid |
| `/match/[key]` | One game's official standings, expandable per-team rosters, prediction payout |
| `/predictions` | Day-gated predictor: one open day at a time, decay curve, lock-in |
| `/fantasy` | Draft four operatives against the 2-per-team cap; active squad view |
| `/leaderboard` | Fantasy squad and predictor standings |
| `/teams`, `/teams/[id]` | Participating teams and their rosters |
| `/players`, `/players/[uid]` | Operative registry and per-player dossier |

Everything under `app/(app)` is behind a session guard.

**Comparison** — pick two with the ⇄ toggle on any team or operative card and the
tray at the bottom opens a side-by-side breakdown. Teams compare on `/teams`,
operatives on `/players`, `/teams/[id]` and the fantasy draft. Built on a native
`<dialog>`, so Escape, the top layer and focus containment come from the
platform; it slides up as a drawer at every width, capped to a readable column
on wide screens.

---

## Architecture

Server Components read Prisma directly; writes go through Server Actions. There
is no REST layer to keep in sync.

```
app/
  (app)/          authenticated routes; layout.tsx carries the session guard
  login/          public
components/       presentation, split by feature
lib/
  scoring.ts      pure scoring — the only place points are computed
  scoring.test.ts
  queries.ts      all server reads
  actions.ts      register, login, lockPrediction, saveSquad
  session.ts      opaque DB-backed sessions
  schedule.ts     pure day/lock status helpers
  teams.ts        the 16 teams' branding
  format.ts       display formatters
  db.ts           Prisma singleton
prisma/
  schema.prisma
  seed.ts         rebuilds the tournament from public/data
public/data/      36 Shadow Tracker match files + roster.json — the seed source
```

**Auth** is hand-rolled rather than Auth.js: an opaque session id in an httpOnly
cookie, backed by a `Session` row, with bcrypt hashes. Revocation is a DELETE,
and there is no signing key to rotate. This also avoids running Prisma inside
edge middleware, which the Auth.js middleware pattern would require.

**Three precomputations** are written at seed time so no request recomputes
them: `PlayerStat.power`, the whole `TeamResult` table (which turns the
dashboard's hottest read into one indexed query), and `Match.order`.

**`Match.order`** is 0–35 in true tournament order, League D1 G1 → Finals D3 G6.
Every read that cares about chronology sorts by it. Sorting by `phase` name puts
`"Finals"` before `"League"`, which reverses each player's match history and
points the form-trend arrows at the wrong game.

**Deadlines are enforced server-side.** `lockPrediction` re-derives the day's
status from its `ScheduleDay` row before accepting a pick. What the client
believes about the window is presentation only.

---

## Database portability

The schema validates unchanged under `postgresql`, `sqlite` and `mongodb` —
change `provider` in `prisma/schema.prisma` and point `DATABASE_URL` at the new
database. Two rules keep it that way:

1. Every `@id` carries `@map("_id")` — MongoDB requires it, the others ignore it.
2. Ids are `cuid()` strings, never `autoincrement()` (unsupported on MongoDB)
   and never `@db.ObjectId` (which SQLite cannot express).

`npm run db:check-mongo` validates a MongoDB copy of the schema to keep this
honest. Run it before touching the schema.

---

## Telemetry format

Each of the 36 files in `public/data/` wraps an `allinfo.TotalPlayerList` array
of 64 player objects:

```json
[{ "allinfo": { "TotalPlayerList": [
  { "uId": 5227970312, "playerName": "ngxKOOPS02", "teamId": 7,
    "teamName": "Nigma Galaxy", "rank": 1, "killNum": 6, "damage": 998,
    "heal": 166, "survivalTime": 1636, "knockouts": 4, "assists": 1,
    "headShotNum": 1, "maxKillDistance": 158, "driveDistance": 8232,
    "marchDistance": 2606 }
] } }]
```

Files are named `{Phase} D{day} G{game}.json` — `League D1 G1` through
`Finals D3 G6`. Swapping in real exports means changing what `prisma/seed.ts`
reads, not the schema.

### Artwork

`npm run assets` downloads team logos, team flags and player headshots from
[Capex11/PUBG-stats-website](https://github.com/Capex11/PUBG-stats-website) —
the same tournament, keyed by the exact names in the telemetry — into
`public/logos`, `public/flags` and `public/players`, and writes
`public/data/assets.json` for the seed to read. About 730 KB for 109 images.

Two operatives have no headshot (`RAADōLabubu`, `mstrMORSHē` — their names carry
macrons the source exporter could not resolve); those cards fall back to an
initials watermark. Three teams come back with a neutral grey where the source's
colour extraction failed, so the script keeps the existing brand colours for
DAT ALREMAL, ETSH ESPORTS and FOUR WIZ.

The seed runs without any of it — teams then use derived initials and players
have no photo.

`roster.json` is the canonical team/player list, independent of matches played —
it's what lets teams and players render with all-zero stats before a tournament
starts. Regenerate it with `node scripts/build-roster.mjs` after changing the
match files.

---

## Deploying to Vercel

The datasource is `postgresql`. Import the repo, add a Neon database from the
project's **Storage** tab and connect it to all three environments — that
injects `DATABASE_URL`. Then create the tables and seed:

```bash
DATABASE_URL="<unpooled URL>" npx prisma db push
DATABASE_URL="<unpooled URL>" npm run seed
```

Use the **unpooled** connection string (host without `-pooler`) for schema
pushes and seeding; keep the pooled one as the app's `DATABASE_URL`.

`prisma generate` runs in both `build` and `postinstall`, because Vercel
restores a cached `node_modules` and can otherwise skip the install-time
generate.

After the first deploy that introduces `DATABASE_URL`, redeploy with **"Use
existing Build Cache" unticked** — a function built before the variable existed
will 500 at runtime.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | `prisma generate && next build` |
| `npm test` | Scoring unit tests |
| `npm run seed` | Rebuild the tournament (destructive) |
| `npm run db:push` | Sync the schema |
| `npm run db:reset` | Force-reset the schema, then seed |
| `npm run db:check-mongo` | Validate the schema under MongoDB |
| `npm run assets` | Download team and player artwork |
| `npm run check:overflow` | Horizontal-overflow sweep across routes and widths |
| `npm run shot` | Screenshot a route at a given width |
| `node scripts/build-roster.mjs` | Regenerate `roster.json` from the match files |

The last three drive your installed Chrome through `puppeteer-core` (no browser
download) and expect a server already running. Pass its origin as the first
argument, e.g. `npm run check:overflow -- http://localhost:3000`.

---

## Notes

PMGO Arena is an independent fantasy and prediction table. It is not affiliated
with any tournament organizer or publisher.
