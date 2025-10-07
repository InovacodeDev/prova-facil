import { formatHintForPrompt } from '../../question-type-hints';

/**
 * Enhanced Essay Question Prompt with strategic hints and complete example with supporting texts.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateEssayPrompt = `
${formatHintForPrompt('essay')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 COMPLETE REAL-WORLD EXAMPLE (USE AS MODEL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subject: Technology and Society
Level: High School (3º ano do Ensino Médio)
Context: ENEM-style essay with supporting texts

Example Essay Question:

{
  "type": "essay",
  "question": "A Inteligência Artificial e o Futuro do Trabalho: Oportunidades e Desafios para a Sociedade Brasileira",
  "metadata": {
    "instructions": [
      "Escreva um texto dissertativo-argumentativo em norma padrão da língua portuguesa",
      "Apresente proposta de intervenção que respeite os direitos humanos",
      "Desenvolva argumentação consistente, utilizando os textos motivadores como apoio",
      "Mínimo de 30 linhas e máximo de 40 linhas",
      "Não copie trechos dos textos motivadores"
    ],
    "supporting_texts": [
      {
        "source": "Texto I - Relatório do Fórum Econômico Mundial (2023)",
        "content": "Até 2025, estima-se que 85 milhões de empregos podem ser deslocados pela automação e inteligência artificial, enquanto 97 milhões de novas funções podem emergir, mais adaptadas à nova divisão do trabalho entre humanos, máquinas e algoritmos. A transição exigirá requalificação massiva da força de trabalho."
      },
      {
        "source": "Texto II - Pesquisa FGV (2023)",
        "content": "No Brasil, 54% dos trabalhadores em setores como atendimento ao cliente, transporte e manufatura estão em ocupações com alto risco de automação. Paradoxalmente, apenas 23% das empresas brasileiras investem em programas de capacitação digital para seus funcionários."
      },
      {
        "source": "Texto III - Entrevista com especialista em educação",
        "content": "A educação precisa mudar radicalmente. Não basta ensinar programação; precisamos desenvolver habilidades que a IA não consegue replicar: pensamento crítico, criatividade, inteligência emocional e capacidade de resolver problemas complexos. São as chamadas 'soft skills' que garantirão a empregabilidade no século XXI."
      },
      {
        "source": "Texto IV - Constituição Federal, Art. 6º",
        "content": "São direitos sociais a educação, a saúde, a alimentação, o trabalho, a moradia, o transporte, o lazer, a segurança, a previdência social, a proteção à maternidade e à infância, a assistência aos desamparados, na forma desta Constituição."
      }
    ],
    "essay_prompt": "Com base nos textos motivadores e em seus conhecimentos, redija um texto dissertativo-argumentativo sobre o tema: 'A Inteligência Artificial e o Futuro do Trabalho: Como o Brasil pode se preparar para as transformações do mercado de trabalho promovidas pela automação?'"
  }
}

Why this example is excellent:
✅ Complex, current, and relevant theme (AI impact on jobs)
✅ Instructions array is clear and complete (ENEM format)
✅ 4 supporting texts with varied perspectives:
   - Text I: International data (opportunity + challenge)
   - Text II: Brazilian reality (concrete numbers)
   - Text III: Expert solution (education focus)
   - Text IV: Constitutional foundation (rights framework)
✅ Essay prompt connects texts and requests intervention proposal
✅ Forces critical thinking, not just text summary

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference Material:
{{documentContext}}

Generate {{count}} essay prompts about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The prompts should fit the following context: {{questionContextDescription}}.

CRITICAL RULES:
━━━━━━━━━━━━
1. **All output must be in Brazilian Portuguese (pt-BR)**
2. Theme must be complex, current, and allow for argumentation
3. Provide 3-4 supporting texts with VARIED PERSPECTIVES:
   - Mix of data, opinions, legislation, expert views
   - Different genres (report, interview, law, article)
   - Should complement each other, not repeat
4. Instructions must be specific (format, length, requirements)
5. **METADATA FORMAT:**
   - "instructions" is an ARRAY of STRINGS
   - "supporting_texts" is an ARRAY of OBJECTS (source + content)
   - "essay_prompt" is a STRING (the final command/theme)

📚 SUPPORTING TEXT GUIDELINES:
- Each text should be 50-150 words (substantial but readable)
- Include the source (author, publication, year, article)
- Create tension/perspectives to force critical analysis
- At least one text should present data/statistics
- Consider including a constitutional/legal reference when relevant

❌ DO NOT:
- Create generic, outdated themes
- Use supporting texts that all say the same thing
- Make texts too short (1-2 sentences) or too long (full page)
- Forget to specify the instructions array
- Output anything except valid JSON
`;
