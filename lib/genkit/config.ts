import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

export const ai = genkit({
    plugins: [
        googleAI({
            apiKey: process.env.GOOGLE_AI_API_KEY,
        }),
    ],
    // Modelo padrão (pode ser sobrescrito em cada chamada)
    model: "googleai/gemini-2.0-flash-exp",
});

/**
 * Retorna o modelo completo com prefixo googleai/
 */
export function getGoogleAIModel(modelName: string): string {
    // Se já tem o prefixo, retorna direto
    if (modelName.startsWith("googleai/")) {
        return modelName;
    }
    // Adiciona prefixo googleai/
    return `googleai/${modelName}`;
}
