/**
 * Screenshots a route at a given width using the locally installed Chrome, so
 * responsive and visual work can be checked instead of guessed at.
 *
 *   node scripts/shot.mjs /dashboard 1280 shot.png [origin]
 */
import puppeteer from "puppeteer-core";
import { PrismaClient } from "@prisma/client";

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const [route = "/dashboard", width = "1280", out = "shot.png", origin = "http://localhost:3000"] =
  process.argv.slice(2);

const prisma = new PrismaClient();
const user = await prisma.user.findFirstOrThrow({ where: { email: "recon01@pmgo.local" } });
const session = await prisma.session.create({
  data: { userId: user.id, expiresAt: new Date(Date.now() + 864e5) },
});
await prisma.$disconnect();

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: Number(width), height: 900, deviceScaleFactor: 1 });
await page.setCookie({ name: "pmgo_session", value: session.id, domain: "localhost", path: "/" });
await page.goto(origin + route, { waitUntil: "networkidle0" });
await page.screenshot({ path: out, fullPage: true });
await browser.close();

console.log(`${out}  ${route} @ ${width}px`);
