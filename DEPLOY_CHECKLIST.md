# ✅ Checklist de Deploy

Use este checklist antes de fazer merge para `staging` ou `main`.

---

## 📋 Pré-Deploy (Desenvolvimento)

### Código

-   [ ] Build passa localmente: `pnpm build`
-   [ ] Lint sem erros: `pnpm lint`
-   [ ] TypeScript sem erros: `pnpm tsc --noEmit`
-   [ ] Testes passando (se houver): `pnpm test`
-   [ ] Código revisado (self-review)
-   [ ] Commits bem descritos (conventional commits)

### Funcionalidade

-   [ ] Feature testada localmente
-   [ ] Edge cases considerados
-   [ ] Error handling implementado
-   [ ] Loading states implementados
-   [ ] Responsividade verificada (mobile/tablet/desktop)

### Dados

-   [ ] Migrations SQL criadas (se necessário)
-   [ ] Triggers SQL atualizados (se necessário)
-   [ ] Seeds de teste criados (se necessário)
-   [ ] Backup de dados críticos (production)

---

## 🟡 Deploy para Staging

### Antes do Merge

-   [ ] Branch atualizada com `dev`: `git merge dev`
-   [ ] Conflitos resolvidos
-   [ ] CI/CD passa no GitHub Actions
-   [ ] Variables de ambiente configuradas (Preview)

### Após o Deploy

-   [ ] Deployment bem-sucedido (verificar Vercel Dashboard)
-   [ ] URL de staging acessível
-   [ ] Funcionalidade testada em staging
-   [ ] Migrations aplicadas no banco de staging (se houver)
-   [ ] Logs sem erros críticos

### Testes em Staging

-   [ ] Fluxo completo de usuário testado
-   [ ] Integrações funcionando (Supabase, APIs externas)
-   [ ] Performance aceitável (Core Web Vitals)
-   [ ] SEO básico verificado
-   [ ] Analytics funcionando

---

## 🟢 Deploy para Production

### Pré-requisitos

-   [ ] Aprovação de staging (testes completos)
-   [ ] No mínimo 24h em staging sem issues críticos
-   [ ] Documentação atualizada
-   [ ] CHANGELOG.md atualizado
-   [ ] Equipe notificada sobre deploy

### Migrations e Banco de Dados

-   [ ] Backup do banco de produção criado
-   [ ] Migrations testadas em staging
-   [ ] Plano de rollback preparado
-   [ ] Tempo de downtime estimado (se houver)
-   [ ] Notificação de manutenção enviada (se necessário)

### Deploy

-   [ ] Merge staging → main
-   [ ] CI/CD passa no GitHub Actions
-   [ ] Deployment bem-sucedido
-   [ ] Migrations aplicadas (se houver)
-   [ ] Smoke tests realizados

### Pós-Deploy (Primeiras 2 horas)

-   [ ] Site acessível e responsivo
-   [ ] Funcionalidade principal funcionando
-   [ ] Logs monitorados (sem erros críticos)
-   [ ] Analytics reportando corretamente
-   [ ] Performance aceitável (Vercel Analytics)
-   [ ] Alertas configurados

### Pós-Deploy (Primeiras 24 horas)

-   [ ] Métricas de uso normais
-   [ ] Nenhum bug crítico reportado
-   [ ] Feedback de usuários coletado
-   [ ] Documentação de rollback atualizada

---

## 🔄 Rollback (se necessário)

### Indicadores de Rollback Necessário

-   ❌ Error rate > 5%
-   ❌ Performance degradation > 50%
-   ❌ Funcionalidade crítica quebrada
-   ❌ Perda de dados
-   ❌ Security vulnerability descoberta

### Procedimento de Rollback

#### Opção 1: Vercel Dashboard (Rápido)

```bash
# 1. Abra Vercel Dashboard → Deployments
# 2. Encontre deployment anterior estável
# 3. Clique "Promote to Production"
```

#### Opção 2: Vercel CLI

```bash
# Listar deployments
vercel ls

# Fazer rollback para URL específica
vercel rollback [deployment-url]
```

#### Opção 3: Git Revert

```bash
# Reverter último commit
git revert HEAD

# Push para forçar novo deploy
git push origin main
```

### Após Rollback

-   [ ] Confirmar que sistema voltou ao normal
-   [ ] Notificar equipe
-   [ ] Investigar causa raiz
-   [ ] Documentar incidente
-   [ ] Planejar fix

---

## 📊 Métricas de Sucesso

### Performance

-   [ ] LCP < 2.5s (Largest Contentful Paint)
-   [ ] FID < 100ms (First Input Delay)
-   [ ] CLS < 0.1 (Cumulative Layout Shift)
-   [ ] Response time API < 500ms

### Disponibilidade

-   [ ] Uptime > 99.9%
-   [ ] Error rate < 1%
-   [ ] No critical alerts

### Negócio

-   [ ] Feature adoption > 10% (primeira semana)
-   [ ] No increase in bounce rate
-   [ ] User satisfaction maintained

---

## 🚨 Contatos de Emergência

```
Equipe Dev:     [seu-email@exemplo.com]
Supabase:       support@supabase.io
Vercel:         support@vercel.com
Google Cloud:   cloud-support@google.com
```

---

## 📝 Template de Comunicação

### Notificação de Deploy (Staging)

```
🎭 Deploy para Staging

Branch: staging
Commit: abc123
Features:
- Nova funcionalidade X
- Correção de bug Y

URL: https://staging-prova-facil.vercel.app
Testes necessários: [lista]
Prazo para feedback: 24h
```

### Notificação de Deploy (Production)

```
🚀 Deploy para Production

Versão: v1.2.0
Horário: 14:00 BRT
Downtime esperado: 0 minutos

Novidades:
- Feature A
- Melhoria B
- Correção C

Rollback plan: Disponível
Monitoramento: Ativo
```

### Notificação de Rollback

```
⚠️ Rollback Executado

Versão revertida: v1.2.0 → v1.1.5
Motivo: [descrição]
Status: Sistema estável
Próximos passos: [ações]
```

---

## 📖 Recursos

-   [Vercel Deployment Protection](https://vercel.com/docs/security/deployment-protection)
-   [GitHub Actions Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
-   [Database Migration Best Practices](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)

---

**Mantenha este checklist atualizado com lições aprendidas de cada deploy!**

**Última atualização:** 01 de Outubro de 2025  
**Mantido por:** Equipe Prova Fácil
