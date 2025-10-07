# 🎯 SISTEMA DE DISTRIBUIÇÃO INTELIGENTE E RECOMENDAÇÕES DE CONTEXTO

**Data:** 06 de outubro de 2025  
**Funcionalidades:** Distribuição garantida de questões + Sistema de recomendações contextuais

---

## 📊 1. DISTRIBUIÇÃO GARANTIDA DE QUESTÕES

### Problema Anterior

A distribuição antiga não garantia pelo menos 1 questão de cada tipo selecionado:

```typescript
// ❌ PROBLEMA
const questionsPerType = Math.floor(totalRequestedQuestions / questionTypes.length);
const remainder = totalRequestedQuestions % questionTypes.length;

// Exemplo: 5 questões com 10 tipos
// questionsPerType = floor(5/10) = 0
// remainder = 5
// Resultado: apenas os primeiros 5 tipos teriam 1 questão, os outros 5 teriam 0!
```

### Solução Implementada

Nova lógica que **garante pelo menos 1 questão de cada tipo selecionado**:

```typescript
// ✅ SOLUÇÃO
const typeCount = questionTypes.length;
const distribution: Record<string, number> = {};

if (totalRequestedQuestions < typeCount) {
  // Se tiver menos questões que tipos, ajustar automaticamente
  console.warn(`⚠️ Ajustando de ${totalRequestedQuestions} para ${typeCount} questões`);
  questionTypes.forEach((type) => {
    distribution[type] = 1; // 1 questão de cada
  });
} else {
  // Se tiver mais questões que tipos:
  // 1. Garante 1 de cada primeiro
  // 2. Distribui o resto proporcionalmente
  const questionsAfterMinimum = totalRequestedQuestions - typeCount;
  const extraPerType = Math.floor(questionsAfterMinimum / typeCount);
  const remainder = questionsAfterMinimum % typeCount;

  questionTypes.forEach((type, index) => {
    distribution[type] = 1 + extraPerType + (index < remainder ? 1 : 0);
  });
}
```

### Exemplos de Distribuição

#### Exemplo 1: 10 questões, 10 tipos selecionados

```
Resultado: 1 questão de cada tipo
✅ Multiple Choice: 1
✅ True/False: 1
✅ Open: 1
✅ Sum: 1
✅ Fill in the Blank: 1
✅ Matching Columns: 1
✅ Problem Solving: 1
✅ Essay: 1
✅ Project Based: 1
✅ Gamified: 1
```

#### Exemplo 2: 40 questões, 10 tipos selecionados

```
Cálculo:
- 1 questão mínima de cada = 10 questões
- Questões restantes = 40 - 10 = 30
- Extra por tipo = floor(30/10) = 3
- Remainder = 30 % 10 = 0

Resultado: 4 questões de cada tipo (1 mínima + 3 extras)
✅ Cada tipo: 4 questões
```

#### Exemplo 3: 15 questões, 4 tipos selecionados

```
Cálculo:
- 1 questão mínima de cada = 4 questões
- Questões restantes = 15 - 4 = 11
- Extra por tipo = floor(11/4) = 2
- Remainder = 11 % 4 = 3

Resultado:
✅ Multiple Choice: 1 + 2 + 1 (remainder) = 4
✅ True/False: 1 + 2 + 1 (remainder) = 4
✅ Open: 1 + 2 + 1 (remainder) = 4
✅ Sum: 1 + 2 = 3
Total: 15 questões
```

#### Exemplo 4: 5 questões, 10 tipos selecionados (ajuste automático)

```
⚠️ Sistema detecta que 5 < 10
Ajuste: Gera 10 questões automaticamente

Resultado: 1 questão de cada tipo
(usuário é notificado do ajuste)
```

---

## 💡 2. SISTEMA DE RECOMENDAÇÕES DE CONTEXTO

### 2.1. Mapeamento de Tipos → Contextos Recomendados

Cada tipo de questão tem contextos ideais:

```typescript
export const QUESTION_TYPE_CONTEXT_RECOMMENDATIONS: Record<string, string[]> = {
  multiple_choice: ['fixacao', 'contextualizada', 'teorica', 'letra_lei'],
  true_false: ['fixacao', 'contextualizada', 'teorica', 'letra_lei'],
  open: ['teorica', 'discursiva_aberta', 'estudo_caso'],
  sum: ['fixacao', 'contextualizada', 'letra_lei'],
  fill_in_the_blank: ['fixacao', 'teorica'],
  matching_columns: ['fixacao', 'teorica', 'contextualizada'],
  problem_solving: ['contextualizada', 'estudo_caso', 'discursiva_aberta'],
  essay: ['discursiva_aberta', 'estudo_caso', 'pesquisa'],
  project_based: ['estudo_caso', 'discursiva_aberta', 'pesquisa'],
  gamified: ['contextualizada', 'estudo_caso'],
  summative: ['contextualizada', 'teorica', 'estudo_caso'],
};
```

**Exemplos práticos:**

- **Múltipla Escolha** → Ideal para Fixação, Contextualizada, Teórica, Letra da Lei
- **Dissertativa** → Ideal para Teórica, Discursiva Aberta, Estudo de Caso
- **Redação** → Ideal para Discursiva Aberta, Estudo de Caso, Pesquisa
- **Preencher Lacunas** → Ideal para Fixação, Teórica

### 2.2. Recomendações por Nível Acadêmico

O sistema sugere contextos baseados no nível acadêmico do usuário:

```typescript
export const ACADEMIC_LEVEL_CONTEXT_SUGGESTIONS: Record<string, { primary: string[]; secondary: string[] }> = {
  'Ensino Fundamental I': {
    primary: ['fixacao', 'contextualizada'],
    secondary: ['teorica'],
  },
  'Ensino Fundamental II': {
    primary: ['fixacao', 'contextualizada', 'teorica'],
    secondary: ['estudo_caso'],
  },
  'Ensino Médio': {
    primary: ['contextualizada', 'teorica', 'fixacao'],
    secondary: ['estudo_caso', 'letra_lei'],
  },
  'Ensino Técnico': {
    primary: ['contextualizada', 'estudo_caso', 'fixacao'],
    secondary: ['teorica', 'discursiva_aberta'],
  },
  'Ensino Superior': {
    primary: ['contextualizada', 'teorica', 'estudo_caso'],
    secondary: ['discursiva_aberta', 'letra_lei', 'pesquisa'],
  },
  'Pós-Graduação': {
    primary: ['estudo_caso', 'discursiva_aberta', 'pesquisa'],
    secondary: ['contextualizada', 'teorica'],
  },
  'Concurso Público': {
    primary: ['letra_lei', 'contextualizada', 'teorica'],
    secondary: ['fixacao', 'estudo_caso'],
  },
};
```

**Exemplos de uso:**

- Professor de **Ensino Fundamental I** → Sistema recomenda "Fixação" e "Contextualizada"
- Professor de **Ensino Superior** → Sistema recomenda "Contextualizada", "Teórica" e "Estudo de Caso"
- Preparatório para **Concurso Público** → Sistema recomenda "Letra da Lei", "Contextualizada" e "Teórica"

---

## 🎨 3. INTERFACE COM AVISOS INTELIGENTES

### 3.1. Aviso de Ajuste Automático

Quando o usuário seleciona menos questões que tipos:

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ ℹ️ Ajuste automático: Você selecionou 10 tipo(s) de    │
│ questão. Para garantir pelo menos 1 questão de cada tipo,  │
│ o sistema gerará 10 questões (em vez de 5).                │
└─────────────────────────────────────────────────────────────┘
```

### 3.2. Confirmação de Distribuição

Quando a quantidade é adequada:

```
┌─────────────────────────────────────────────────────────────┐
│ ✅ Cada um dos 10 tipos terá pelo menos 1 questão. As 30   │
│ questões restantes serão distribuídas proporcionalmente.    │
└─────────────────────────────────────────────────────────────┘
```

### 3.3. Recomendações por Nível Acadêmico

Card azul informativo:

```
┌─────────────────────────────────────────────────────────────┐
│ 💡 Recomendado para Ensino Superior:                        │
│                                                              │
│ Ideais: Contextualizada (Estilo ENEM), Teórica /           │
│ Conceitual, Estudo de Caso                                  │
│                                                              │
│ Alternativos: Discursiva Aberta, "Letra da Lei" (Estilo    │
│ Concurso), Prompt para Pesquisa (Nível Pós-Doc)            │
└─────────────────────────────────────────────────────────────┘
```

### 3.4. Aviso de Incompatibilidade

Quando o contexto não é ideal para os tipos selecionados:

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Atenção: O contexto selecionado pode não ser ideal para │
│ os tipos de questões escolhidos.                            │
│                                                              │
│ Tipos compatíveis com Fixação: Múltipla Escolha,           │
│ Verdadeiro ou Falso, Somatória, Preencher Lacunas,         │
│ Associação de Colunas                                       │
└─────────────────────────────────────────────────────────────┘
```

### 3.5. Tooltips nos Tipos de Questão

Ao passar o mouse sobre um tipo:

```
┌─────────────────────────────────────────────┐
│ Múltipla Escolha                            │
│ 5 alternativas, 1 correta                   │
│                                             │
│ ─────────────────────────────────────────── │
│ 💡 Contextos recomendados:                  │
│ • Fixação                                   │
│ • Contextualizada (Estilo ENEM)            │
│ • Teórica / Conceitual                      │
└─────────────────────────────────────────────┘
```

---

## 🔍 4. EXEMPLOS DE USO PRÁTICO

### Cenário 1: Professor de Ensino Médio - Matemática

**Configuração:**

- Nível: Ensino Médio
- Tipos selecionados: Múltipla Escolha, Resolução de Problemas, Dissertativa (3 tipos)
- Quantidade: 15 questões

**Sistema mostra:**

1. 💡 Recomendação: "Contextualizada (Estilo ENEM)" é ideal para Ensino Médio
2. ✅ Distribuição: Cada tipo terá pelo menos 1 questão, 12 questões serão distribuídas proporcionalmente
3. 🎯 Resultado esperado:
   - Múltipla Escolha: 5 questões
   - Resolução de Problemas: 5 questões
   - Dissertativa: 5 questões

### Cenário 2: Preparatório para Concurso - Direito

**Configuração:**

- Nível: Concurso Público
- Tipos selecionados: Múltipla Escolha, Verdadeiro ou Falso (2 tipos)
- Quantidade: 40 questões

**Sistema mostra:**

1. 💡 Recomendação: "Letra da Lei (Estilo Concurso)" é ideal para Concurso Público
2. ✅ Distribuição: Cada tipo terá pelo menos 1 questão, 38 questões serão distribuídas proporcionalmente
3. 🎯 Resultado esperado:
   - Múltipla Escolha: 20 questões (1 + 19)
   - Verdadeiro ou Falso: 20 questões (1 + 19)

### Cenário 3: Pós-Graduação - Metodologia

**Configuração:**

- Nível: Pós-Graduação
- Tipos selecionados: Dissertativa, Redação, Baseada em Projeto (3 tipos)
- Quantidade: 5 questões

**Sistema mostra:**

1. ⚠️ Ajuste automático: De 5 para pelo menos 6 questões (3 tipos × 1 mínima + 3 extras)
   - _Na verdade, o sistema ajustaria para 3 se tentasse 5 com 3 tipos, mas vou corrigir o exemplo_

**Correção do exemplo:**

- Usuário digita: 5 questões
- Sistema detecta: 5 > 3 tipos ✅
- Distribuição:
  - Dissertativa: 2 questões (1 + 1 extra + remainder)
  - Redação: 2 questões (1 + 1 extra)
  - Baseada em Projeto: 1 questão (1 mínima)

### Cenário 4: Avaliação Abrangente

**Configuração:**

- Tipos selecionados: TODOS os 11 tipos
- Quantidade: 50 questões

**Sistema mostra:**

1. ✅ Cada um dos 11 tipos terá pelo menos 1 questão
2. 📊 Distribuição:
   - 11 questões mínimas (1 de cada)
   - 39 questões restantes divididas proporcionalmente
   - Resultado: Alguns tipos com 5 questões, outros com 4

**Distribuição exata:**

```
39 ÷ 11 = 3 questões extras por tipo + 6 de remainder

- Primeiros 6 tipos: 1 + 3 + 1 = 5 questões
- Últimos 5 tipos: 1 + 3 = 4 questões
Total: (6 × 5) + (5 × 4) = 30 + 20 = 50 ✅
```

---

## 📝 5. LOGS DO SISTEMA

O sistema agora loga a distribuição final:

```typescript
console.log('📊 Distribuição de questões por tipo:', distribution);

// Exemplo de log:
// 📊 Distribuição de questões por tipo: {
//   multiple_choice: 4,
//   true_false: 4,
//   open: 4,
//   sum: 3
// }
```

---

## ✅ 6. CHECKLIST DE VALIDAÇÃO

### Para Desenvolvedores:

- [x] Garantir pelo menos 1 questão de cada tipo selecionado
- [x] Distribuir questões extras proporcionalmente
- [x] Ajustar automaticamente quando quantidade < tipos
- [x] Logar distribuição para debug
- [x] Adicionar recomendações por tipo de questão
- [x] Adicionar recomendações por nível acadêmico
- [x] Mostrar avisos visuais de ajuste automático
- [x] Mostrar confirmação de distribuição
- [x] Adicionar tooltips informativos nos tipos
- [x] Avisar sobre incompatibilidades de contexto

### Para Usuários:

- [x] Interface clara mostra quantas questões de cada tipo serão geradas
- [x] Avisos automáticos quando quantidade é ajustada
- [x] Recomendações baseadas no nível acadêmico
- [x] Dicas sobre contextos ideais para cada tipo
- [x] Feedback visual sobre compatibilidade

---

## 🎯 7. BENEFÍCIOS

### Para o Sistema:

- ✅ **Consistência:** Sempre gera pelo menos 1 de cada tipo
- ✅ **Previsibilidade:** Distribuição transparente e compreensível
- ✅ **Rastreabilidade:** Logs detalhados da distribuição
- ✅ **Robustez:** Lida com edge cases automaticamente

### Para o Usuário:

- ✅ **Clareza:** Sabe exatamente o que será gerado
- ✅ **Confiança:** Não há "surpresas" na geração
- ✅ **Orientação:** Recebe dicas contextuais inteligentes
- ✅ **Eficiência:** Escolhe contextos ideais mais rapidamente
- ✅ **Aprendizado:** Entende melhor quais combinações funcionam bem

---

## 🚀 CONCLUSÃO

O sistema agora possui:

1. **Garantia absoluta** de pelo menos 1 questão de cada tipo selecionado
2. **Distribuição inteligente** proporcional para questões extras
3. **Recomendações contextuais** baseadas em nível acadêmico
4. **Dicas específicas** por tipo de questão
5. **Feedback visual** claro e informativo
6. **Avisos de incompatibilidade** para melhorar qualidade

**Status:** 🎉 **SISTEMA COMPLETO E INTELIGENTE!**
