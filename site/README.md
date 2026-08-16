# Site de divulgação do KNT Manager

Página de demonstração (landing page) do programa, em `site/index.html` — arquivo
único, sem dependências, com **duas opções de download**: instalador NSIS
(recomendado) e executável portátil.

- **Abrir localmente:** dê dois cliques em `site/index.html`. Os downloads apontam
  para `../dist/` e funcionam se o `dist/` estiver na raiz do projeto.
- **Publicar:** a pasta `deploy/` é o que vai pro ar (site + instalador + portátil),
  gerada pelo script abaixo.

## Gerando os artefatos de download (dist/)

```bash
# Instalador Windows (NSIS) — gera src-tauri/target/release/bundle/nsis/MultiRoblox_<versao>_x64-setup.exe
npx tauri build --bundles nsis
cp src-tauri/target/release/bundle/nsis/MultiRoblox_*_x64-setup.exe dist/

# Executável portátil — gera dist/MultiRoblox.exe
build.bat   # ou: cargo build --release --manifest-path src-tauri/Cargo.toml --bin MultiRoblox && cp src-tauri/target/release/MultiRoblox.exe dist/
```

Ambos já estão fora do `.gitignore` (`!dist/MultiRoblox.exe` e `!dist/*-setup.exe`),
então commite-os junto com o site.

## Gerando a pasta de publicação

```bash
node site/build-deploy.mjs
```

Cria `deploy/` com `index.html` (links de download reescritos para o mesmo
diretório) e os dois artefatos copiados de `dist/`. Se algum faltar, o script
avisa — o botão correspondente ficaria quebrado.

## Publicando

Tudo já está configurado — escolha um (ou mais):

### GitHub Pages
1. Suba o repositório para o GitHub.
2. Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**.
3. O workflow `.github/workflows/deploy-site.yml` publica automaticamente a cada
   push que mexa em `site/`, `dist/` ou no próprio workflow. Dá pra rodar na mão
   em **Actions → "Deploy site" → Run workflow**.
4. O site fica em `https://SEU-USUARIO.github.io/SEU-REPO/`.

### Netlify
1. Em netlify.com, **Add new site → Import an existing project** e conecte o repositório.
2. O `netlify.toml` já define o build (`node site/build-deploy.mjs`) e a pasta
   pública (`deploy`) — é só dar deploy. O executável é servido como
   *attachment* (download forçado).

### Vercel
1. Em vercel.com, **Add New → Project** e importe o repositório.
2. O `vercel.json` já define `buildCommand` e `outputDirectory` — sem configuração extra.

## Estrutura

```
site/
├── index.html          ← landing page (fonte, abre localmente)
├── build-deploy.mjs    ← gera deploy/ a partir de site/ + dist/
└── README.md
deploy/                 ← gerado; publicar isto (site + MultiRoblox.exe)
.github/workflows/deploy-site.yml
netlify.toml
vercel.json
```
