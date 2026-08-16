// Captura screenshots REAIS da interface do KNT Manager para o site oficial.
//
// Como funciona:
//   1. Sobe um servidor estático local servindo web/ (com o banner de demo
//      removido e um pequeno script que navega para a página via goTo()).
//   2. Faz proxy de /api/* e /proxy* para o relay real (web/server.mjs), para
//      o Charts carregar dados reais da Roblox.
//   3. Dispara o Chrome headless para cada página e salva PNGs em site/screenshots/.
//
// Uso:
//   node web/server.mjs 4174 &            # relay real (opcional, para charts)
//   node scripts/capture-shots.mjs
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileP = promisify(execFile);
import { tmpdir } from 'node:os';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(ROOT, 'web');
const OUT = join(ROOT, 'site', 'screenshots');
const PORT = 4175;
const RELAY = 4174;

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROFILE = join(tmpdir(), 'knt-capture-profile');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

// Script injetado no final do <body>: navega para a página do hash e, no
// dashboard, simula o launch de 3 contas para a captura mostrar "live".
const PREPARE = `
<script>
window.addEventListener('load', async () => {
  try {
    const h = (location.hash || '#dashboard').slice(1);
    if (h === 'dashboard') {
      const accs = await window.api.getAccounts().catch(() => []);
      for (const a of (accs || []).slice(0, 3)) await window.api.launchRoblox(a.id).catch(() => {});
      await new Promise(r => setTimeout(r, 800));
    }
    if (window.goTo) window.goTo(h);
    await new Promise(r => setTimeout(r, 1500));
  } catch (e) { console.error('capture-prepare:', e); }
  window.__shotReady = true;
});
</script>
`;

function serveStatic(req, res) {
  const url = new URL(req.url, 'http://x');
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const file = join(WEB, p);
  if (!file.startsWith(WEB)) { res.writeHead(403); res.end(); return; }
  readFile(file).then(buf => {
    if (p === '/index.html') {
      let html = buf.toString('utf8');
      // remove o banner da demo para uma captura limpa (ancorado no botão de fechar)
      html = html.replace(/<!-- web build: informational banner[\s\S]*?aria-label="Dismiss">&times;<\/button>\s*<\/div>\s*/m, '');
      // injeta a navegação por hash
      html = html.replace('</body>', PREPARE + '\n</body>');
      res.writeHead(200, { 'Content-Type': MIME['.html'] });
      res.end(html);
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  }).catch(() => { res.writeHead(404); res.end('not found'); });
}

// proxy de /api/* e /proxy* para o relay real
function proxyRelay(req, res) {
  const url = new URL(req.url, 'http://x');
  const target = `http://localhost:${RELAY}${url.pathname}${url.search}`;
  const pr = fetch(target, { method: req.method, headers: { 'Content-Type': req.headers['content-type'] || '' }, body: req.method === 'POST' ? undefined : undefined });
  pr.then(async r => {
    const buf = Buffer.from(await r.arrayBuffer());
    res.writeHead(r.status, { 'Content-Type': r.headers.get('content-type') || 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(buf);
  }).catch(() => { res.writeHead(502); res.end('relay offline'); });
}

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/proxy')) return proxyRelay(req, res);
  return serveStatic(req, res);
});

const PAGES = [
  ['dashboard', 'Painel'],
  ['accounts', 'Contas'],
  ['groups', 'Grupos'],
  ['mixer', 'Mixer'],
  ['generator', 'Gerador'],
  ['charts', 'Gráficos'],
  ['tracking', 'Tracking'],
  ['settings', 'Configurações'],
  ['logs', 'Logs'],
];

await mkdir(OUT, { recursive: true });
await new Promise(r => server.listen(PORT, r));
console.log(`capture server em http://localhost:${PORT} (relay: :${RELAY})`);

let ok = 0, fail = 0;
for (const [page, label] of PAGES) {
  const out = join(OUT, `${page}.png`);
  const args = [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--no-first-run', '--no-default-browser-check', '--mute-audio',
    `--user-data-dir=${PROFILE}`,
    '--window-size=1440,900',
    '--virtual-time-budget=12000', '--timeout=30000',
    `--screenshot=${out}`,
    `http://localhost:${PORT}/#${page}`,
  ];
  try {
    await execFileP(CHROME, args, { timeout: 40000 });
    const st = await stat(out);
    if (st.size > 20000) { ok++; console.log(`  ✓ ${page}.png (${(st.size / 1024).toFixed(0)} KB)`); }
    else { fail++; console.log(`  ✗ ${page}.png muito pequeno (${st.size} B) — página pode ter falhado`); }
  } catch (e) {
    fail++;
    console.log(`  ✗ ${page} falhou: ${e.message.split('\n')[0]}`);
  }
}
server.close();
console.log(`\nPronto: ${ok} ok, ${fail} falhas → site/screenshots/`);
process.exit(fail ? 1 : 0);
