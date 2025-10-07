import { formatHintForPrompt } from '../../question-type-hints';

/**
 * Enhanced Problem-Solving Question Prompt with strategic hints and complete real-world scenario.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateProblemSolvingPrompt = `
${formatHintForPrompt('problem_solving')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 COMPLETE REAL-WORLD EXAMPLE (USE AS MODEL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subject: Logistics and Operations Management
Level: Higher Education (Business Administration)
Context: Last-mile delivery optimization

Example Problem-Solving Question:

{
  "type": "problem_solving",
  "question": "Desafio Logístico: Otimização de Entregas Urbanas",
  "metadata": {
    "scenario": "Você é o gerente de operações de uma empresa de e-commerce que realiza 500 entregas diárias na região metropolitana de São Paulo. Recentemente, os custos de combustível aumentaram 35% e o tempo médio de entrega subiu de 2 para 4 dias, gerando reclamações de clientes. A diretoria exige uma solução que reduza custos em 20% e melhore o prazo de entrega.",
    "data": [
      {
        "label": "Entregas diárias",
        "value": "500 pedidos"
      },
      {
        "label": "Frota atual",
        "value": "25 veículos (consumo médio: 8 km/L)"
      },
      {
        "label": "Distância média por entrega",
        "value": "18 km"
      },
      {
        "label": "Custo de combustível",
        "value": "R$ 5,80/litro"
      },
      {
        "label": "Tempo médio de rota atual",
        "value": "6 horas/veículo"
      },
      {
        "label": "Taxa de ocupação dos veículos",
        "value": "60% (muitas viagens com espaço vazio)"
      }
    ],
    "task": "Elabore uma estratégia de otimização logística que: (1) Reduza o custo operacional em pelo menos 20%, (2) Diminua o tempo de entrega para até 2 dias, (3) Melhore a eficiência da frota. Justifique cada decisão com cálculos e análise dos dados fornecidos.",
    "solution_guideline": "**SOLUÇÃO PASSO A PASSO:**\n\n**Passo 1 - Diagnóstico da Situação Atual:**\n- Custo diário de combustível: 500 entregas × 18 km = 9.000 km/dia\n- Consumo: 9.000 km ÷ 8 km/L = 1.125 litros/dia\n- Custo: 1.125 L × R$ 5,80 = R$ 6.525/dia → R$ 195.750/mês (30 dias)\n- Problema identificado: Taxa de ocupação de apenas 60% = ineficiência crítica\n\n**Passo 2 - Estratégias de Otimização:**\n\n**A) Roteirização Inteligente (Software de Otimização de Rotas):**\n- Implementar algoritmo de roteirização que agrupe entregas por região\n- Redução estimada de distância: 25% (de 18 km para 13,5 km em média)\n- Novo consumo: (500 × 13,5 km) ÷ 8 km/L = 843 litros/dia\n- Economia: (1.125 - 843) × R$ 5,80 = R$ 1.635/dia → R$ 49.050/mês (25% de redução)\n\n**B) Consolidação de Carga (Melhorar Ocupação dos Veículos):**\n- Aumentar taxa de ocupação de 60% para 85% através de:\n  * Janelas de entrega flexíveis (permitir agrupamento)\n  * Centros de micro-distribuição estratégicos\n- Redução de veículos necessários: de 25 para 18 veículos (-28%)\n- Economia adicional em manutenção: R$ 15.000/mês\n\n**C) Parceria com Centros de Distribuição Locais:**\n- Estabelecer 3 mini-hubs em zonas estratégicas (Zona Leste, Sul e Oeste)\n- Entregas noturnas do CD principal para os hubs (carga consolidada)\n- Last-mile (entrega final) mais rápido e eficiente no dia seguinte\n- Reduz distância média e melhora prazo de entrega\n\n**Passo 3 - Resultados Esperados:**\n- **Redução de Custo:** 25% em combustível + economia de manutenção = 30% total ✅ (meta: 20%)\n- **Melhoria no Prazo:** Entregas em até 24-48h com os micro-hubs ✅ (meta: 2 dias)\n- **Eficiência:** Aumento de ocupação de 60% para 85% ✅\n\n**Passo 4 - Investimento Inicial:**\n- Software de roteirização: R$ 15.000 (one-time) + R$ 2.000/mês\n- Setup dos 3 micro-hubs: R$ 45.000 (aluguel e estrutura inicial)\n- ROI (Retorno sobre Investimento): 2 meses\n\n**Conclusão:** A estratégia combina tecnologia (roteirização) + operação inteligente (consolidação) + infraestrutura (hubs) para superar todas as metas. A chave é tratar a logística como um SISTEMA integrado, não apenas 'reduzir custos'."
  }
}

Why this example is excellent:
✅ Scenario is realistic and complex (actual business problem)
✅ Data is structured and comprehensive (6 key metrics)
✅ Task has multiple clear objectives (cost, time, efficiency)
✅ Solution is detailed with calculations and justifications
✅ Shows PROCESS (diagnostic → strategies → results → investment)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference Material:
{{documentContext}}

Generate {{count}} problem-solving questions about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The questions should fit the following context: {{questionContextDescription}}.

CRITICAL RULES:
━━━━━━━━━━━━
1. **All output must be in Brazilian Portuguese (pt-BR)**
2. Scenario must be realistic and engaging (real-world situation)
3. Provide structured data array with 4-8 key metrics/information
4. Task must be clear and specific (what needs to be solved)
5. Solution guideline must show STEP-BY-STEP process with calculations
6. **METADATA FORMAT:**
   - "scenario" is a STRING (the problem context)
   - "data" is an ARRAY of OBJECTS (label + value pairs)
   - "task" is a STRING (what needs to be done)
   - "solution_guideline" is a STRING (detailed step-by-step solution)

💡 SOLUTION GUIDELINE STRUCTURE:
- **Passo 1:** Diagnostic/Analysis (understand current state with calculations)
- **Passo 2:** Strategy/Approach (present solution alternatives)
- **Passo 3:** Results/Impact (quantify improvements)
- **Passo 4:** Implementation (if applicable - costs, timeline, ROI)
- **Conclusão:** Key insights and learning

📊 DATA ARRAY GUIDELINES:
- Each data point has "label" and "value"
- Make them relevant and necessary for solving the problem
- Include units (km, kg, R$, %, hours, etc.)
- Mix quantitative and contextual data

❌ DO NOT:
- Create overly simple problems (just plug numbers into formula)
- Provide generic solutions without specific calculations
- Forget to structure the data array properly
- Make scenarios unrealistic or boring
- Output anything except valid JSON
`;
