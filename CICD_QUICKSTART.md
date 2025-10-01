# 🚀 Guia Rápido - CI/CD

## Setup Inicial (Uma vez apenas)

```bash
# 1. Execute o script de setup
chmod +x setup-cicd.sh
./setup-cicd.sh

# 2. Configure os secrets no GitHub (conforme output do script)

# 3. Configure variáveis de ambiente no Vercel Dashboard
```

## Fluxo de Trabalho Diário

### Desenvolvimento Local

```bash
# Criar feature branch
git checkout -b feature/minha-feature

# Desenvolver...
pnpm dev

# Commit
git add .
git commit -m "feat: nova funcionalidade"

# Push (sem deploy automático)
git push origin feature/minha-feature
```

### Deploy para Development

```bash
# Merge para dev
git checkout dev
git merge feature/minha-feature

# Push (deploy automático para development)
git push origin dev

# ✅ Deploy em: dev-prova-facil.vercel.app
```

### Deploy para Staging (Testes)

```bash
# Merge dev para staging
git checkout staging
git merge dev

# Push (deploy automático para preview/staging)
git push origin staging

# ✅ Deploy em: staging-prova-facil.vercel.app
```

### Deploy para Production

```bash
# Merge staging para main (após testes)
git checkout main
git merge staging

# Push (deploy automático para production)
git push origin main

# ✅ Deploy em: prova-facil.vercel.app
```

## Comandos Úteis

### Ver status do CI/CD

```bash
# Abrir GitHub Actions no browser
gh run list  # Lista últimos workflows
gh run view  # Ver detalhes do último
gh run watch # Assistir workflow em tempo real
```

### Vercel CLI (local)

```bash
# Deploy manual (se necessário)
vercel --prod  # Production
vercel         # Preview

# Ver logs
vercel logs

# Ver deployments
vercel ls

# Ver variáveis de ambiente
vercel env ls
```

### Rollback (se necessário)

```bash
# Via Vercel Dashboard ou CLI
vercel rollback [deployment-url]

# Ou via Git
git revert HEAD
git push origin main
```

## Checklist de Deploy

### Antes de fazer merge para staging/main:

-   [ ] Tests passando localmente
-   [ ] Build funcionando: `pnpm build`
-   [ ] Lint sem erros: `pnpm lint`
-   [ ] Variáveis de ambiente configuradas no Vercel
-   [ ] Migrations SQL aplicadas (se houver)
-   [ ] Documentação atualizada

## Troubleshooting Rápido

### Deploy falhou

```bash
# 1. Ver logs no GitHub Actions
# 2. Verificar se secrets estão configurados
# 3. Testar build local: pnpm build
# 4. Verificar variáveis de ambiente no Vercel
```

### Variáveis não funcionando

```bash
# Verificar no Vercel Dashboard:
# Settings → Environment Variables
# Certifique-se de selecionar o ambiente correto
```

### CI/CD não está rodando

```bash
# Verificar:
# 1. Branch é main/staging/dev?
# 2. GitHub Actions está habilitado?
# 3. Arquivo .github/workflows/deploy.yml existe?
```

## Links Rápidos

-   [GitHub Actions](https://github.com/InovacodeDev/prova-facil/actions)
-   [Vercel Dashboard](https://vercel.com/dashboard)
-   [Documentação Completa](./CICD_SETUP.md)

---

**Tip:** Adicione ao README principal:

```markdown
![Deploy Status](https://github.com/InovacodeDev/prova-facil/actions/workflows/deploy.yml/badge.svg)
```
