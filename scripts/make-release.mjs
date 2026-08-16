// Monta a pasta `release/` com tudo que precisa subir para um GitHub Release
// para o auto-update funcionar: instalador NSIS, assinatura (.sig) e o
// manifesto `latest-version.json` que o app consulta no startup.
//
// Pré-requisito: rodar o build assinado primeiro (ver UPDATING.md):
//   npx tauri build --bundles nsis
//
// Uso:
//   node scripts/make-release.mjs                    # repo lido do tauri.conf.json (homepage)
//   node scripts/make-release.mjs --repo USUARIO/REPO --notes "texto do changelog"
//
// Saída: release/MultiRoblox_<v>_x64-setup.exe, ...exe.sig e latest-version.json
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const conf = JSON.parse(readFileSync(join(ROOT, 'src-tauri', 'tauri.conf.json'), 'utf8'));
const version = conf.version;
// O bundler do Tauri usa "x64" no nome do NSIS (não x86_64)
const arch = 'x64';
const installerName = `MultiRoblox_${version}_${arch}-setup.exe`;
const installerPath = join(ROOT, 'src-tauri', 'target', 'release', 'bundle', 'nsis', installerName);
const sigPath = installerPath + '.sig';
const out = join(ROOT, 'release');

let repo = null;
const ri = process.argv.indexOf('--repo');
if (ri !== -1) repo = process.argv[ri + 1];
if (!repo) {
  try {
    repo = new URL(conf.bundle.homepage).pathname.replace(/^\/+|\/+$/g, '');
  } catch {}
}
if (!repo) { console.error('Informe o repositório: --repo USUARIO/REPO'); process.exit(1); }

let notes = '';
const ni = process.argv.indexOf('--notes');
if (ni !== -1) notes = process.argv[ni + 1] || '';

for (const [p, label] of [[installerPath, 'instalador'], [sigPath, 'assinatura (.sig)']]) {
  if (!existsSync(p)) {
    console.error(`✖ ${label} não encontrado: ${p}`);
    console.error('  Rode primeiro o build assinado: npx tauri build --bundles nsis (com as chaves, ver UPDATING.md)');
    process.exit(1);
  }
}

const signature = readFileSync(sigPath, 'utf8').trim();
const manifest = {
  version,
  notes,
  pub_date: new Date().toISOString(),
  platforms: {
    [`windows-${arch === 'x64' ? 'x86_64' : arch}`]: {
      signature,
      url: `https://github.com/${repo}/releases/latest/download/${installerName}`,
    },
  },
};

mkdirSync(out, { recursive: true });
copyFileSync(installerPath, join(out, installerName));
copyFileSync(sigPath, join(out, installerName + '.sig'));
writeFileSync(join(out, 'latest-version.json'), JSON.stringify(manifest, null, 2));

console.log(`release/ pronto (v${version} — ${repo}):`);
for (const f of [installerName, installerName + '.sig', 'latest-version.json']) {
  const size = (statSync(join(out, f)).size / 1024).toFixed(0);
  console.log(`  • ${f} (${size} KB)`);
}
console.log('\nSuba esses 3 arquivos num GitHub Release (ex.: gh release create v' + version + ' release/* --generate-notes)');
console.log('O app instalado detecta a nova versão no próximo start. Detalhes em UPDATING.md');
