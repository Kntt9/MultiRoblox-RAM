// Builds preview.html — the app's real index.html with styles.css, the i18n
// dictionaries and renderer.js inlined, and window.api stubbed with fake data
// so the whole UI (accounts grid, settings, modals) renders without Tauri.
import { readFileSync, writeFileSync } from 'node:fs';

const read = (p) => readFileSync(p, 'utf8');

let html = read('src/index.html');
const css = read('src/styles.css');
const en = read('src/i18n/en.js');
const pt = read('src/i18n/pt.js');
const renderer = read('src/renderer.js');

// ── fake data ────────────────────────────────────────────────────────────────
const FAKE = `
<script>
// ── KNT Manager preview stub: replaces tauri-bridge.js ─────────────────────
window.__PREVIEW_STUB__ = true;
const _accounts = [
  { id: 'a1', username: 'KNT_Farm01', nickname: 'Farm01', userId: 1101, cookie: 'x', gameTarget: '6872265039', categoryId: 'c-farm' },
  { id: 'a2', username: 'KNT_Farm02', nickname: 'Farm02', userId: 1102, cookie: 'x', gameTarget: '6872265039', categoryId: 'c-farm' },
  { id: 'a3', username: 'TradeKing_Alt', nickname: 'Trade King Alt', userId: 1103, cookie: 'x', gameTarget: 'https://www.roblox.com/share/L4EnY8NMuQ', categoryId: 'c-trade' },
  { id: 'a4', username: 'noob_lord_420', nickname: 'noob lord', userId: 1104, cookie: null, gameTarget: '', categoryId: 'c-farm' },
  { id: 'a5', username: 'Cookies4Life', nickname: 'Cookies', userId: 1105, cookie: 'x', gameTarget: '', categoryId: null },
  { id: 'a6', username: 'Sniper_Bot99', nickname: 'Sniper Bot', userId: 1106, cookie: 'x', gameTarget: '', categoryId: 'c-trade' },
  { id: 'a7', username: 'TheRealKNT', nickname: 'KNT', userId: 1107, cookie: 'x', gameTarget: '6872265039', categoryId: null },
  { id: 'a8', username: 'Burner_Alt_77', nickname: 'Burner', userId: 1108, cookie: 'x', gameTarget: '', categoryId: null, trashed: true },
];
const _settings = {
  language: 'en',
  theme: 'dark',
  categories: [
    { id: 'c-farm', name: 'Farm', color: '#59c2ff' },
    { id: 'c-trade', name: 'Trade', color: '#b58cff' },
  ],
  multiInstance: true,
  antiAfk: true,
  antiAfkInterval: 19 * 60,
  relaunch: false,
  autoTrim: true,
  autoTrimIntervalMin: 5,
  lowPriorityMultiInstance: true,
  lockChannel: false,
  robloxChannel: 'production',
  renderEngine: 'automatic',
  graphicsApi: 'automatic',
  gfxQuality: 10,
  fpsCap: 60,
  encryption: 'dpapi',
  webhook: '',
  trackInterval: 60,
  trackSpots: {},
};
let _autoBackups = [
  { name: 'multiroblox-backup-2026-08-14-091500.mrbackup', path: 'C:\\auto\\backups\\multiroblox-backup-2026-08-14-091500.mrbackup', size: 48213, createdAtMs: Date.now() - 36 * 3600 * 1000 },
  { name: 'multiroblox-backup-2026-08-13-091500.mrbackup', path: 'C:\\auto\\backups\\multiroblox-backup-2026-08-13-091500.mrbackup', size: 47902, createdAtMs: Date.now() - 60 * 3600 * 1000 },
];
window.api = new Proxy({}, {
  get(_t, prop) {
    if (typeof prop !== 'string') return undefined;
    switch (prop) {
      case 'loadAccounts': return () => Promise.resolve(JSON.parse(JSON.stringify(_accounts)));
      case 'loadSettings': return () => Promise.resolve(JSON.parse(JSON.stringify(_settings)));
      case 'loadPackages': return () => Promise.resolve([]);
      case 'encStatus': return () => Promise.resolve({ mode: 'none' });
      case 'getAppVersion': return () => Promise.resolve('0.5.0');
      case 'getRobloxVersion': return () => Promise.resolve('version-2b8f0c1');
      case 'antiAfkStatus': return () => Promise.resolve({ enabled: true, active: 2 });
      case 'multiInstanceStatus': return () => Promise.resolve({ enabled: true });
      case 'readGenHistory': return () => Promise.resolve([]);
      case 'validateCookie': return () => Promise.resolve({ ok: true });
      case 'getRunningCount': return () => Promise.resolve(2);
      case 'getWatchedIds': return () => Promise.resolve(['a1', 'a2']);
      case 'robloxGet': return () => Promise.resolve({ ok: false, status: 0, data: null });
      case 'getGameName': return () => Promise.resolve('');
      case 'openExternal': return () => Promise.resolve();
      case 'saveSettings': return (d) => { Object.assign(_settings, d); return Promise.resolve(true); };
      case 'backupAutoPassword': return () => Promise.resolve({ ok: true, password: 'Xy7Km2Vq9Zt4Np8Rf3Jw6As5' });
      case 'backupAutoCreate': return (pw, keep) => {
        const stamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 15);
        _autoBackups.unshift({ name: 'multiroblox-backup-' + stamp + '.mrbackup', path: 'C:\\auto\\backups\\multiroblox-backup-' + stamp + '.mrbackup', size: 48000 + Math.floor(Math.random() * 3000), createdAtMs: Date.now() });
        if (_autoBackups.length > (keep || 5)) _autoBackups.length = keep || 5;
        return Promise.resolve({ ok: true, path: _autoBackups[0].path, count: 7, pruned: 0 });
      };
      case 'backupList': return () => Promise.resolve(JSON.parse(JSON.stringify(_autoBackups)));
      case 'backupDelete': return (name) => { _autoBackups = _autoBackups.filter(b => b.name !== name); return Promise.resolve({ ok: true }); };
      case 'backupRestorePath': return () => Promise.resolve({ ok: true, count: 7 });
      case 'minimize': case 'maximize': case 'close': return () => Promise.resolve();
      default:
        if (prop.startsWith('on')) return () => () => {};
        return () => Promise.resolve({ ok: true });
    }
  },
});
</script>
`;

// ── inline assets ────────────────────────────────────────────────────────────
html = html.replace('<link rel="stylesheet" href="styles.css"/>', '<style>\n' + css + '\n</style>');
html = html.replace('<script src="i18n/en.js"></script>', '<script>\n' + en + '\n</script>');
html = html.replace('<script src="i18n/pt.js"></script>', '<script>\n' + pt + '\n</script>');
html = html.replace('<script src="tauri-bridge.js"></script>', FAKE);
html = html.replace('<script src="renderer.js"></script>', '<script>\n' + renderer + '\n</script>');

writeFileSync('preview.html', html, 'utf8');
console.log('preview.html written (' + (html.length / 1024).toFixed(0) + ' KB)');
