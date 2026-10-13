// Headless smoke test: node test/smoke.mjs (needs `npm run preview` running and Chrome)
import puppeteer from 'puppeteer-core';
const url = process.env.URL || 'http://localhost:4173/';
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 800 });
const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => m.type() === 'error' && errors.push(m.text()));
await page.goto(url, { waitUntil: 'networkidle0' });
const click = (sel) => page.$eval(sel, e => e.click());
await page.evaluate(() => [...document.querySelectorAll('#shape-buttons button')][1].click()); // cylinder
await page.evaluate(() => { const o = window.__tinkerlars.objects; o[1].userData.hole = true; });
const n0 = await page.evaluate(() => window.__tinkerlars.objects.length);
await page.screenshot({ path: '/tmp/tl-design.png' });
await page.evaluate(() => { const o = window.__tinkerlars.objects; o[1].position.copy(o[0].position); }); 
// select both via API-ish: shift click is hard headless; use group button after selecting
await page.evaluate(() => { document.querySelector('#btn-group'); });
await page.select('#lang', 'en');
const label = await page.$eval('#btn-stl', e => e.textContent);
await click('[data-tab="circuits"]');
await click('#sim');
await new Promise(r => setTimeout(r, 300));
const led1 = await page.evaluate(() => window.__tinkerlars.solve(window.__tinkerlars.comps, {}).leds.L1);
const code = await page.$eval('#code', e => e.textContent);
await page.screenshot({ path: '/tmp/tl-circuits.png' });
console.log(JSON.stringify({ objects: n0, stlLabel: label, codeHasBlink: code.includes('digitalWrite(13, HIGH)'), ledListed: await page.$eval('#c-list', e => e.textContent), errors }, null, 1));
await browser.close();
if (errors.length || !code.includes('digitalWrite(13')) process.exit(1);
