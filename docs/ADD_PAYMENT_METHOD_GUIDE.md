# Guia de Uso: Adicionar Formas de Pagamento

## 📋 Visão Geral

Implementamos integração completa com **Stripe Elements** para que usuários possam adicionar cartões de crédito/débito diretamente na plataforma, sem precisar do portal do cliente.

---

## 🎯 Funcionalidades Implementadas

### 1. Adicionar Cartão de Crédito/Débito

- ✅ Dialog modal com Stripe Elements embutido
- ✅ Validação em tempo real dos campos do cartão
- ✅ Suporte a múltiplos cartões
- ✅ Tokenização segura (PCI compliant)
- ✅ Feedback visual de erros
- ✅ Loading states durante processamento

### 2. Modal de Confirmação de Plano Aprimorado

- ✅ Features completas do plano exibidas
- ✅ Fallback para configuração local se metadata não disponível
- ✅ Layout melhorado com separadores
- ✅ Tipografia aprimorada

---

## 🧪 Como Testar

### Pré-requisitos

1. Ter uma conta na aplicação
2. Estar logado
3. Navegar para `/billing`

### Cenário 1: Adicionar Primeiro Cartão

**Passos:**

1. Acesse a página de Faturamento (`/billing`)
2. Localize o card "Formas de Pagamento"
3. Clique no botão "Adicionar Cartão"
4. Aguarde o modal carregar (spinner aparece)
5. Preencha os dados do cartão de teste:
   - **Número:** `4242 4242 4242 4242` (Visa)
   - **Data:** Qualquer data futura (ex: `12/25`)
   - **CVC:** Qualquer 3 dígitos (ex: `123`)
   - **CEP:** Qualquer CEP válido (ex: `12345`)
6. Clique em "Adicionar Cartão"
7. Aguarde confirmação
8. Modal fecha automaticamente
9. Cartão aparece na lista

**Resultado Esperado:**

- ✅ Modal abre rapidamente
- ✅ Formulário do Stripe carrega com estilo da plataforma
- ✅ Validação em tempo real funciona
- ✅ Botão desabilitado se campos inválidos
- ✅ Loading aparece durante processamento
- ✅ Modal fecha após sucesso
- ✅ Lista atualiza automaticamente
- ✅ Novo cartão aparece com badge "Padrão"

### Cenário 2: Adicionar Segundo Cartão

**Passos:**

1. Com um cartão já cadastrado
2. Clique em "Adicionar Novo Cartão"
3. Use outro cartão de teste:
   - **Número:** `5555 5555 5555 4444` (Mastercard)
   - **Data:** `01/26`
   - **CVC:** `456`
4. Adicione o cartão

**Resultado Esperado:**

- ✅ Segundo cartão aparece na lista
- ✅ Primeiro cartão mantém badge "Padrão"
- ✅ Segundo cartão tem opção de remover (ícone de lixeira)

### Cenário 3: Teste de Erro - Cartão Recusado

**Passos:**

1. Tente adicionar cartão com número:
   - **Número:** `4000 0000 0000 0002` (sempre recusado)
   - **Data:** `12/25`
   - **CVC:** `123`
2. Clique em "Adicionar Cartão"

**Resultado Esperado:**

- ✅ Alert vermelho aparece com mensagem de erro
- ✅ Modal permanece aberto
- ✅ Usuário pode corrigir e tentar novamente
- ✅ Botão "Cancelar" funciona

### Cenário 4: Visualizar Features no Modal de Plano

**Passos:**

1. Na página de Pricing ou Billing
2. Clique em "Selecionar Plano" em qualquer plano pago
3. Observe o modal de confirmação

**Resultado Esperado:**

- ✅ Nome do plano exibido
- ✅ Badge com nível de IA (ex: "IA Avançada")
- ✅ Preço formatado corretamente
- ✅ Separador visual entre cabeçalho e features
- ✅ Lista de features com ícones de check
- ✅ Features legíveis e bem espaçadas
- ✅ Título "Recursos incluídos:" em cinza

---

## 🔧 Cartões de Teste do Stripe

### Cartões de Sucesso

| Número                | Bandeira         | Uso            |
| --------------------- | ---------------- | -------------- |
| `4242 4242 4242 4242` | Visa             | Sucesso padrão |
| `5555 5555 5555 4444` | Mastercard       | Sucesso        |
| `3782 822463 10005`   | American Express | Sucesso        |
| `6011 1111 1111 1117` | Discover         | Sucesso        |

### Cartões de Erro (para testes)

| Número                | Resultado            |
| --------------------- | -------------------- |
| `4000 0000 0000 0002` | Cartão recusado      |
| `4000 0000 0000 9995` | Fundos insuficientes |
| `4000 0000 0000 0069` | Cartão expirado      |
| `4000 0000 0000 0127` | CVC incorreto        |

### Outras Informações de Teste

- **Data de Expiração:** Qualquer data futura
- **CVC:** Qualquer 3 dígitos (4 para Amex)
- **CEP:** Qualquer CEP válido

---

## 🏗️ Arquitetura da Solução

### Frontend

```
AddPaymentMethodDialog
├── useState: clientSecret, isLoading, error
├── useEffect: createSetupIntent() ao abrir
└── Elements (Stripe)
    └── PaymentForm
        ├── useStripe()
        ├── useElements()
        └── confirmSetup()
```

### Backend

```
POST /api/stripe/setup-intent
├── Autentica usuário
├── Busca/cria Stripe Customer
├── Cria Setup Intent
└── Retorna clientSecret
```

### Fluxo de Dados

1. **Modal abre** → Chama `createSetupIntent()`
2. **API cria Setup Intent** → Retorna `clientSecret`
3. **Elements renderiza** → Usuário preenche dados
4. **Submit** → `stripe.confirmSetup()`
5. **Stripe valida** → Tokeniza cartão
6. **Sucesso** → `onSuccess()` callback
7. **Lista atualiza** → `fetchPaymentMethods()`

---

## 🔒 Segurança

### PCI Compliance

- ✅ Dados do cartão **nunca** passam pelo nosso servidor
- ✅ Tokenização ocorre diretamente com Stripe
- ✅ Elementos do formulário são iframes seguros
- ✅ Setup Intent com `client_secret` único e efêmero

### Best Practices

- ✅ `usage: 'off_session'` para cobranças futuras
- ✅ Customer ID armazenado no profile
- ✅ Payment Method ID nunca exposto ao cliente
- ✅ HTTPS obrigatório em produção

---

## 🐛 Troubleshooting

### Modal não abre ou fica em branco

**Causa:** Erro ao criar Setup Intent
**Solução:** Verificar logs do console e API

### Stripe Elements não carrega

**Causa:** NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não configurada
**Solução:** Verificar variável de ambiente

### Erro "Customer not found"

**Causa:** Profile sem stripe_customer_id
**Solução:** API cria automaticamente na primeira vez

### Cartão não aparece na lista após adicionar

**Causa:** Erro no callback onSuccess
**Solução:** Verificar se fetchPaymentMethods() está sendo chamado

---

## 📊 Logs para Debug

### Console do Browser

```javascript
// Success
Elements loaded successfully
Setup Intent confirmed: si_xxx
Payment method added successfully

// Error
Error creating setup intent: [details]
Error confirming setup: [Stripe error]
```

### Logs do Servidor

```
[API] Creating setup intent for customer: cus_xxx
[API] Setup intent created: si_xxx
[API] Error creating setup intent: [error details]
```

---

## 🚀 Próximos Passos (Melhorias Futuras)

### Funcionalidades Planejadas

- [ ] Definir cartão padrão (já tem API, falta UI)
- [ ] Editar apelido do cartão
- [ ] Ver histórico de transações por cartão
- [ ] Notificações de cartão expirando

### Melhorias de UX

- [ ] Mostrar ícone da bandeira do cartão
- [ ] Animação ao adicionar cartão
- [ ] Confirmação visual com toast
- [ ] Preview do cartão antes de salvar

---

## 📚 Referências

- [Stripe Elements Documentation](https://stripe.com/docs/payments/elements)
- [Setup Intents Guide](https://stripe.com/docs/payments/setup-intents)
- [Testing Cards](https://stripe.com/docs/testing)
- [React Stripe.js Docs](https://stripe.com/docs/stripe-js/react)
