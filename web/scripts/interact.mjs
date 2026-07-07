// Interaction verification: hover force-field, click focus card, Esc, drag, scroll, fps.
import { chromium } from "playwright-core";

const SCRATCH = "C:/Users/frank/AppData/Local/Temp/claude/C--Users-frank/05eee529-de72-46d8-8db6-b805590f3d20/scratchpad";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--enable-gpu", "--use-angle=default"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => console.log("PAGEERROR:", String(e).slice(0, 200)));

await page.goto("http://localhost:3001/", { waitUntil: "networkidle" });
await page.waitForTimeout(3500); // textures + cross-fade

// 1) hover a front cover → force-field shove + brighten
await page.mouse.move(1020, 480, { steps: 20 });
await page.waitForTimeout(700);
await page.screenshot({ path: `${SCRATCH}/int-hover.png` });

// 2) click → focus card + caption
await page.mouse.click(1020, 480);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${SCRATCH}/int-focus.png` });

// 3) Esc dismisses
await page.keyboard.press("Escape");
await page.waitForTimeout(900);

// 4) drag left (inertial pan)
await page.mouse.move(1100, 500);
await page.mouse.down();
await page.mouse.move(700, 500, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(250); // mid-inertia
await page.screenshot({ path: `${SCRATCH}/int-drag.png` });

// 5) scroll choreography (mid-hero dolly/scatter)
await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 0.45 }));
await page.waitForTimeout(900);
await page.screenshot({ path: `${SCRATCH}/int-scroll.png` });
await page.evaluate(() => window.scrollTo({ top: 0 }));
await page.waitForTimeout(600);

// 6) fps while wiggling the pointer across the wall
const fps = await page.evaluate(
  () =>
    new Promise((res) => {
      let frames = 0;
      const t0 = performance.now();
      const tick = () => {
        frames++;
        if (performance.now() - t0 < 2000) requestAnimationFrame(tick);
        else res((frames / (performance.now() - t0)) * 1000);
      };
      requestAnimationFrame(tick);
    }),
);
for (let i = 0; i < 12; i++) {
  await page.mouse.move(800 + (i % 4) * 150, 300 + (i % 3) * 180, { steps: 4 });
}
console.log("FPS (2s sample):", Math.round(fps));
await browser.close();
