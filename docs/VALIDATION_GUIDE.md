# ✅ Guia de Validação: Sistema de Metadata e Filtro de Produtos

**Para:** Desenvolvedor/QA
**Data:** 2025-10-14
**Tempo Estimado:** 15-20 minutos

---

## 🎯 O Que Validar

Duas funcionalidades implementadas:

1. ✅ **Filtro de Produtos**: Apenas produtos configurados no .env aparecem
2. ✅ **Sistema de Downgrade com Metadata**: Downgrade não é instantâneo

---

## 🧪 Teste 1: Filtro de Produtos (5 min)

### Objetivo

Verificar que apenas os 5 produtos configurados no `.env` são listados.

### Pré-requisitos

- Servidor rodando (`npm run dev`)
- Acesso ao Stripe Dashboard

### Passos

**1. Verificar produtos configurados no .env**

```bash
cat .env | grep STRIPE_PRODUCT
```

✅ Esperado: Ver 5 produtos (STARTER, BASIC, ESSENTIALS, PLUS, ADVANCED)

**2. Criar produto NÃO configurado no Stripe Dashboard**

- Ir para: https://dashboard.stripe.com/test/products
- Criar novo produto: "TEST_PRODUCT_DO_NOT_USE"
- Marcar como ativo

**3. Listar produtos via API**

```bash
curl http://localhost:8800/api/stripe/products | jq
```

✅ **ESPERADO:**

- Retorna exatamente 5 produtos
- Produtos listados correspondem aos IDs do .env
- "TEST_PRODUCT_DO_NOT_USE" NÃO aparece

❌ **FALHA SE:**

- Retorna mais de 5 produtos
- Produto de teste aparece na lista
- Produtos não configurados aparecem

**4. Verificar UI (página /plan)**

- Abrir: http://localhost:8800/plan
- Contar quantos planos aparecem

✅ **ESPERADO:**

- Exatamente 5 cards de planos
- Sem produtos de teste

---

## 🧪 Teste 2: Downgrade com Metadata (10-15 min)

### Objetivo

Verificar que downgrade mantém plano atual até fim do período.

### Pré-requisitos

- Servidor rodando
- Stripe CLI rodando (`stripe listen --forward-to localhost:8800/api/stripe/webhook`)
- Usuário com subscription ativa (Plus ou Advanced)

### Cenário A: Downgrade de Plus para Basic

**1. Estado Inicial**

```bash
# Verificar plano atual
curl http://localhost:8800/api/stripe/subscription \
  -H "Cookie: [sua-session-cookie]" | jq '.subscription.plan'
```

✅ Esperado: `"plus"` ou `"advanced"`

**2. Fazer Downgrade**

- Abrir: http://localhost:8800/plan
- Clicar no card do plano "Basic"
- Confirmar downgrade
- Aguardar mensagem de sucesso

**3. Verificar Metadata no Stripe**

```bash
# Obter subscription ID do passo 1
stripe subscriptions retrieve sub_xxxxx --expand=data.metadata
```

✅ **ESPERADO:**

```json
{
  "metadata": {
    "previous_plan_product_id": "prod_[PLUS_ID]",
    "previous_plan_expires_at": "1732924800",
    "downgrade_scheduled_to": "prod_[BASIC_ID]"
  }
}
```

❌ **FALHA SE:**

- Metadata vazio
- Campos faltando
- `previous_plan_expires_at` inválido

**4. Verificar Plano Ativo na API**

```bash
curl http://localhost:8800/api/stripe/subscription \
  -H "Cookie: [sua-session-cookie]" | jq
```

✅ **ESPERADO:**

```json
{
  "subscription": {
    "plan": "plus", // ← AINDA É PLUS!
    "cancelAtPeriodEnd": true,
    "currentPeriodEnd": 1732924800
  }
}
```

❌ **FALHA SE:**

- `plan` mudou para "basic" imediatamente
- `cancelAtPeriodEnd` é false

**5. Verificar Sidebar**

- Abrir: http://localhost:8800/dashboard
- Olhar card de plano na sidebar

✅ **ESPERADO:**

- Mostra: "Plano Ativo: plus"
- Badge: "Até DD/MM" aparece
- Tooltip ao passar mouse explica mudança futura

❌ **FALHA SE:**

- Mostra "basic" imediatamente
- Badge não aparece
- Plano mudou sem aviso

**6. Simular Expiração do Período**

Opção A - Via Stripe CLI (recomendado):

```bash
stripe trigger customer.subscription.updated
```

Opção B - Alterar metadata manualmente:

```bash
# Definir data de expiração no passado
stripe subscriptions update sub_xxxxx \
  --metadata[previous_plan_expires_at]=1000000000
```

**7. Verificar Metadata Limpo**

```bash
stripe subscriptions retrieve sub_xxxxx
```

✅ **ESPERADO:**

```json
{
  "metadata": {
    "previous_plan_product_id": "",
    "previous_plan_expires_at": "",
    "downgrade_scheduled_to": ""
  }
}
```

**8. Verificar Plano Mudou**

```bash
curl http://localhost:8800/api/stripe/subscription \
  -H "Cookie: [sua-session-cookie]" | jq '.subscription.plan'
```

✅ **ESPERADO:** `"basic"`

**9. Verificar Sidebar Atualizada**

- Recarregar: http://localhost:8800/dashboard

✅ **ESPERADO:**

- Mostra: "Plano Ativo: basic"
- Badge "Até DD/MM" desapareceu
- Nenhum indicador de mudança futura

---

## 🧪 Teste 3: Upgrade Continua Imediato (5 min)

### Objetivo

Verificar que upgrade ainda aplica imediatamente (não usa metadata).

### Passos

**1. Estado Inicial**

```bash
curl http://localhost:8800/api/stripe/subscription \
  -H "Cookie: [sua-session-cookie]" | jq '.subscription.plan'
```

✅ Esperado: `"basic"` ou `"essentials"`

**2. Fazer Upgrade**

- Abrir: http://localhost:8800/plan
- Clicar no card do plano "Plus"
- Confirmar upgrade
- Aguardar mensagem de sucesso

**3. Verificar Plano Mudou IMEDIATAMENTE**

```bash
curl http://localhost:8800/api/stripe/subscription \
  -H "Cookie: [sua-session-cookie]" | jq
```

✅ **ESPERADO:**

```json
{
  "subscription": {
    "plan": "plus", // ← MUDOU IMEDIATAMENTE!
    "cancelAtPeriodEnd": false
  }
}
```

❌ **FALHA SE:**

- Plano não mudou
- `cancelAtPeriodEnd` é true
- Badge "Até DD/MM" aparece

**4. Verificar Metadata Vazio**

```bash
stripe subscriptions retrieve sub_xxxxx
```

✅ **ESPERADO:**

```json
{
  "metadata": {
    "previous_plan_product_id": "",
    "previous_plan_expires_at": "",
    "downgrade_scheduled_to": ""
  }
}
```

---

## 📊 Resumo de Resultados Esperados

### Filtro de Produtos

| Teste                         | Esperado | ✅/❌ |
| ----------------------------- | -------- | ----- |
| API retorna 5 produtos        | Sim      | [ ]   |
| Produtos correspondem ao .env | Sim      | [ ]   |
| Produto de teste NÃO aparece  | Sim      | [ ]   |
| UI mostra apenas 5 planos     | Sim      | [ ]   |

### Downgrade com Metadata

| Teste                             | Esperado | ✅/❌ |
| --------------------------------- | -------- | ----- |
| Metadata salvo ao fazer downgrade | Sim      | [ ]   |
| Plano atual mantido (não muda)    | Sim      | [ ]   |
| Badge "Até DD/MM" aparece         | Sim      | [ ]   |
| Metadata limpo após expiração     | Sim      | [ ]   |
| Plano muda após expiração         | Sim      | [ ]   |
| Badge desaparece após mudança     | Sim      | [ ]   |

### Upgrade Imediato

| Teste                    | Esperado | ✅/❌ |
| ------------------------ | -------- | ----- |
| Plano muda imediatamente | Sim      | [ ]   |
| Metadata vazio           | Sim      | [ ]   |
| Sem badge "Até DD/MM"    | Sim      | [ ]   |

---

## 🐛 Debugging: O Que Fazer Se Falhar

### Problema: Produtos não filtrados

**Sintomas:**

- Mais de 5 produtos aparecem
- Produtos de teste visíveis

**Debug:**

```bash
# 1. Verificar .env
cat .env | grep STRIPE_PRODUCT

# 2. Verificar logs do servidor
# Procurar por: "[Stripe] Configured product IDs"

# 3. Verificar código
# Arquivo: lib/stripe/server.ts
# Linha: ~66-68
# Confirmar filtro: .filter((product) => configuredProductIds.includes(product.id))
```

**Solução:**

- Verificar IDs no .env estão corretos
- Reiniciar servidor após alterar .env
- Limpar cache do navegador

---

### Problema: Downgrade aplica imediatamente

**Sintomas:**

- Plano muda para "basic" na hora
- Badge não aparece
- Metadata vazio

**Debug:**

```bash
# 1. Verificar request
# Body deve ter: { "immediate": false }

# 2. Verificar logs
# Procurar por: "[API] Downgrade metadata saved"

# 3. Verificar código
# Arquivo: app/api/stripe/update-subscription/route.ts
# Linha: ~167-210
# Confirmar branch: if (immediate) { ... } else { ... }
```

**Solução:**

- Verificar parâmetro `immediate: false` está sendo enviado
- Verificar lógica de upgrade/downgrade no código
- Verificar logs do servidor

---

### Problema: Metadata não limpa após expiração

**Sintomas:**

- Plano não muda após período expirar
- Metadata ainda tem valores
- Badge continua aparecendo

**Debug:**

```bash
# 1. Verificar webhook está ativo
stripe listen --forward-to localhost:8800/api/stripe/webhook

# 2. Forçar evento
stripe trigger customer.subscription.updated

# 3. Verificar logs do webhook
# Procurar por: "[Webhook] Previous plan expired"

# 4. Verificar código
# Arquivo: app/api/stripe/webhook/route.ts
# Linha: ~55-120
```

**Solução:**

- Confirmar webhook configurado
- Verificar Stripe CLI rodando (local)
- Verificar webhook no Dashboard (produção)
- Verificar logs do webhook

---

### Problema: Badge não aparece

**Sintomas:**

- Downgrade feito
- Metadata correto
- Badge não visível

**Debug:**

```bash
# 1. Verificar API retorna dados
curl http://localhost:8800/api/stripe/subscription | jq

# Confirmar:
# - cancelAtPeriodEnd: true
# - currentPeriodEnd: <timestamp>

# 2. Inspecionar elemento no navegador
# Verificar se <Badge> está renderizado

# 3. Console do navegador
# Procurar por erros JS
```

**Solução:**

- Verificar componente Badge importado
- Verificar lógica condicional no Sidebar
- Limpar cache do navegador
- Hard refresh (Ctrl+Shift+R)

---

## ✅ Checklist Final

Antes de marcar como "validado":

- [ ] Filtro de produtos: 5 produtos exibidos
- [ ] Produtos de teste não aparecem
- [ ] Downgrade salva metadata
- [ ] Plano atual mantido até expiração
- [ ] Badge "Até DD/MM" aparece
- [ ] Webhook limpa metadata
- [ ] Plano muda após expiração
- [ ] Badge desaparece após mudança
- [ ] Upgrade aplica imediatamente
- [ ] Upgrade não usa metadata
- [ ] Logs no servidor claros
- [ ] Sem erros no console
- [ ] Documentação lida

---

## 📞 Suporte

**Se algo não funcionar:**

1. Verificar logs do servidor
2. Verificar logs do Stripe CLI
3. Consultar documentação:
   - [METADATA_DOWNGRADE_SYSTEM.md](./METADATA_DOWNGRADE_SYSTEM.md)
   - [METADATA_DOWNGRADE_SUMMARY.md](./METADATA_DOWNGRADE_SUMMARY.md)

**Logs Úteis:**

```bash
# Servidor
# Procurar por:
# - "[Stripe] Configured product IDs"
# - "[API] Downgrade metadata saved"
# - "[Webhook] Previous plan expired"

# Stripe CLI
# Procurar por:
# - "customer.subscription.updated"
# - "<--  [200] POST"
```

---

**Validado por:** ********\_********
**Data:** ********\_********
**Status:** [ ] Aprovado [ ] Reprovado [ ] Necessita ajustes
