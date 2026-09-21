// Finds elements wider than the viewport at phone width (horizontal-overflow bug hunter).
import puppeteer from 'puppeteer-core';
const url = process.argv[2] || 'http://localhost:4321/az/';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 800, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(url, { waitUntil: 'networkidle0' });
const result = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const wide = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 || r.width > vw + 1) {
      wide.push(`${el.tagName.toLowerCase()}.${[...el.classList].slice(0,2).join('.')} w=${Math.round(r.width)} right=${Math.round(r.right)}`);
    }
  }
  return { vw, scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, wide: wide.slice(0, 25) };
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
