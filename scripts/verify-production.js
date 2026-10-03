import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const widths = [320, 390, 768, 1024, 1440, 1920];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});

// Check all local media and module references, including unused srcset variants.
const sources = [path.join(root, 'index.html'), ...walk(path.join(root, 'css')), ...walk(path.join(root, 'js'))];
const references = new Set();
for (const file of sources) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/(?:src|href)=["']([^"']+)["']|url\(["']?([^\s)'";]+)|(?:from\s*|import\s*)["'](\.[^"']+)["']/g)) {
    const value = match[1] || match[2] || match[3];
    if (/^(?:#|https?:|data:|mailto:|tel:)/.test(value)) continue;
    const resolved = path.resolve(path.dirname(file), value.split(/[?#]/)[0]);
    assert(fs.existsSync(resolved), `Missing reference in ${file}: ${value}`);
    references.add(resolved);
  }
  for (const [value] of text.matchAll(/assets\/[\w./-]+/g)) {
    const resolved = path.join(root, value);
    assert(fs.existsSync(resolved), `Missing asset: ${value}`);
    references.add(resolved);
  }
}

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const executablePath = process.env.CHROME_PATH || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'
].find(file => fs.existsSync(file));
let browser;
try {
  assert(executablePath, 'Set CHROME_PATH to your Chrome/Chromium executable.');
  browser = await puppeteer.launch({ executablePath, headless: true });
  for (const width of widths) {
    const page = await browser.newPage();
    const errors = [];
    const warnings = new Set();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
      if (message.type() === 'warn') warnings.add(message.text());
    });
    page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.setViewport({ width, height: width < 768 ? 844 : 900 });
    await page.setCacheEnabled(false);
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.PronabApp?.dijkstra);
    await page.evaluate(async files => {
      for (const file of files) {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`Asset fetch failed: ${file}`);
      }
    }, [...references].map(file => '/' + path.relative(root, file)));
    assert(await page.evaluate(() => ScrollTrigger.getAll().every(t => t.trigger?.isConnected)), 'Orphan trigger');
    await sleep(2200);
    await page.evaluate(() => {
      const core = PronabApp.interactiveCore;
      core.verificationRenders = 0;
      const render = core.renderer.render.bind(core.renderer);
      core.renderer.render = (...args) => { core.verificationRenders++; return render(...args); };
    });
    const count = () => page.evaluate(() => ScrollTrigger.getAll().length);
    const initialCount = await count();
    const go = async y => {
      await page.evaluate(y => {
        PronabApp.scrollEngine.lenis?.scrollTo(y, { immediate: true, force: true });
        window.scrollTo(0, y);
        ScrollTrigger.update();
      }, y);
      await sleep(150);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, `${width}px overflow at ${y}`);
    };
    const sectionTop = id => page.evaluate(id => document.getElementById(id).getBoundingClientRect().top + scrollY, id);
    const ids = await page.evaluate(() => [...document.querySelectorAll('main section[id]')].map(el => el.id));
    const positions = [];
    for (const id of ids) positions.push(await sectionTop(id));
    positions.push(...await page.evaluate(() => ScrollTrigger.getAll().filter(t => t.pin).flatMap(t => [t.start + 1, (t.start + t.end) / 2, t.end - 1])));
    positions.push(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight));
    positions.sort((a, b) => a - b);
    for (const y of positions) await go(y);
    assert.equal(await count(), initialCount);
    for (const id of ['nexus', 'about', 'contact']) {
      await go(await sectionTop(id));
      const renders = await page.evaluate(() => PronabApp.interactiveCore.verificationRenders);
      await sleep(100);
      assert.deepEqual(await page.evaluate(() => [PronabApp.interactiveCore.animationFrameId, PronabApp.work.nexusInterval]), [null, null]);
      assert.equal(await page.evaluate(() => PronabApp.interactiveCore.verificationRenders), renders);
    }
    const finalState = () => page.evaluate(() => [...document.querySelectorAll('#nexus-exit-bridge,#about-story-headline,.person-portrait-img,#about-exit-bridge,#contact-heading,.contact-primary-block')].map(el => {
      const s = getComputedStyle(el);
      return [s.transform, s.opacity, s.visibility, s.pointerEvents];
    }));
    const transitions = [];
    for (const id of ['nexus', 'about', 'contact']) {
      const y = await sectionTop(id) - await page.evaluate(() => innerHeight / 2);
      await go(y);
      transitions.push({ y, state: await finalState() });
    }
    await go(await page.evaluate(() => document.documentElement.scrollHeight));
    await sleep(400);
    assert.deepEqual(await page.evaluate(() => [PronabApp.interactiveCore.animationFrameId, PronabApp.work.nexusInterval, PronabApp.liveSystem.rafId, PronabApp.performance.liveRafId, PronabApp.cursor.animationFrameId ?? null]), [null, null, null, null, null]);
    for (const { y, state } of transitions.reverse()) { await go(y); assert.deepEqual(await finalState(), state, `${width}px reverse transition mismatch`); }
    for (const y of [...positions].reverse()) await go(y);
    await go(0);
    assert.equal(await count(), initialCount);
    await page.setViewport({ width, height: 880 });
    await sleep(350);
    assert.equal(await count(), initialCount);

    // Exercise actual controls without following external links.
    await go(await sectionTop('lab'));
    await page.evaluate(() => document.getElementById('btn-algo-step').click());
    assert.equal(await page.evaluate(() => PronabApp.dijkstra.currentStepIndex), 1);
    await page.evaluate(() => {
      const a = PronabApp.dijkstra;
      while (a.currentStepIndex < a.steps.length - 1) a.stepForward();
    });
    assert.equal(await page.evaluate(() => PronabApp.dijkstra.steps.at(-1).dist.F), 7);
    await page.evaluate(() => document.getElementById('btn-algo-reset').click());
    await page.evaluate(() => document.getElementById('btn-algo-start').click());
    await go(await sectionTop('contact'));
    assert.equal(await page.evaluate(() => PronabApp.dijkstra.timer), null, 'Algorithm must pause offscreen');
    await page.evaluate(() => {
      document.querySelector('.proto-nexus-btn').click();
      document.querySelector('.proto-service-pill:last-child').click();
      document.querySelector('.proto-slot-pill:last-child').click();
      document.querySelector('.proto-book-btn').click();
      document.querySelector('.proto-sim-lead-btn').click();
    });
    assert.equal(await page.$eval('.proto-nexus-btn', el => el.getAttribute('aria-pressed')), 'false');
    assert.match(await page.$eval('.proto-confirm-banner', el => el.textContent), /04:00 PM/);
    assert.equal(await page.$eval('#proto-growth-os .proto-lead-name', el => el.textContent), 'Dr. Sarah Lin');
    await page.evaluate(() => document.querySelector('.details-summary-btn').click());
    await page.waitForFunction(() => document.querySelector('.details-summary-btn').getAttribute('aria-expanded') === 'true');
    await page.evaluate(() => document.querySelector('.details-summary-btn').click());
    await page.waitForFunction(() => document.querySelector('.details-summary-btn').getAttribute('aria-expanded') === 'false');
    if (width < 768) {
      await page.evaluate(() => {
        const engine = PronabApp.scrollEngine;
        const original = engine.scrollTo.bind(engine);
        window.navigationCalls = 0;
        engine.scrollTo = (...args) => { navigationCalls++; return original(...args); };
        document.getElementById('mobile-menu-toggle').click();
        document.querySelector('.mobile-nav-link').click();
      });
      assert.equal(await page.evaluate(() => navigationCalls), 1, 'Duplicate navigation listener');
      assert.equal(await page.$eval('#mobile-menu-toggle', el => el.getAttribute('aria-expanded')), 'false');
    }
    const duplicates = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    });
    assert.deepEqual(duplicates, []);
    assert.deepEqual(errors, [], `${width}px runtime/network errors`);
    console.log(`${width}px: PASS; ${initialCount} stable triggers; 0 overflow/errors/missing requests; forward/reverse and controls verified.`);
    if (warnings.size) console.log('Browser warnings:', [...warnings]);
    await page.close();
  }
  const reduced = await browser.newPage();
  await reduced.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await reduced.goto(url, { waitUntil: 'networkidle0' });
  assert.deepEqual(await reduced.evaluate(() => [PronabApp.interactiveCore.animationFrameId, getComputedStyle(document.getElementById('about-story-headline')).opacity, getComputedStyle(document.getElementById('contact-heading')).opacity]), [null, '1', '1']);
  console.log(`PASS: ${references.size} local references exist; reduced motion preserved. No captures or reports generated.`);
} finally {
  if (browser) await browser.close();
  server.close();
}
