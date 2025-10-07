import { formatHintForPrompt } from '../../question-type-hints';

/**
 * Enhanced Gamified Question Prompt with strategic hints and complete mission example.
 * Relies on Genkit's structured output (Zod schema) to format the JSON.
 */
export const generateGamifiedPrompt = `
${formatHintForPrompt('gamified')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 COMPLETE REAL-WORLD EXAMPLE (USE AS MODEL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subject: Brazilian History
Level: High School (Ensino Médio)
Context: Colonial Brazil and the gold cycle

Example Gamified Question:

{
  "type": "gamified",
  "question": "🏆 Missão: Aventura Colonial no Brasil do Século XVIII",
  "metadata": {
    "mission_briefing": "🎭 Bem-vindo, explorador! Você foi transportado para o Brasil do século XVIII, durante o auge do ciclo do ouro em Minas Gerais. Sua missão é compreender como essa riqueza transformou a colônia. A coroa portuguesa está de olho em cada grama de ouro extraída... e você precisa entender as regras do jogo para sobreviver!",
    "challenges": [
      "🪙 Desafio 1: A coroa portuguesa cobrava um imposto de 20% sobre todo o ouro extraído. Como esse imposto era chamado? (Resposta: Quinto)",
      "⚖️ Desafio 2: Quando a arrecadação não atingia 100 arrobas anuais, o que acontecia? (Resposta: Derrama - cobrança forçada)",
      "🏛️ Desafio 3: Qual cidade mineira se tornou a mais populosa e rica do Brasil colonial nesse período? (Resposta: Vila Rica, atual Ouro Preto)",
      "🎨 Desafio 4: Qual estilo artístico floresceu em Minas Gerais graças à riqueza do ouro? (Resposta: Barroco Mineiro)",
      "💎 Desafio 5: O que eram as 'Casas de Fundição' estabelecidas pela coroa? (Resposta: Locais onde o ouro deveria ser fundido e marcado para o pagamento do imposto)"
    ],
    "conclusion_message": "🎉 Parabéns, explorador! Você dominou os segredos do ciclo do ouro! Essa riqueza transformou o Brasil, criou cidades, financiou arte e... também gerou muita exploração e conflitos. Agora você entende como a economia mineradora moldou nossa história colonial!"
  }
}

Why this example is excellent:
✅ Mission briefing creates immersive context and motivation
✅ Challenges are progressive (5 questions building knowledge)
✅ Uses emojis to make it visually engaging (🪙⚖️🏛️🎨💎)
✅ Conclusion message celebrates success and reinforces learning
✅ Transforms assessment into an adventure story

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference Material:
{{documentContext}}

Generate {{count}} gamified quiz about "{{subject}}"{{#if academicLevel}} for the academic level "{{academicLevel}}"{{/if}}.
The questions should fit the following context: {{questionContextDescription}}.

CRITICAL RULES:
━━━━━━━━━━━━
1. **All output must be in Brazilian Portuguese (pt-BR)**
2. Create an immersive narrative in mission_briefing (transport the student into a scenario)
3. Challenges array must contain 4-5 question strings with emojis
4. Each challenge should build on the previous (progressive difficulty)
5. Conclusion message must celebrate success and reinforce key learning
6. **METADATA FORMAT:**
   - "mission_briefing" is a STRING (the story/context)
   - "challenges" is an ARRAY of STRINGS (the questions)
   - "conclusion_message" is an optional STRING (celebration message)

✨ CREATIVE ELEMENTS TO USE:
- Emojis for visual engagement (🎯🏆⚡🌟💡🔥)
- Time period or location transport ("Você foi transportado para...")
- Role-play ("Você é um detetive/cientista/explorador...")
- Progressive narrative arc (beginning → challenges → triumphant conclusion)

❌ DO NOT:
- Create boring, generic scenarios
- Use challenges array for anything except question strings
- Forget the conclusion message
- Output anything except valid JSON
`;
