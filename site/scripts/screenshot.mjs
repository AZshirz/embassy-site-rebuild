// Full-page screenshots of the built site at desktop and phone widths, for the README.
// Usage: node scripts/screenshot.mjs [baseUrl] [outDir]
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:4321';
const out = process.argv[3] || '../audit/screenshots';
mkdirSync(out, { recursive: true });

const pages = ['/', '/visas/', '/citizen-services/', '/education/', '/az/'];
const viewports = {
  desktop: { width: 1366, height: 900 },
  phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
for (const [name, vp] of Object.entries(viewports)) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  for (const path of pages) {
    await page.goto(base + path, { waitUntil: 'networkidle0' });
    // Scroll through the page so lazy-loaded images are fetched before the full-page capture.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await page.waitForNetworkIdle({ idleTime: 300 });
    const file = `${out}/${name}-${path === '/' ? 'home' : path.replace(/\//g, '-').replace(/^-|-$/g, '')}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log('saved', file);
  }
  await page.close();
}
await browser.close();
