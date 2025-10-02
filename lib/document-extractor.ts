/**
 * Utilitário para extração de texto de documentos no client-side
 * Suporta: PDF, DOC, DOCX
 *
 * Benefícios:
 * - Reduz custos de API (envia apenas texto, não arquivos binários)
 * - Processamento mais rápido
 * - Menor consumo de banda
 */

import mammoth from "mammoth";

/**
 * Tipos de arquivo aceitos
 */
export const ACCEPTED_FILE_TYPES = {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
} as const;

export const ACCEPTED_FILE_EXTENSIONS = ".pdf,.doc,.docx";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB por arquivo
export const MAX_TOTAL_SIZE = 30 * 1024 * 1024; // 30MB total

/**
 * Resultado da extração de texto
 */
export interface ExtractedText {
    fileName: string;
    fileType: string;
    text: string;
    pageCount?: number;
    wordCount: number;
    extractionTime: number; // em ms
}

/**
 * Extrai texto de um arquivo PDF
 */
async function extractTextFromPDF(file: File): Promise<ExtractedText> {
    const startTime = performance.now();

    try {
        // Importação dinâmica do pdfjs-dist para evitar problemas com SSR
        const pdfjsLib = await import("pdfjs-dist/webpack.mjs");
        await import("pdfjs-dist/build/pdf.worker.min.mjs");

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const textParts: string[] = [];

        // Extrair texto de cada página
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(" ");

            textParts.push(pageText);
        }

        const fullText = textParts.join("\n\n");
        const wordCount = fullText.split(/\s+/).filter((word) => word.length > 0).length;
        const extractionTime = performance.now() - startTime;

        return {
            fileName: file.name,
            fileType: "pdf",
            text: fullText,
            pageCount: pdf.numPages,
            wordCount,
            extractionTime,
        };
    } catch (error) {
        console.error("Erro ao extrair texto do PDF:", error);
        throw new Error(
            `Falha ao extrair texto de ${file.name}: ${error instanceof Error ? error.message : "Erro desconhecido"}`
        );
    }
}

/**
 * Extrai texto de um arquivo DOCX
 */
async function extractTextFromDOCX(file: File): Promise<ExtractedText> {
    const startTime = performance.now();

    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });

        const text = result.value;
        const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
        const extractionTime = performance.now() - startTime;

        return {
            fileName: file.name,
            fileType: "docx",
            text,
            wordCount,
            extractionTime,
        };
    } catch (error) {
        console.error("Erro ao extrair texto do DOCX:", error);
        throw new Error(
            `Falha ao extrair texto de ${file.name}: ${error instanceof Error ? error.message : "Erro desconhecido"}`
        );
    }
}

/**
 * Extrai texto de um arquivo DOC (formato antigo)
 * Nota: Extração limitada, recomenda-se converter para DOCX
 */
async function extractTextFromDOC(file: File): Promise<ExtractedText> {
    const startTime = performance.now();

    try {
        // mammoth também tenta processar DOC, mas com limitações
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });

        const text = result.value;

        // Se o texto extraído for muito pequeno, pode ter falhado
        if (text.length < 10) {
            throw new Error("Arquivo DOC não pôde ser lido. Por favor, converta para DOCX ou PDF.");
        }

        const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
        const extractionTime = performance.now() - startTime;

        return {
            fileName: file.name,
            fileType: "doc",
            text,
            wordCount,
            extractionTime,
        };
    } catch (error) {
        console.error("Erro ao extrair texto do DOC:", error);
        throw new Error(
            `Falha ao extrair texto de ${file.name}. Arquivos .doc antigos têm suporte limitado. Por favor, converta para .docx ou .pdf.`
        );
    }
}

/**
 * Valida um arquivo antes da extração
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    // Verificar tipo
    const validTypes = Object.keys(ACCEPTED_FILE_TYPES);
    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Tipo de arquivo não suportado: ${file.type}. Use PDF, DOC ou DOCX.`,
        };
    }

    // Verificar tamanho
    if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
        return {
            valid: false,
            error: `Arquivo muito grande: ${sizeMB}MB. Máximo permitido: ${maxSizeMB}MB.`,
        };
    }

    return { valid: true };
}

/**
 * Valida múltiplos arquivos
 */
export function validateFiles(files: File[]): { valid: boolean; error?: string } {
    if (files.length === 0) {
        return { valid: false, error: "Nenhum arquivo selecionado." };
    }

    // Verificar tamanho total
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
        const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        const maxTotalSizeMB = (MAX_TOTAL_SIZE / (1024 * 1024)).toFixed(0);
        return {
            valid: false,
            error: `Tamanho total dos arquivos muito grande: ${totalSizeMB}MB. Máximo permitido: ${maxTotalSizeMB}MB.`,
        };
    }

    // Validar cada arquivo individualmente
    for (const file of files) {
        const validation = validateFile(file);
        if (!validation.valid) {
            return validation;
        }
    }

    return { valid: true };
}

/**
 * Extrai texto de um arquivo (detecta automaticamente o tipo)
 */
export async function extractTextFromFile(file: File): Promise<ExtractedText> {
    // Validar arquivo
    const validation = validateFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // Extrair baseado no tipo
    switch (file.type) {
        case "application/pdf":
            return extractTextFromPDF(file);

        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return extractTextFromDOCX(file);

        case "application/msword":
            return extractTextFromDOC(file);

        default:
            throw new Error(`Tipo de arquivo não suportado: ${file.type}`);
    }
}

/**
 * Extrai texto de múltiplos arquivos em paralelo
 */
export async function extractTextFromFiles(
    files: File[],
    onProgress?: (current: number, total: number, fileName: string) => void
): Promise<ExtractedText[]> {
    // Validar todos os arquivos antes de começar
    const validation = validateFiles(files);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const results: ExtractedText[] = [];

    // Processar arquivos sequencialmente para melhor controle de memória
    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (onProgress) {
            onProgress(i + 1, files.length, file.name);
        }

        const extracted = await extractTextFromFile(file);
        results.push(extracted);
    }

    return results;
}

/**
 * Formata o resultado da extração para envio à API
 */
export function formatExtractedTextForAPI(extracted: ExtractedText[]): string {
    return extracted
        .map((item, index) => {
            const header = `\n\n=== DOCUMENTO ${index + 1}: ${item.fileName} ===\n`;
            const meta = `Tipo: ${item.fileType.toUpperCase()}${
                item.pageCount ? ` | Páginas: ${item.pageCount}` : ""
            } | Palavras: ${item.wordCount}\n`;
            const separator = "---\n";

            return `${header}${meta}${separator}${item.text}`;
        })
        .join("\n\n");
}
