// Monta a pasta `deploy/` — o que é publicado em GitHub Pages / Netlify / Vercel.
// O site de origem (site/index.html) aponta os downloads para ../dist/ (funciona
// ao abrir localmente). Aqui esses links são reescritos para o mesmo diretório
// e os artefatos (instalador NSIS + executável portátil) são copiados para
// dentro de deploy/, deixando a pasta autossuficiente.
//
//   node site/build-deploy.mjs
import { existsSync, mkdirSync, readFileSync, copyFileSync, statSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_HTML = join(ROOT, 'site', 'index.html');
const OUT = join(ROOT, 'deploy');

// artefatos de download: instalador NSIS (gerado por `npx tauri build --bundles nsis`)
// e executável portátil (gerado por build.bat / cargo build). Ambos em dist/.
const ARTIFACTS = [
  { src: 'dist/MultiRoblox_0.6.1_x64-setup.exe', name: 'MultiRoblox_0.6.1_x64-setup.exe', label: 'instalador NSIS' },
  { src: 'dist/MultiRoblox.exe', name: 'MultiRoblox.exe', label: 'executável portátil' },
];

mkdirSync(OUT, { recursive: true });

// 1) index.html com os links de download reescritos para o mesmo diretório
let html = readFileSync(SRC_HTML, 'utf8');
for (const a of ARTIFACTS) {
  const from = '../dist/' + a.name;
  const n = (html.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  if (!n) console.warn(`⚠️  nenhum link para ${from} encontrado em site/index.html`);
  html = html.replaceAll(from, a.name);
}
writeFileSync(join(OUT, 'index.html'), html);
console.log('index.html escrito em deploy/ (links de download reescritos)');

// 2) artefatos
for (const a of ARTIFACTS) {
  const full = join(ROOT, a.src);
  if (existsSync(full)) {
    copyFileSync(full, join(OUT, a.name));
    const mb = (statSync(full).size / (1024 * 1024)).toFixed(1);
    console.log(`${a.name} copiado para deploy/ (${mb} MB) — ${a.label}`);
  } else {
    console.warn(`⚠️  ${a.src} não encontrado — o botão de download vai dar 404.`);
    console.warn(`    Instalador:  npx tauri build --bundles nsis   (gera src-tauri/target/release/bundle/nsis/)`);
    console.warn(`    Portátil:    build.bat ou cargo build --release em src-tauri/`);
    console.warn('    Depois copie os artefatos para dist/ (ou commite-os — já estão fora do .gitignore).');
  }
}

// 3) screenshots do app (capturados por scripts/capture-shots.mjs)
const SHOTS_SRC = join(ROOT, 'site', 'screenshots');
const SHOTS_OUT = join(OUT, 'screenshots');
if (existsSync(SHOTS_SRC)) {
  mkdirSync(SHOTS_OUT, { recursive: true });
  for (const f of readdirSync(SHOTS_SRC)) {
    copyFileSync(join(SHOTS_SRC, f), join(SHOTS_OUT, f));
  }
  console.log(`${readdirSync(SHOTS_SRC).length} screenshots copiados para deploy/screenshots/`);
} else {
  console.warn('⚠️  site/screenshots/ não existe — rode scripts/capture-shots.mjs');
}

console.log('\nPasta deploy/ pronta. Publique-a em:');
console.log('  GitHub Pages → .github/workflows/deploy-site.yml (pasta deploy)');
console.log('  Netlify      → netlify.toml (publish = "deploy")');
console.log('  Vercel       → vercel.json (outputDirectory = "deploy")');
