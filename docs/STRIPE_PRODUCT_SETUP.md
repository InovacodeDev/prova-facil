# Configuração de Produtos no Stripe

Este documento descreve como configurar produtos e preços no Stripe Dashboard para que funcionem corretamente com os Pricing Cards dinâmicos.

## 📋 Visão Geral

A aplicação agora busca produtos e preços diretamente do Stripe via API (`/api/stripe/products`), eliminando a necessidade de manter informações de planos em dois lugares. Todas as mudanças feitas no Stripe Dashboard serão refletidas automaticamente na interface (com cache de 5 minutos).

## 🎯 Estrutura Necessária

### 1. Produtos (Products)

Cada plano deve ser criado como um **Product** no Stripe com os seguintes metadados obrigatórios:

#### Metadata Obrigatória

| Campo      | Tipo       | Valores Aceitos                                      | Descrição                         |
| ---------- | ---------- | ---------------------------------------------------- | --------------------------------- |
| `plan`     | string     | `starter`, `basic`, `essentials`, `plus`, `advanced` | Identificador interno do plano    |
| `features` | JSON array | `["Feature 1", "Feature 2", ...]`                    | Lista de features em formato JSON |

#### Metadata Opcional

| Campo     | Tipo   | Valores  | Descrição                             |
| --------- | ------ | -------- | ------------------------------------- |
| `popular` | string | `"true"` | Adiciona badge "Mais Popular" no card |

#### Exemplo de Configuração

**Produto: Plano Basic**

```
Name: Basic
Description: Ideal para professores individuais que querem otimizar a criação de provas
Active: ✓

Metadata:
  plan: basic
  features: ["10 provas por mês", "Banco com 500 questões", "Gabarito automático", "Suporte por email"]
  popular: true
```

**Produto: Plano Plus**

```
Name: Plus
Description: Para escolas e equipes que precisam de mais recursos e colaboração
Active: ✓

Metadata:
  plan: plus
  features: ["50 provas por mês", "Banco com 2.000 questões", "Colaboração em equipe", "Relatórios avançados", "Suporte prioritário"]
```

**Produto: Plano Advanced**

```
Name: Advanced
Description: Solução completa para instituições com necessidades avançadas
Active: ✓

Metadata:
  plan: advanced
  features: ["Provas ilimitadas", "Banco com 10.000+ questões", "API de integração", "Marca personalizada", "Suporte 24/7"]
```

### 2. Preços (Prices)

Cada produto deve ter **pelo menos dois preços** para suportar o toggle mensal/anual:

#### Configuração de Price

| Campo              | Valor Mensal | Valor Anual |
| ------------------ | ------------ | ----------- |
| **Billing Period** | `Monthly`    | `Yearly`    |
| **Recurring**      | ✓            | ✓           |
| **Active**         | ✓            | ✓           |
| **Currency**       | `BRL`        | `BRL`       |

#### Exemplo de Preços

**Produto Basic:**

- Price 1 (Mensal): R$ 49,00 / mês
- Price 2 (Anual): R$ 470,00 / ano (equivalente a R$ 39,17/mês - 20% desconto)

**Produto Plus:**

- Price 1 (Mensal): R$ 99,00 / mês
- Price 2 (Anual): R$ 950,00 / ano (equivalente a R$ 79,17/mês - 20% desconto)

**Produto Advanced:**

- Price 1 (Mensal): R$ 199,00 / mês
- Price 2 (Anual): R$ 1.900,00 / ano (equivalente a R$ 158,33/mês - 20% desconto)

## 🔧 Passo a Passo de Configuração

### 1. Criar Produto no Stripe Dashboard

1. Acesse [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Clique em **"+ Add product"**
3. Preencha:
   - **Name**: Nome do plano (ex: "Basic")
   - **Description**: Descrição clara do plano
   - **Statement descriptor**: (opcional) Como aparece na fatura
4. Role até **Metadata** e adicione:
   ```
   plan: basic
   features: ["10 provas por mês", "Banco com 500 questões", "Gabarito automático", "Suporte por email"]
   ```
5. Para o plano mais popular, adicione também:
   ```
   popular: true
   ```

### 2. Adicionar Preços

1. Na mesma tela de criação do produto, em **Pricing**:
2. **Price 1 (Mensal)**:

   - **Type**: `Recurring`
   - **Billing period**: `Monthly`
   - **Price**: `49.00 BRL`
   - Clique em **Add price**

3. Clique em **"+ Add another price"**
4. **Price 2 (Anual)**:

   - **Type**: `Recurring`
   - **Billing period**: `Yearly`
   - **Price**: `470.00 BRL`
   - Clique em **Add price**

5. Clique em **Save product**

### 3. Repetir para Todos os Planos

Repita o processo acima para cada plano:

- ✓ Starter (Gratuito) - opcional, pode não ter prices
- ✓ Basic
- ✓ Essentials
- ✓ Plus
- ✓ Advanced

## ✅ Validação

### Testar via API

```bash
curl http://localhost:3000/api/stripe/products
```

Resposta esperada:

```json
{
  "products": [
    {
      "id": "prod_xxxxx",
      "name": "Basic",
      "description": "Ideal para professores individuais...",
      "metadata": {
        "plan": "basic",
        "features": "[\"10 provas por mês\", ...]",
        "popular": "true"
      },
      "features": ["10 provas por mês", "Banco com 500 questões", "Gabarito automático", "Suporte por email"],
      "prices": {
        "monthly": {
          "id": "price_xxxxx",
          "amount": 4900,
          "currency": "brl",
          "interval": "month"
        },
        "yearly": {
          "id": "price_xxxxx",
          "amount": 47000,
          "currency": "brl",
          "interval": "year"
        }
      }
    }
  ]
}
```

### Verificar na Interface

1. Acesse `/billing` ou `/plan`
2. Verifique se os cards aparecem com:
   - ✓ Nomes corretos dos produtos
   - ✓ Descrições corretas
   - ✓ Preços mensais e anuais
   - ✓ Lista de features
   - ✓ Badge "Mais Popular" no plano correto
   - ✓ Badge "Plano Atual" no seu plano ativo
3. Teste o toggle Mensal/Anual
4. Clique em "Selecionar Plano" e verifique o fluxo

## 🎨 Ordem de Exibição

Os produtos são ordenados automaticamente pela API usando o campo `metadata.plan`:

1. **starter** → Gratuito
2. **basic** → Entrada
3. **essentials** → Intermediário
4. **plus** → Popular
5. **advanced** → Premium

Se você quiser alterar a ordem, ajuste os valores de `metadata.plan` para que sigam essa hierarquia.

## 🔄 Atualizando Produtos

### Alterar Preço

1. No Stripe Dashboard, vá para o produto
2. **NÃO edite o price existente** (isso afeta assinaturas ativas)
3. Crie um **novo price** com o valor atualizado
4. Desative o price antigo (marque como `Archived`)
5. As novas assinaturas usarão automaticamente o price ativo

### Alterar Features

1. Vá para o produto no Dashboard
2. Edite a metadata `features`
3. Atualize o array JSON
4. Salve
5. Aguarde até 5 minutos para o cache expirar (ou force refresh)

### Adicionar/Remover Planos

- **Adicionar**: Crie um novo produto seguindo o passo a passo acima
- **Remover**: Marque o produto como `Archived` no Stripe Dashboard

## 🚨 Erros Comuns

### "Products array is empty"

- Verifique se há pelo menos um produto **Active** no Stripe
- Verifique se os produtos têm metadata `plan` definida

### "Features não aparecem"

- Certifique-se de que `metadata.features` é um JSON válido
- Use aspas duplas: `["Feature 1", "Feature 2"]`
- Não use aspas simples ou caracteres especiais sem escape

### "Preço não aparece no toggle"

- Verifique se o produto tem um price com `interval: month`
- Verifique se o produto tem um price com `interval: year`
- Certifique-se de que ambos estão `Active`

### "Badge 'Mais Popular' não aparece"

- Adicione `popular: true` (lowercase) na metadata
- Apenas um produto deve ter essa flag

## 📝 Checklist de Configuração

Antes de colocar em produção:

- [ ] Todos os produtos têm `metadata.plan` correto
- [ ] Todos os produtos têm `metadata.features` em formato JSON válido
- [ ] Um produto tem `metadata.popular: true`
- [ ] Cada produto tem price mensal (interval: month)
- [ ] Cada produto tem price anual (interval: year)
- [ ] Todos os prices estão marcados como `Active`
- [ ] Descrições dos produtos são claras e completas
- [ ] Testado localmente via `/api/stripe/products`
- [ ] Testado visualmente em `/billing` e `/plan`
- [ ] Testado o fluxo de upgrade/downgrade
- [ ] Testado o toggle mensal/anual

## 🔐 Segurança

- A API `/api/stripe/products` é pública (não requer autenticação)
- Informações sensíveis (preços) são públicas por design
- Cache de 5 minutos reduz chamadas ao Stripe
- Nunca exponha `STRIPE_SECRET_KEY` no frontend

## 📚 Referências

- [Stripe Products API](https://stripe.com/docs/api/products)
- [Stripe Prices API](https://stripe.com/docs/api/prices)
- [Stripe Metadata](https://stripe.com/docs/api/metadata)
- [Código fonte: `/app/api/stripe/products/route.ts`](/app/api/stripe/products/route.ts)
- [Componente: `/components/PricingCards.tsx`](/components/PricingCards.tsx)
