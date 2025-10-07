# 📝 Quebra de Questões Dissertativas por Item

## 🎯 Objetivo

Melhorar a visualização de questões dissertativas (open) que possuem múltiplos itens (A, B, C...) através de:

1. **Exibição estruturada** da questão com contexto + itens separados
2. **Gabarito organizado** por item com respostas esperadas individuais

---

## 🔄 Mudanças Implementadas

### 1. **Renderização da Questão (`renderOpen`)**

#### Antes:

```
┌─────────────────────────────────────┐
│ Resposta dissertativa (avalie      │
│ conforme critérios estabelecidos)  │
└─────────────────────────────────────┘
```

#### Agora:

```
┌─────────────────────────────────────────────────────────┐
│ [CONTEXTO - Borda Azul à Esquerda]                      │
│ "O juro composto é a oitava maravilha do mundo..."     │
│                                                          │
│ Imagine que você tem R$ 1.000,00 para investir...      │
├─────────────────────────────────────────────────────────┤
│ Itens a serem respondidos:                              │
│                                                          │
│ ┌─────────────────────────────────────────────────┐   │
│ │ A) Calcule o montante acumulado após 5 anos... │   │
│ └─────────────────────────────────────────────────┘   │
│                                                          │
│ ┌─────────────────────────────────────────────────┐   │
│ │ B) Calcule o valor total dos juros recebidos...│   │
│ └─────────────────────────────────────────────────┘   │
│                                                          │
│ ┌─────────────────────────────────────────────────┐   │
│ │ C) Suponha que você precise desse dinheiro...  │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Estrutura:**

- **Contexto/Texto motivador**: Borda azul à esquerda (como textos motivadores de redação)
- **Itens A, B, C**: Caixas cinzas separadas com letra destacada em azul

---

### 2. **Renderização do Gabarito (`renderGabaritoOpen`)**

#### Antes:

```
┌─────────────────────────────────────┐
│ Resposta esperada:                 │
│                                     │
│ [TODO O TEXTO CORRIDO COM          │
│  FORMATAÇÃO MARKDOWN MISTURADA]    │
│                                     │
│ **Item A - Cálculo (4 pontos):**   │
│ * M₁ = 1000 * (1.10)^5...         │
│ **Item B - Juros (3 pontos):**     │
│ * Juros = M₁ - C...               │
│ ...                                 │
└─────────────────────────────────────┘
```

#### Agora:

```
┌─────────────────────────────────────────────────────────┐
│ [CABEÇALHO - Azul]                                      │
│ **GABARITO E CRITÉRIOS DE AVALIAÇÃO:**                 │
├─────────────────────────────────────────────────────────┤
│ Respostas esperadas por item:                           │
│                                                          │
│ ┌──────────────────────────────────────────────────┐  │
│ │ [VERDE]                                           │  │
│ │ A) Cálculo do Montante (4 pontos)                │  │
│ │                                                    │  │
│ │ A fórmula para juros compostos é M = C*(1+i)^t   │  │
│ │                                                    │  │
│ │ **Opção 1 (CDB - 10% a.a.):**                    │  │
│ │   M₁ = 1000 * (1.10)^5                           │  │
│ │   M₁ ≈ R$ 1.610,51                               │  │
│ │                                                    │  │
│ │ **Opção 2 (Poupança - 8% a.a.):**               │  │
│ │   M₂ = 1000 * (1.08)^5                           │  │
│ │   M₂ ≈ R$ 1.469,33                               │  │
│ └──────────────────────────────────────────────────┘  │
│                                                          │
│ ┌──────────────────────────────────────────────────┐  │
│ │ [VERDE]                                           │  │
│ │ B) Cálculo dos Juros e Comparação (3 pontos)     │  │
│ │                                                    │  │
│ │ **Juros Calculados (1,5 pontos):**               │  │
│ │   Juros Opção 1 = R$ 610,51                      │  │
│ │   Juros Opção 2 = R$ 469,33                      │  │
│ │                                                    │  │
│ │ **Comparação (1,5 pontos):**                     │  │
│ │   A Opção 1 gerou mais juros devido à taxa...    │  │
│ └──────────────────────────────────────────────────┘  │
│                                                          │
│ ┌──────────────────────────────────────────────────┐  │
│ │ [VERDE]                                           │  │
│ │ C) Escolha a Longo Prazo e Discussão (3 pontos)  │  │
│ │                                                    │  │
│ │ Para 20 anos, a Opção 1 seria mais vantajosa...  │  │
│ │ **Discussão:** O aluno deve abordar...           │  │
│ └──────────────────────────────────────────────────┘  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ [RODAPÉ - Amarelo]                                      │
│ Critérios de Correção:                                  │
│ - Item A: 4 pontos                                      │
│ - Item B: 3 pontos                                      │
│ - Item C: 3 pontos                                      │
│ - Total: 10 pontos                                      │
├─────────────────────────────────────────────────────────┤
│ 💡 Esta é uma resposta modelo. Outras respostas podem  │
│    ser aceitas desde que abordem os pontos principais.  │
└─────────────────────────────────────────────────────────┘
```

**Estrutura do Gabarito:**

1. **Cabeçalho** (se presente): Caixa azul com título principal
2. **Itens separados**: Cada item em caixa verde individual
   - Letra grande e destacada (A, B, C...)
   - Título do item (ex: "Cálculo do Montante (4 pontos)")
   - Conteúdo formatado com markdown preservado
3. **Critérios de Correção** (se presente): Caixa amarela no rodapé
4. **Nota explicativa**: Sempre presente

---

## 🔍 Lógica de Parsing

### **Parsing da Questão** (`parseQuestionItems`)

```typescript
// Regex para capturar itens: A) texto B) texto C) texto
const itemRegex = /([A-Z])\)\s*(.+?)(?=\n[A-Z]\)|$)/gs;

// Resultado:
[
  { letter: 'A', text: 'Calcule o montante...' },
  { letter: 'B', text: 'Calcule o valor total...' },
  { letter: 'C', text: 'Suponha que você...' },
];
```

**Estratégia:**

1. Divide a questão em:

   - **Contexto**: Tudo antes do primeiro "A)"
   - **Itens**: Cada item capturado pelo regex

2. Se não encontrar itens (questão sem A, B, C):
   - Mantém comportamento original (texto simples)

---

### **Parsing do Gabarito** (`parseAnswerItems`)

```typescript
// Regex para capturar: **Item A - Título (pontos):**\nConteúdo...
const itemRegex = /\*\*Item ([A-Z])([^*]*)\*\*\n([\s\S]*?)(?=\n\*\*Item [A-Z]|$)/g;

// Resultado:
[
  {
    letter: 'A',
    title: '- Cálculo do Montante (4 pontos):',
    content: 'A fórmula para juros compostos...',
  },
  {
    letter: 'B',
    title: '- Cálculo dos Juros (3 pontos):',
    content: 'Juros Opção 1 = ...',
  },
  {
    letter: 'C',
    title: '- Escolha a Longo Prazo (3 pontos):',
    content: 'Para 20 anos...',
  },
];
```

**Estratégia:**

1. Tenta capturar formato estruturado (`**Item A ...**`)
2. Se não encontrar, tenta formato alternativo (`A) texto`)
3. Divide o gabarito em:

   - **Cabeçalho**: Tudo antes do primeiro "\*\*Item"
   - **Itens**: Cada resposta esperada
   - **Critérios**: Seção `**CRITÉRIOS DE CORREÇÃO:**` no final

4. Se não encontrar itens estruturados:
   - Mostra gabarito inteiro em uma caixa verde (fallback)

---

## 🎨 Elementos Visuais

### **Questão:**

```tsx
// Contexto (texto motivador)
<div className="border-l-4 border-primary pl-4 py-2">
  <p className="text-sm leading-relaxed whitespace-pre-wrap">{context}</p>
</div>

// Cada item
<div className="p-3 bg-muted rounded-lg">
  <span className="font-semibold text-primary mr-2">{item.letter})</span>
  <span className="text-sm">{item.text}</span>
</div>
```

### **Gabarito:**

```tsx
// Cada item da resposta
<div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
  <div className="flex items-start gap-2">
    <span className="font-bold text-lg text-green-700 dark:text-green-400 min-w-[2rem]">
      {item.letter})
    </span>
    <div className="flex-1">
      {item.title && <p className="font-semibold text-green-800 dark:text-green-300 mb-2">{item.title}</p>}
      <div className="text-sm whitespace-pre-wrap leading-relaxed text-green-900 dark:text-green-100">
        {item.content}
      </div>
    </div>
  </div>
</div>

// Critérios de correção (rodapé)
<div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
  <p className="text-sm font-semibold mb-2">Critérios de Correção:</p>
  <div className="text-sm whitespace-pre-wrap leading-relaxed">{criteria}</div>
</div>
```

---

## 📊 Exemplo Completo

### **Entrada (question.question):**

```
Análise de Juros Compostos em Investimentos

"O juro composto é a oitava maravilha do mundo..." - Albert Einstein

Imagine que você tem R$ 1.000,00 para investir e pode escolher entre:
Opção 1: CDB que rende 10% ao ano
Opção 2: Poupança que rende 8% ao ano

A) Calcule o montante acumulado após 5 anos para cada opção.

B) Calcule o valor total dos juros recebidos. Qual gerou mais e por quê?

C) Suponha que você precise após 20 anos. Qual escolheria e por quê?
```

### **Entrada (expected_answer_guideline):**

```json
{
  "expected_answer": "**GABARITO E CRITÉRIOS DE AVALIAÇÃO:**\n\n**Item A - Cálculo do Montante (4 pontos):**\n*   A fórmula é M = C * (1 + i)^t\n*   **Opção 1:** M₁ = 1000 * (1.10)^5 ≈ R$ 1.610,51\n*   **Opção 2:** M₂ = 1000 * (1.08)^5 ≈ R$ 1.469,33\n\n**Item B - Cálculo dos Juros (3 pontos):**\n*   Juros Opção 1 = R$ 610,51\n*   Juros Opção 2 = R$ 469,33\n*   A Opção 1 gerou mais devido à taxa maior.\n\n**Item C - Escolha a Longo Prazo (3 pontos):**\n*   Para 20 anos, escolha a Opção 1.\n*   M₁ (20 anos) ≈ R$ 6.727,50\n*   M₂ (20 anos) ≈ R$ 4.660,96\n*   Discussão: tempo e taxa são fatores multiplicadores.\n\n**CRITÉRIOS DE CORREÇÃO:**\n- Item A: 4 pontos\n- Item B: 3 pontos\n- Item C: 3 pontos\n- Total: 10 pontos"
}
```

### **Saída Visual:**

**Card da Questão:**

```
┌─────────────────────────────────────────────────┐
│ Múltipla Escolha                [Copiar] [3]   │
├─────────────────────────────────────────────────┤
│ Análise de Juros Compostos em Investimentos    │
├─────────────────────────────────────────────────┤
│ ┃ "O juro composto é a oitava maravilha..."   │
│ ┃                                               │
│ ┃ Imagine que você tem R$ 1.000,00...          │
│ ┃ Opção 1: CDB que rende 10% ao ano            │
│ ┃ Opção 2: Poupança que rende 8% ao ano        │
├─────────────────────────────────────────────────┤
│ Itens a serem respondidos:                      │
│                                                  │
│ ┌───────────────────────────────────────────┐ │
│ │ A) Calcule o montante acumulado após 5...│ │
│ └───────────────────────────────────────────┘ │
│                                                  │
│ ┌───────────────────────────────────────────┐ │
│ │ B) Calcule o valor total dos juros...    │ │
│ └───────────────────────────────────────────┘ │
│                                                  │
│ ┌───────────────────────────────────────────┐ │
│ │ C) Suponha que você precise após 20...   │ │
│ └───────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│              [Ver Gabarito]                      │
└─────────────────────────────────────────────────┘
```

**Modal do Gabarito:**

```
┌─────────────────────────────────────────────────┐
│ Gabarito - Dissertativa                    [X]  │
├─────────────────────────────────────────────────┤
│ [AZUL]                                          │
│ **GABARITO E CRITÉRIOS DE AVALIAÇÃO:**         │
├─────────────────────────────────────────────────┤
│ Respostas esperadas por item:                   │
│                                                  │
│ ┌──────────────────────────────────────────┐  │
│ │ [VERDE]                                   │  │
│ │ A) Cálculo do Montante (4 pontos)        │  │
│ │                                            │  │
│ │ A fórmula é M = C * (1 + i)^t             │  │
│ │ **Opção 1:** M₁ ≈ R$ 1.610,51            │  │
│ │ **Opção 2:** M₂ ≈ R$ 1.469,33            │  │
│ └──────────────────────────────────────────┘  │
│                                                  │
│ ┌──────────────────────────────────────────┐  │
│ │ [VERDE]                                   │  │
│ │ B) Cálculo dos Juros (3 pontos)          │  │
│ │                                            │  │
│ │ Juros Opção 1 = R$ 610,51                │  │
│ │ A Opção 1 gerou mais devido à taxa...    │  │
│ └──────────────────────────────────────────┘  │
│                                                  │
│ ┌──────────────────────────────────────────┐  │
│ │ [VERDE]                                   │  │
│ │ C) Escolha a Longo Prazo (3 pontos)      │  │
│ │                                            │  │
│ │ Para 20 anos, escolha a Opção 1.         │  │
│ │ Discussão: tempo e taxa são fatores...   │  │
│ └──────────────────────────────────────────┘  │
│                                                  │
│ [AMARELO]                                        │
│ Critérios de Correção:                          │
│ - Item A: 4 pontos                              │
│ - Item B: 3 pontos                              │
│ - Item C: 3 pontos                              │
│ - Total: 10 pontos                              │
│                                                  │
│ 💡 Esta é uma resposta modelo. Outras respostas│
│    podem ser aceitas...                         │
└─────────────────────────────────────────────────┘
```

---

## 🧪 Como Testar

### 1. Questão COM Itens (A, B, C)

```bash
1. Criar/abrir questão dissertativa com formato:
   - Contexto inicial
   - A) Primeira pergunta
   - B) Segunda pergunta
   - C) Terceira pergunta

2. Verificar Card:
   ✅ Contexto aparece com borda azul
   ✅ Itens aparecem separados em caixas cinzas
   ✅ Letras A, B, C destacadas em azul

3. Clicar em "Ver Gabarito":
   ✅ Gabarito quebrado por item
   ✅ Cada resposta em caixa verde separada
   ✅ Títulos dos itens visíveis
   ✅ Critérios de correção no rodapé amarelo
```

### 2. Questão SEM Itens (Texto Livre)

```bash
1. Criar/abrir questão dissertativa simples (sem A, B, C)

2. Verificar Card:
   ✅ Mantém comportamento original
   ✅ Mostra "Resposta dissertativa (avalie...)"

3. Clicar em "Ver Gabarito":
   ✅ Mostra resposta inteira em caixa verde
   ✅ Sem quebra de itens
```

---

## ✅ Checklist de Implementação

- [x] Função `parseQuestionItems()` criada (regex para capturar A), B), C))
- [x] Função `parseAnswerItems()` criada (regex para capturar **Item A**, **Item B**)
- [x] `renderOpen()` atualizado com quebra de itens
- [x] `renderGabaritoOpen()` atualizado com quebra de respostas
- [x] Extração de cabeçalho e rodapé do gabarito
- [x] Fallback para questões sem itens (mantém comportamento original)
- [x] Fallback para gabaritos sem estrutura de itens
- [x] 0 erros de TypeScript
- [x] UI consistente com padrão de cores (verde, azul, amarelo)
- [x] Documentação completa criada

---

## 🎓 Benefícios

### **Para Professores:**

1. **Questão mais clara**: Contexto separado dos itens facilita leitura
2. **Gabarito organizado**: Cada resposta esperada em sua própria seção
3. **Correção mais rápida**: Pode comparar item por item com a resposta do aluno
4. **Visualização de pontuação**: Vê claramente quantos pontos vale cada item

### **Para Alunos:**

1. **Estrutura óbvia**: Fica claro que precisa responder A, B e C separadamente
2. **Contexto preservado**: Texto motivador destacado visualmente

---

## 🔧 Arquivos Modificados

### `/components/QuestionCard.tsx`

- ✅ `renderOpen()`: Completamente refatorado com parsing de itens
- ✅ `renderGabaritoOpen()`: Completamente refatorado com parsing de respostas
- ✅ Adicionadas funções auxiliares:
  - `parseQuestionItems()`: Quebra questão em itens
  - `parseAnswerItems()`: Quebra gabarito em respostas por item

---

## 🚀 Próximos Passos

1. ✅ Testar com questões reais do banco de dados
2. 🔄 Coletar feedback dos professores sobre a nova visualização
3. 🔄 Considerar adicionar botão "Copiar Item X" para cada resposta individual
4. 🔄 Explorar suporte para subitens (A1, A2, B1, B2, etc.)

---

**Data da implementação**: 2025-10-07  
**Versão**: 1.0.0  
**Status**: ✅ Completo e pronto para testes
