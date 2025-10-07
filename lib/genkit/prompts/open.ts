import { formatHintForPrompt } from '../../question-type-hints';

/**
 * Enhanced Open-ended/Dissertative Question Prompt with strategic hints and complete example.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateOpenPrompt = `
${formatHintForPrompt('open')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 COMPLETE REAL-WORLD EXAMPLE (USE AS MODEL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subject: Philosophy (Ethics and Morality)
Level: High School (Ensino Médio)
Context: Contemporary ethical dilemmas

Example Open Question:

{
  "type": "open",
  "question": "Dilema Ético Contemporâneo: O Uso de Inteligência Artificial na Tomada de Decisões Judiciais\\n\\nA) Apresente DOIS argumentos a favor do uso de sistemas de IA para auxiliar juízes em decisões judiciais, considerando princípios como eficiência, imparcialidade e acesso à justiça.\\n\\nB) Apresente DOIS argumentos contrários a essa prática, considerando possíveis riscos éticos relacionados a vieses algorítmicos, responsabilidade moral e autonomia humana.\\n\\nC) Em sua opinião, qual deveria ser o papel da IA no sistema judicial? Justifique sua posição com base em pelo menos um princípio ético estudado (Kant, utilitarismo, ética das virtudes, etc.).",
  "metadata": {
    "expected_answer_guideline": "**GABARITO E CRITÉRIOS DE AVALIAÇÃO:**\\n\\n**Item A - Argumentos a favor (2 pontos cada = 4 pontos):**\\n✅ Eficiência e Velocidade: A IA pode analisar milhares de casos precedentes em segundos, reduzindo o tempo de tramitação processual e desafogando o judiciário.\\n✅ Imparcialidade e Consistência: Algoritmos não são influenciados por fatores emocionais, preconceitos pessoais ou pressões externas, potencialmente reduzindo discriminação.\\n✅ Democratização do Acesso: Sistemas de IA podem auxiliar em grandes volumes de casos, permitindo que mais pessoas tenham acesso rápido à justiça.\\n✅ Análise de Padrões: IA pode identificar padrões em decisões anteriores, promovendo coerência jurisprudencial.\\n\\n**Item B - Argumentos contrários (2 pontos cada = 4 pontos):**\\n❌ Viés Algorítmico: Se treinada com dados históricos que refletem discriminação (racial, de gênero, social), a IA perpetua e amplifica essas injustiças.\\n❌ Falta de Responsabilidade Moral: Quem é responsável por uma decisão injusta tomada (ou influenciada) por uma IA? O programador? O juiz? A máquina não pode ser responsabilizada.\\n❌ Redução da Autonomia e Dignidade Humana: Decisões judiciais envolvem vidas, liberdades e direitos fundamentais - delegá-las a algoritmos desumaniza a justiça.\\n❌ Opacidade (Black Box): Muitos algoritmos de IA são 'caixas-pretas' - não se sabe como chegaram a uma conclusão, ferindo o princípio da transparência jurídica.\\n\\n**Item C - Posição pessoal fundamentada (2 pontos):**\\nO aluno deve apresentar uma posição clara E fundamentá-la com princípios éticos:\\n\\n*Exemplo 1 - Favorável com limites (Perspectiva Utilitarista):*\\n'A IA deve ser usada como FERRAMENTA AUXILIAR, não como tomadora de decisão. Sob a ótica utilitarista (maior bem para o maior número), a IA pode maximizar o acesso à justiça e reduzir custos, MAS a decisão final deve sempre ser humana, garantindo análise contextual e responsabilização.'\\n\\n*Exemplo 2 - Contrária (Perspectiva Kantiana):*\\n'Para Kant, tratar pessoas como FINS EM SI MESMAS, não como meios, é imperativo. Usar IA em decisões judiciais trata réus e litigantes como meros dados a serem processados, violando sua dignidade. A justiça exige empatia, compreensão contextual e responsabilidade moral - atributos exclusivamente humanos.'\\n\\n**CRITÉRIOS DE CORREÇÃO:**\\n- Item A: 4 pontos (2 argumentos × 2 pontos)\\n- Item B: 4 pontos (2 argumentos × 2 pontos)\\n- Item C: 2 pontos (posição clara + fundamentação ética)\\n- Total: 10 pontos"
  }
}

Why this example is excellent:
✅ Question is divided into items (A, B, C) for structured response
✅ Forces balanced analysis (pros AND cons) not just opinion
✅ Requires ethical/philosophical foundation (not just personal belief)
✅ Expected answer provides MULTIPLE valid responses (not just one "correct" answer)
✅ Includes evaluation rubric with point distribution
✅ Tests analysis, synthesis, and evaluation (high-order thinking)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference Material:
{{documentContext}}

Generate {{count}} open-ended questions about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The questions should fit the following context: {{questionContextDescription}}.

CRITICAL RULES:
━━━━━━━━━━━━
1. **All output must be in Brazilian Portuguese (pt-BR)**
2. Question must require ANALYSIS, SYNTHESIS, or EVALUATION (not just recall)
3. **Divide the question into items (A, B, C)** for structured responses
4. Expected answer guideline must:
   - Provide multiple valid response paths (not just ONE correct answer)
   - Include evaluation rubric (point distribution)
   - Show what a GOOD answer looks like (key concepts, structure, depth)
5. **METADATA FORMAT:**
   - "expected_answer_guideline" is a STRING (detailed model answer + rubric)

📝 QUESTION STRUCTURE:
**Good Structure (use this format):**
[Context/Scenario] (1-2 sentences)
A) [First task - usually presentation/analysis]
B) [Second task - usually comparison/contrast]
C) [Third task - usually evaluation/opinion with justification]

**Topics that work well:**
- Ethical dilemmas with multiple perspectives
- Cause-and-effect analysis of historical/social events
- Comparative analysis (theories, periods, systems)
- Application of concepts to real-world scenarios

📊 EXPECTED ANSWER GUIDELINES:
- Start with "GABARITO E CRITÉRIOS DE AVALIAÇÃO:"
- For each item (A, B, C), specify:
  * Key concepts expected
  * Multiple valid approaches (not just one)
  * Point value
- Include example of a good response
- Total should be 10 points

❌ DO NOT:
- Create yes/no questions
- Ask for pure memorization ("Liste os 5 reinos...")
- Provide only ONE correct answer (open questions have nuance!)
- Forget to divide into items (A, B, C structure)
- Output anything except valid JSON
`;
