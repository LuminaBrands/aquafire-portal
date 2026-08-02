import { chromium } from 'playwright';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FONTS = join(dirname(fileURLToPath(import.meta.url)), 'fonts');

const OUT = process.env.OUT_DIR;
const BASE = 'http://127.0.0.1:8901';
const versions = (process.env.ONLY ? process.env.ONLY.split(',') : ['v1', 'v2', 'v3', 'v4', 'v5']);
mkdirSync(OUT, { recursive: true });

// Stand-ins for cdn.shopify.com (blocked from this sandbox). Real pages load the
// real CDN assets; these SVGs only exist so local screenshots show composition.
function standin(url) {
  if (url.includes('Primary-White2')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="64" viewBox="0 0 360 64">
      <text x="0" y="46" font-family="Georgia, serif" font-size="44" letter-spacing="6" fill="#ffffff">AQUAFIRE</text></svg>`;
  }
  const label = url.includes('PRO.png') ? 'PRO' : url.includes('ORIGINAL') ? 'ORIGINAL' : url.includes('LITE') ? 'LITE' : 'IMG';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500" viewBox="0 0 900 500">
    <defs>
      <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a3f46"/><stop offset="1" stop-color="#1e2126"/>
      </linearGradient>
      <linearGradient id="fl" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#ff9d45"/><stop offset="0.7" stop-color="#ffc98f" stop-opacity="0.7"/><stop offset="1" stop-color="#ffc98f" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="60" y="240" width="780" height="150" rx="18" fill="url(#body)"/>
    <rect x="90" y="268" width="720" height="26" rx="10" fill="#0c0d10"/>
    <g opacity="0.95">
      <ellipse cx="230" cy="240" rx="46" ry="90" fill="url(#fl)"/>
      <ellipse cx="360" cy="228" rx="52" ry="106" fill="url(#fl)"/>
      <ellipse cx="470" cy="238" rx="42" ry="92" fill="url(#fl)"/>
      <ellipse cx="580" cy="226" rx="54" ry="108" fill="url(#fl)"/>
      <ellipse cx="690" cy="240" rx="44" ry="88" fill="url(#fl)"/>
    </g>
    <text x="450" y="446" text-anchor="middle" font-family="sans-serif" font-size="30" letter-spacing="8" fill="#8a919c">${label}</text>
  </svg>`;
}

// Stand-in for the Higgsfield CDN lobby photo (Option B) — blocked from this
// sandbox. A warm hotel-lobby-ish SVG so local shots show the integration.
const LOBBY = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a221b"/><stop offset="0.55" stop-color="#41352a"/><stop offset="1" stop-color="#1d1712"/>
    </linearGradient>
    <linearGradient id="marble" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#57483a"/><stop offset="0.5" stop-color="#6a5946"/><stop offset="1" stop-color="#3c3126"/>
    </linearGradient>
    <linearGradient id="fl" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#ff8a3d"/><stop offset="0.6" stop-color="#ffb877" stop-opacity="0.75"/><stop offset="1" stop-color="#ffd9ae" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ff9d45" stop-opacity="0.5"/><stop offset="1" stop-color="#ff9d45" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#191411"/><stop offset="1" stop-color="#0d0a08"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="720" fill="url(#wall)"/>
  <rect y="720" width="1600" height="280" fill="url(#floor)"/>
  <rect x="430" y="170" width="740" height="470" rx="10" fill="url(#marble)"/>
  <rect x="452" y="192" width="696" height="426" rx="6" fill="#2b231c"/>
  <ellipse cx="800" cy="500" rx="380" ry="160" fill="url(#glow)"/>
  <rect x="520" y="470" width="560" height="72" rx="10" fill="#0f0c09"/>
  <g opacity="0.95">
    <ellipse cx="600" cy="452" rx="26" ry="58" fill="url(#fl)"/>
    <ellipse cx="672" cy="440" rx="30" ry="70" fill="url(#fl)"/>
    <ellipse cx="748" cy="450" rx="24" ry="60" fill="url(#fl)"/>
    <ellipse cx="822" cy="438" rx="32" ry="74" fill="url(#fl)"/>
    <ellipse cx="898" cy="452" rx="25" ry="58" fill="url(#fl)"/>
    <ellipse cx="972" cy="442" rx="29" ry="68" fill="url(#fl)"/>
  </g>
  <ellipse cx="800" cy="760" rx="330" ry="34" fill="#ff9d45" opacity="0.08"/>
  <g fill="#0f0c0a">
    <rect x="80" y="620" width="300" height="120" rx="26"/>
    <rect x="1220" y="620" width="300" height="120" rx="26"/>
  </g>
  <g fill="#ffd9ae" opacity="0.5">
    <circle cx="200" cy="150" r="7"/><circle cx="320" cy="120" r="5"/>
    <circle cx="1300" cy="140" r="7"/><circle cx="1430" cy="110" r="5"/>
  </g>
</svg>`;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' },
});

for (const v of versions) {
  const [dir, query] = v.split('?');
  const pageUrl = `${BASE}/${dir}/index.html${query ? '?' + query : ''}`;
  const slug = v.replace(/[?=]/g, '-');
  for (const [tag, vp, full] of [
    ['desktop', { width: 1440, height: 900 }, false],
    ['desktop-full', { width: 1440, height: 900 }, true],
    ['mobile-full', { width: 390, height: 844 }, true],
  ]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: tag.startsWith('mobile') ? 2 : 1.25, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    await page.route('**/*', (route) => {
      const u = route.request().url();
      if (u.includes('cdn.shopify.com')) {
        return route.fulfill({ contentType: 'image/svg+xml', body: standin(u) });
      }
      if (u.includes('d8j0ntlcm91z4.cloudfront.net')) {
        return route.fulfill({ contentType: 'image/svg+xml', body: LOBBY });
      }
      if (u.startsWith('https://fonts.googleapis.com/css2')) {
        return route.fulfill({ contentType: 'text/css', body: readFileSync(join(FONTS, `${dir}.css`), 'utf8') });
      }
      if (u.startsWith('https://fonts.gstatic.com/')) {
        const f = join(FONTS, u.replace('https://fonts.gstatic.com/', '').replaceAll('/', '_'));
        if (existsSync(f)) return route.fulfill({ contentType: 'font/woff2', body: readFileSync(f) });
        return route.abort();
      }
      return route.continue();
    });
    page.on('requestfailed', (r) => console.log(`${v} ${tag} FAILED: ${r.url().slice(0, 110)} ${r.failure()?.errorText}`));
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 30000 }).catch(async () => {
      await page.goto(pageUrl, { waitUntil: 'load', timeout: 30000 });
    });
    await page.waitForTimeout(1400); // fonts + first animation frames
    await page.screenshot({ path: `${OUT}/${slug}-${tag}.png`, fullPage: full });
    if (errors.length) console.log(`${v} ${tag} console errors:`, errors.slice(0, 5));
    await ctx.close();
  }
  console.log(`${v} done`);
}
await browser.close();
console.log('all done ->', OUT);
