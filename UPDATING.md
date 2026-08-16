# Auto-update do KNT Manager

O app usa o plugin oficial **tauri-plugin-updater**: ao iniciar, ele consulta um
arquivo `latest-version.json` hospedado; se houver versão maior, mostra "Atualização
disponível" e instala com um clique (o instalador NSIS substitui o app e reabre).

## Fluxo completo (o que acontece quando você faz uma alteração comigo)

```
1. Alterar o código do app (comigo, no projeto)
2. Subir a versão  →  tauri.conf.json ("version") e Cargo.toml ([package] version)
3. Build assinado  →  npx tauri build --bundles nsis   (gera instalador + .sig)
4. Manifesto       →  node scripts/make-release.mjs --notes "o que mudou"
5. Publicar        →  subir release/ num GitHub Release (tag v0.6.0)
6. Usuários        →  o app instalado detecta e se atualiza sozinho no próximo start
```

## Como publicar um lançamento

### Opção A — local (rápido, sem GitHub Actions)

```bash
# 3. build assinado (as chaves estão em src-tauri/.updater-secret/ — ver abaixo)
export TAURI_SIGNING_PRIVATE_KEY="$(cat src-tauri/.updater-secret/private.key)"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="$(cat src-tauri/.updater-secret/password.txt)"
npx tauri build --bundles nsis

# 4. monta release/ com instalador + .sig + latest-version.json
node scripts/make-release.mjs --notes "correção X, recurso Y"

# 5. publica (precisa da CLI gh autenticada; o nome da tag define a versão)
git tag v0.6.0 && git push origin v0.6.0
gh release create v0.6.0 release/* --generate-notes
```

### Opção B — automático (GitHub Actions)

O workflow `.github/workflows/release.yml` faz tudo (build + assinatura + release)
ao dar push numa tag `v*`. Antes, configure 2 **secrets** no repositório:

| Secret | Valor |
| --- | --- |
| `TAURI_SIGNING_KEY_B64` | `base64 -w0 src-tauri/.updater-secret/private.key` |
| `TAURI_SIGNING_KEY_PASSWORD` | conteúdo de `src-tauri/.updater-secret/password.txt` |

```bash
git tag v0.6.0 && git push origin v0.6.0   # → workflow cria o Release
```

> O endpoint que o app consulta está no `tauri.conf.json`:
> `https://github.com/Kntt9/MultiRoblox-RAM/releases/latest/download/latest-version.json`.
> Se o repositório for outro, atualize lá (e o `--repo` do script).

## ⚠️ As chaves de assinatura

- Estão em `src-tauri/.updater-secret/` (fora do git, veja o `.gitignore`).
- **Faça backup**: sem a chave privada (ou sem a senha) não dá para assinar novos
  lançamentos e o auto-update para de funcionar para sempre.
- **Nunca** commite a chave privada nem a senha. A chave pública já está gravada
  no `tauri.conf.json` (campo `plugins.updater.pubkey`).

## Verificando

- Build assinado gera `src-tauri/target/release/bundle/nsis/MultiRoblox_<v>_x64-setup.exe` **e** o `.sig` ao lado (arquivos de atualização criados por `createUpdaterArtifacts: true`).
- O botão **Configurações → Atualizações → Verificar atualizações** testa o fluxo manualmente.
- A versão web (`web/`) não atualiza — os comandos são stubs que retornam "atualizado".
