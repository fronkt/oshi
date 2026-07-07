// Diagnose AniList texture loading inside the browser.
import { chromium } from "playwright-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();

page.on("requestfailed", (r) => {
  if (r.url().includes("anilist")) console.log("FAILED:", r.url().slice(-40), "→", r.failure()?.errorText);
});

await page.goto("http://localhost:3001/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);

// manual probe: can a CORS-mode image load at all in this page?
const manual = await page.evaluate(
  () =>
    new Promise((res) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => res(`ok ${img.naturalWidth}x${img.naturalHeight}`);
      img.onerror = (e) => res(`error: ${String(e).slice(0, 120)}`);
      img.src =
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg?diag=1";
      setTimeout(() => res("timeout"), 8000);
    }),
);
console.log("MANUAL CORS IMAGE:", manual);
await browser.close();
