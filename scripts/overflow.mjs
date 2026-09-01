/**
 * Horizontal-overflow sweep across routes and widths, driving the locally
 * installed Chrome through puppeteer-core (no browser download).
 *
 * A CSS Grid track with no base column count sizes to max-content, so a rail
 * that looks fine at 1280px can render wider than the phone it's on. This
 * measures instead of guessing.
 *
 * Expects a server already running — pass its origin as the first argument:
 *   node scripts/overflow.mjs http://localhost:3000
 */
import puppeteer from "puppeteer-core";
import { PrismaClient } from "@prisma/client";

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ORIGIN = process.argv[2] || "http://localhost:3000";
const ROUTES = ["/", "/dashboard", "/predictions", "/fantasy", "/leaderboard", "/teams", "/players"];
const WIDTHS = [360, 390, 768, 1280];

const prisma = new PrismaClient();
const user = await prisma.user.findFirstOrThrow({ where: { email: "recon01@pmgo.local" } });
const session = await prisma.session.create({
  data: { userId: user.id, expiresAt: new Date(Date.now() + 864e5) },
});
await prisma.$disconnect();

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
let failures = 0;

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900 });
    await page.setCookie({
      name: "pmgo_session",
      value: session.id,
      domain: "localhost",
      path: "/",
    });
    await page.goto(ORIGIN + route, { waitUntil: "networkidle0" });

    const r = await page.evaluate((w) => {
      const doc = document.documentElement;
      const culprits = [];
      for (const el of document.querySelectorAll("body *")) {
        const box = el.getBoundingClientRect();
        if (box.width > 0 && (box.right > w + 1 || box.left < -1)) {
          culprits.push(
            `${el.tagName.toLowerCase()}.${(el.className?.toString?.() ?? "").split(" ").slice(0, 3).join(".")} [${Math.round(box.left)}→${Math.round(box.right)}]`,
          );
        }
      }
      return { sw: doc.scrollWidth, cw: doc.clientWidth, culprits: culprits.slice(0, 3) };
    }, width);

    const bad = r.sw > r.cw + 1;
    if (bad) failures++;
    console.log(
      `${bad ? "OVERFLOW" : "ok      "} ${route.padEnd(13)} ${String(width).padStart(4)}px  scroll=${r.sw} client=${r.cw}`,
    );
    if (bad && r.culprits.length) r.culprits.forEach((c) => console.log(`           ↳ ${c}`));
    await page.close();
  }
}

await browser.close();
console.log(failures === 0 ? "\n✓ no horizontal overflow" : `\n✗ ${failures} overflowing combinations`);
process.exit(failures === 0 ? 0 : 1);
