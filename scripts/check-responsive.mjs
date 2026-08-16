// Verifica a responsividade do site em várias larguras: overflow horizontal,
// visibilidade da navbar e estado dos botões. Uso: node scripts/check-responsive.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { rmSync } from 'node:fs';

const execFileP = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'deploy');
const PORT = 4190;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const REPORT = `<script>
window.addEventListener('load', () => {
  setTimeout(() => {
    const de = document.documentElement;
    const nav = document.querySelector('.top-nav');
    const hero = document.querySelector('.hero-grid');
    const dl = document.querySelector('.dl-row');
    document.title = JSON.stringify({
      w: window.innerWidth,
      scrollW: de.scrollWidth,
      overflow: de.scrollWidth > window.innerWidth + 1,
      navDisplay: nav ? getComputedStyle(nav).display : 'none',
      heroCols: hero ? getComputedStyle(hero).gridTemplateColumns.split(' ').length : 0,
      dlWrap: dl ? getComputedStyle(dl).flexWrap : 'nowrap'
    });
  }, 400);
});
</script>`;

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = url.pathname === '/' ? '/index.html' : url.pathname;
  try {
    let buf = await readFile(join(SITE, p));
    if (p === '/index.html') {
      buf = Buffer.from(buf.toString('utf8').replace('</body>', REPORT + '</body>'));
    }
    res.writeHead(200, { 'Content-Type': p.endsWith('.png') ? 'image/png' : 'text/html' });
    res.end(buf);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(PORT, r));

const SIZES = [[1920,1080],[1440,900],[1366,768],[1280,720],[768,1024],[390,844]];
for (const [w, h] of SIZES) {
  const profile = join(tmpdir(), `knt-resp-${w}-${process.pid}`);
  const args = ['--headless=new','--disable-gpu','--no-sandbox',`--user-data-dir=${profile}`,
    `--window-size=${w},${h}`,'--virtual-time-budget=2500','--dump-dom',`http://localhost:${PORT}/`];
  try {
    const { stdout } = await execFileP(CHROME, args, { timeout: 25000 });
    const m = stdout.match(/<title>(.*?)<\/title>/);
    console.log(`${w}x${h}:`, m ? m[1] : 'SEM TITLE');
  } catch (e) { console.log(`${w}x${h}: ERRO ${e.message.split('\n')[0]}`); }
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
server.close();
