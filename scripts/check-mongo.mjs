/**
 * Guards the MongoDB migration path.
 *
 * Rewrites the schema's provider to "mongodb" in a temp file and runs
 * `prisma validate` against it, so anything that would break the future switch
 * — `autoincrement()`, a missing `@map("_id")`, `@db.ObjectId` — fails here
 * instead of on migration day.
 *
 * Run with `npm run db:check-mongo`.
 */

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SOURCE = "prisma/schema.prisma";
const PROVIDER = /provider\s*=\s*"postgresql"/;

const schema = readFileSync(SOURCE, "utf8");
if (!PROVIDER.test(schema)) {
  console.error(`✗ ${SOURCE}: expected the datasource provider to be "postgresql".`);
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), "pmgo-mongo-"));
const target = join(dir, "schema.prisma");
writeFileSync(target, schema.replace(PROVIDER, 'provider = "mongodb"'));

// Run the local Prisma CLI through node: no npx, no shell, works on every OS.
const prismaCli = createRequire(import.meta.url).resolve("prisma/build/index.js");

try {
  execFileSync(process.execPath, [prismaCli, "validate", "--schema", target], {
    stdio: "pipe",
    // Prisma rejects a mongodb datasource pointed at a postgres URL, so override
    // it for the check only. Nothing connects — this is static validation.
    env: { ...process.env, DATABASE_URL: "mongodb://localhost:27017/pmgo" },
  });
  console.log("✓ schema also validates under the mongodb provider");
} catch (err) {
  const output = `${err.stdout ?? ""}${err.stderr ?? ""}`.trim();
  console.error("✗ schema is NOT MongoDB-compatible:\n");
  console.error(output || err.message);
  process.exit(1);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
