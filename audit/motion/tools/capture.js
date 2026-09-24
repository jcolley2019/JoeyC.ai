// Motion capture: scroll / in 5% steps at 1440x900 and 390x844, screenshot each step,
// and record one smooth top-to-bottom scroll per width as webm.
// Usage: node capture.js <outDir>   e.g. audit/motion/after  (BASE env overrides the dev-server URL)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:5199';
const OUT = process.argv[2];
if (!OUT) throw new Error('outDir required');

// Deterministic randomness so particles / scatter values are identical across runs.
// 0.5 also keeps the hero letter animation (Math.random() > 0.98) from firing.
const INIT = `Math.random = () => 0.5; window.__motionCapture = true;`;

const WIDTHS = [
  { w: 1440, h: 900 },
  { w: 390, h: 844, mobile: true },
];

(async () => {
  const browser = await chromium.launch();
  for (const v of WIDTHS) {
    const dir = path.join(OUT, String(v.w));
    fs.mkdirSync(dir, { recursive: true });

    // ── Stepped screenshots ──
    const ctx = await browser.newContext({
      viewport: { width: v.w, height: v.h },
      deviceScaleFactor: 1,
      hasTouch: !!v.mobile,
      isMobile: !!v.mobile,
    });
    await ctx.addInitScript(INIT);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500); // hero intro tweens settle (0.6 + 0.8 + letters 0.55)
    const docH = await page.evaluate(() => document.documentElement.scrollHeight);
    const maxY = docH - v.h;
    const steps = [];
    for (let i = 0; i <= 20; i++) {
      const y = Math.round(maxY * (i / 20));
      await page.evaluate(yy => window.scrollTo({ top: yy, behavior: 'instant' }), y);
      await page.waitForTimeout(400);
      // Then wait until GSAP (IO reveals, scrub lag) has visually settled: two consecutive
      // frames identical, capped at 4 s. Infinite CSS loops are held at a fixed phase by
      // animations:'disabled' so only JS-driven motion counts.
      let prev = await page.screenshot({ animations: 'disabled', caret: 'hide' });
      let settledMs = 0;
      for (; settledMs < 4000; settledMs += 150) {
        await page.waitForTimeout(150);
        const cur = await page.screenshot({ animations: 'disabled', caret: 'hide' });
        if (cur.equals(prev)) break;
        prev = cur;
      }
      const file = path.join(dir, `step-${String(i).padStart(2, '0')}.png`);
      fs.writeFileSync(file, prev);
      steps.push({ i, y, settledMs });
    }
    fs.writeFileSync(path.join(dir, 'steps.json'), JSON.stringify({ docH, maxY, viewport: v, steps }, null, 1));
    console.log(`${v.w}: docH=${docH} maxY=${maxY} steps=${steps.length} pageErrors=${errors.length}`);
    await ctx.close();

    // ── Smooth scroll video ──
    const vctx = await browser.newContext({
      viewport: { width: v.w, height: v.h },
      deviceScaleFactor: 1,
      hasTouch: !!v.mobile,
      isMobile: !!v.mobile,
      recordVideo: { dir: path.join(OUT, '_video_tmp_' + v.w), size: { width: v.w, height: v.h } },
    });
    await vctx.addInitScript(INIT);
    const vpage = await vctx.newPage();
    await vpage.goto(BASE + '/', { waitUntil: 'networkidle' });
    await vpage.waitForTimeout(2000);
    const vMax = (await vpage.evaluate(() => document.documentElement.scrollHeight)) - v.h;
    const frames = 240; // ~12 s at 50 ms per step
    for (let i = 0; i <= frames; i++) {
      await vpage.evaluate(yy => window.scrollTo({ top: yy, behavior: 'instant' }), Math.round(vMax * (i / frames)));
      await vpage.waitForTimeout(50);
    }
    await vpage.waitForTimeout(1500);
    const video = vpage.video();
    await vctx.close();
    const tmp = await video.path();
    const dest = path.join(OUT, `${v.w}.webm`);
    fs.copyFileSync(tmp, dest);
    fs.rmSync(path.join(OUT, '_video_tmp_' + v.w), { recursive: true, force: true });
    console.log(`${v.w}: video -> ${dest} (${Math.round(fs.statSync(dest).size / 1024)} KB)`);
  }
  await browser.close();
})();
