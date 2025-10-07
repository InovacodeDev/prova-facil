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
  "question": "Dilema Ético: O Uso de IA no Sistema Judicial",
  "metadata": {
    "main_question": "O crescente avanço da Inteligência Artificial (IA) levanta debates complexos sobre sua aplicação em áreas críticas da sociedade, como o sistema judicial. A promessa de eficiência e imparcialidade contrasta com os riscos de vieses algorítmicos e a desumanização da justiça.",
    "sub_questions": [
      "Apresente DOIS argumentos a favor do uso de sistemas de IA para auxiliar juízes em decisões judiciais, considerando princípios como eficiência, imparcialidade e acesso à justiça.",
      "Apresente DOIS argumentos contrários a essa prática, considerando possíveis riscos éticos relacionados a vieses algorítmicos, responsabilidade moral e autonomia humana.",
      "Em sua opinião, qual deveria ser o papel da IA no sistema judicial? Justifique sua posição com base em pelo menos um princípio ético estudado (Kant, utilitarismo, ética das virtudes, etc.)."
    ],
    "expected_answer_guideline": "**GABARITO E CRITÉRIOS DE AVALIAÇÃO:**\\n\\n**Item A - Argumentos a favor (2 pontos cada = 4 pontos):**\\n✅ Eficiência e Velocidade: A IA pode analisar milhares de casos precedentes em segundos, reduzindo o tempo de tramitação processual e desafogando o judiciário.\\n✅ Imparcialidade e Consistência: Algoritmos não são influenciados por fatores emocionais, preconceitos pessoais ou pressões externas, potencialmente reduzindo discriminação.\\n✅ Democratização do Acesso: Sistemas de IA podem auxiliar em grandes volumes de casos, permitindo que mais pessoas tenham acesso rápido à justiça.\\n✅ Análise de Padrões: IA pode identificar padrões em decisões anteriores, promovendo coerência jurisprudencial.\\n\\n**Item B - Argumentos contrários (2 pontos cada = 4 pontos):**\\n❌ Viés Algorítmico: Se treinada com dados históricos que refletem discriminação (racial, de gênero, social), a IA perpetua e amplifica essas injustiças.\\n❌ Falta de Responsabilidade Moral: Quem é responsável por uma decisão injusta tomada (ou influenciada) por uma IA? O programador? O juiz? A máquina não pode ser responsabilizada.\\n❌ Redução da Autonomia e Dignidade Humana: Decisões judiciais envolvem vidas, liberdades e direitos fundamentais - delegá-las a algoritmos desumaniza a justiça.\\n❌ Opacidade (Black Box): Muitos algoritmos de IA são 'caixas-pretas' - não se sabe como chegaram a uma conclusão, ferindo o princípio da transparência jurídica.\\n\\n**Item C - Posição pessoal fundamentada (2 pontos):**\\nO aluno deve apresentar uma posição clara E fundamentá-la com princípios éticos:\\n\\n*Exemplo 1 - Favorável com limites (Perspectiva Utilitarista):*\\n'A IA deve ser usada como FERRAMENTA AUXILIAR, não como tomadora de decisão. Sob a ótica utilitarista (maior bem para o maior número), a IA pode maximizar o acesso à justiça e reduzir custos, MAS a decisão final deve sempre ser humana, garantindo análise contextual e responsabilização.'\\n\\n*Exemplo 2 - Contrária (Perspectiva Kantiana):*\\n'Para Kant, tratar pessoas como FINS EM SI MESMAS, não como meios, é imperativo. Usar IA em decisões judiciais trata réus e litigantes como meros dados a serem processados, violando sua dignidade. A justiça exige empatia, compreensão contextual e responsabilidade moral - atributos exclusivamente humanos.'\\n\\n**CRITÉRIOS DE CORREÇÃO:**\\n- Item A: 4 pontos (2 argumentos × 2 pontos)\\n- Item B: 4 pontos (2 argumentos × 2 pontos)\\n- Item C: 2 pontos (posição clara + fundamentação ética)\\n- Total: 10 pontos"
  }
}

Why this example is excellent:
✅ Question content is separated into a 'main_question' (context) and an array of 'sub_questions' (tasks).
✅ Forces balanced analysis (pros AND cons) not just opinion.
✅ Requires ethical/philosophical foundation (not just personal belief).
✅ Expected answer provides MULTIPLE valid responses and includes a detailed evaluation rubric.
✅ Tests analysis, synthesis, and evaluation (high-order thinking).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference Material:
{{documentContext}}

Generate {{count}} open-ended questions about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The questions should fit the following context: {{questionContextDescription}}.

CRITICAL RULES:
━━━━━━━━━━━━
1.  **All output must be in Brazilian Portuguese (pt-BR).**
2.  Question must require ANALYSIS, SYNTHESIS, or EVALUATION (not just recall).
3.  **Adhere strictly to the JSON structure demonstrated in the example.**
    - The \`main_question\` field must contain the introductory context or scenario.
    - The \`sub_questions\` field must be an array of strings, where each string is a specific task for the student (item A, B, C...).
4.  The \`expected_answer_guideline\` must be a single string that:
    - Provides multiple valid response paths.
    - Includes an evaluation rubric with point distribution.
    - Shows what a GOOD answer looks like (key concepts, structure, depth).
5.  The top-level \`question\` field should be a short, descriptive title for the entire question.

📊 EXPECTED ANSWER GUIDELINES:
- Start with "**GABARITO E CRITÉRIOS DE AVALIAÇÃO:**".
- For each item (A, B, C), specify:
  * Key concepts expected.
  * Multiple valid approaches.
  * Point value.
- Include an example of a good response.
- Total should be 10 points.

❌ DO NOT:
- Create yes/no questions.
- Ask for pure memorization ("Liste os 5 reinos...").
- Combine the main question and sub-questions into a single text block.
- Forget to structure the question with \`main_question\` and \`sub_questions\` fields.
- Output anything except valid JSON.
`;
