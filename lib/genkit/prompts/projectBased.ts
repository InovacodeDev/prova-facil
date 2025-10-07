import { formatHintForPrompt } from '../../question-type-hints';

/**
 * Enhanced Project-Based Question Prompt with strategic hints and complete example.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateProjectBasedPrompt = `
${formatHintForPrompt('project_based')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 COMPLETE REAL-WORLD EXAMPLE (USE AS MODEL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subject: Environmental Science + Technology
Level: High School (Ensino Médio)
Context: Sustainability and community impact

Example Project-Based Question:

{
  "type": "project_based",
  "question": "Projeto: Transformando sua Escola em um Modelo de Sustentabilidade",
  "metadata": {
    "welcome_message": "🌱 Bem-vindo ao Projeto Verde! Sua missão é transformar a escola em um exemplo de sustentabilidade ambiental. Durante as próximas semanas, você e sua equipe irão diagnosticar problemas ambientais na escola, propor soluções práticas e implementar pelo menos uma ação concreta. Este projeto vai conectar conhecimentos de Ciências, Matemática, Geografia e Cidadania, mostrando que pequenas ações podem gerar grandes impactos.",
    "guiding_question": "Como podemos tornar nossa escola mais sustentável e inspirar a comunidade escolar a adotar práticas ambientalmente responsáveis no dia a dia?",
    "phases": [
      "📊 FASE 1 - DIAGNÓSTICO (Semana 1): Realize uma auditoria ambiental da escola. Identifique pelo menos 3 problemas: desperdício de água, energia, produção de lixo, falta de áreas verdes, etc. Colete dados quantitativos (ex: quantos copos plásticos são descartados por dia).",
      "💡 FASE 2 - PESQUISA E PLANEJAMENTO (Semana 2): Pesquise soluções viáveis para os problemas identificados. Consulte fontes confiáveis, entreviste especialistas (pode ser por vídeo) e analise cases de outras escolas sustentáveis. Elabore um plano de ação com custos, cronograma e responsáveis.",
      "🛠️ FASE 3 - IMPLEMENTAÇÃO (Semanas 3-4): Coloque pelo menos UMA solução em prática. Exemplos: instalar coletores de água da chuva, criar uma composteira, organizar campanha de redução de plástico, plantar horta escolar. Registre todo o processo com fotos e vídeos.",
      "📈 FASE 4 - AVALIAÇÃO DE IMPACTO (Semana 5): Após 2-3 semanas de implementação, meça os resultados. Compare os dados iniciais com os atuais. A ação reduziu o desperdício? Engajou a comunidade? Quais foram os desafios? O que pode ser melhorado?",
      "🎤 FASE 5 - COMPARTILHAMENTO (Semana 6): Prepare uma apresentação final para a escola. Conte a história do projeto: problema → solução → resultados → aprendizados. Inspire outros alunos e professores a continuarem o trabalho."
    ],
    "deliverables": [
      "📄 Relatório de Diagnóstico Ambiental (2-3 páginas com dados, gráficos e fotos dos problemas identificados)",
      "📋 Plano de Ação Detalhado (incluindo: problema, solução proposta, materiais necessários, orçamento estimado, cronograma e responsáveis)",
      "📸 Portfólio Visual (mínimo 15 fotos/vídeos documentando todas as fases do projeto, do diagnóstico à implementação)",
      "📊 Relatório de Impacto (análise comparativa com dados antes/depois da intervenção, gráficos, depoimentos de participantes)",
      "🎬 Apresentação Final (slides + apresentação oral de 10 minutos para a turma/escola)"
    ],
    "evaluation_criteria": [
      "🔍 Qualidade do Diagnóstico (20%): Os problemas foram bem identificados? Os dados são concretos e relevantes?",
      "💭 Criatividade e Viabilidade da Solução (25%): A proposta é inovadora? É realista e pode ser implementada com os recursos disponíveis?",
      "⚙️ Execução e Engajamento (25%): O projeto foi implementado conforme o planejado? Houve engajamento da equipe e da comunidade?",
      "📈 Análise de Resultados (15%): O impacto foi medido de forma clara? Há evidências de mudança/melhoria?",
      "🎨 Apresentação e Comunicação (15%): O projeto foi apresentado de forma clara, organizada e inspiradora? Os materiais visuais são de qualidade?"
    ]
  }
}

Why this example is excellent:
✅ Welcome message contextualizes and motivates students
✅ Guiding question is OPEN, COMPLEX, and AUTHENTIC
✅ 5 phases with clear actions and timeline (progressive structure)
✅ Each phase has emojis for visual organization (📊💡🛠️📈🎤)
✅ 5 concrete deliverables (reports, plans, portfolio, presentation)
✅ Evaluation criteria with percentages totaling 100%
✅ Connects to real life (sustainability, community impact)
✅ Multidisciplinary (science, math, geography, citizenship)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference Material:
{{documentContext}}

Generate {{count}} project-based learning proposals about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The proposals should fit the following context: {{questionContextDescription}}.

CRITICAL RULES:
━━━━━━━━━━━━
1. **All output must be in Brazilian Portuguese (pt-BR)**
2. Welcome message must contextualize and motivate (why this project matters)
3. Guiding question must be OPEN, COMPLEX, and AUTHENTIC (connects to real world)
4. Create 4-6 phases with specific actions and timeline
5. Define 3-5 concrete deliverables (what students will produce)
6. Evaluation criteria must total 100% and assess different dimensions
7. **METADATA FORMAT:**
   - "welcome_message" is an optional STRING (contextualization)
   - "guiding_question" is a STRING (the driving question)
   - "phases" is an ARRAY of STRINGS (with emojis and timeline)
   - "deliverables" is an ARRAY of STRINGS (concrete products)
   - "evaluation_criteria" is an optional ARRAY of STRINGS (with percentages)

🎯 GUIDING QUESTION CHARACTERISTICS:
- **OPEN:** No single correct answer
- **COMPLEX:** Requires sustained inquiry over time
- **AUTHENTIC:** Connects to real-world issues/problems
- **Personally Meaningful:** Students care about the answer
Example: "How can we..." "What is the best way to..." "How might we solve..."

📅 PHASES STRUCTURE (use emojis for visual organization):
- Phase 1: 📊 RESEARCH/DIAGNOSIS
- Phase 2: 💡 PLANNING/DESIGN
- Phase 3: 🛠️ IMPLEMENTATION/CREATION
- Phase 4: 📈 EVALUATION/TESTING
- Phase 5: 🎤 PRESENTATION/SHARING

📦 DELIVERABLES (must be concrete and assessable):
- Reports, portfolios, presentations
- Physical products (prototypes, models)
- Digital products (videos, websites, apps)
- Performances, exhibitions, campaigns

❌ DO NOT:
- Create generic projects without real-world connection
- Make the guiding question too narrow ("What is photosynthesis?")
- Forget to include timeline/duration for phases
- Create vague deliverables ("Do a project about...")
- Output anything except valid JSON
`;
