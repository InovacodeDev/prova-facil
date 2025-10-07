/**
 * File Upload Validator
 *
 * Validates file uploads based on user's subscription plan.
 * Each plan has different allowed file types and size limits.
 */

export interface PlanLimits {
    doc_type: string[];
    docs_size: number; // in MB
}

export interface UploadValidationResult {
    valid: boolean;
    error?: string;
    allowedTypes?: string[];
    maxSize?: number;
}

/**
 * Plan configurations for file uploads
 * Based on /db/migrations/0011_populate_plans_table.sql
 */
const PLAN_LIMITS: Record<string, PlanLimits> = {
    starter: {
        doc_type: ["txt", "docx", "text"],
        docs_size: 10,
    },
    basic: {
        doc_type: ["txt", "docx", "text"],
        docs_size: 20,
    },
    essentials: {
        doc_type: ["txt", "docx", "pdf", "link", "text"],
        docs_size: 30,
    },
    plus: {
        doc_type: ["txt", "docx", "pdf", "link", "text"],
        docs_size: 40,
    },
    advanced: {
        doc_type: ["txt", "docx", "pdf", "pptx", "link", "text"],
        docs_size: 100,
    },
};

/**
 * MIME type to extension mapping
 */
const MIME_TO_EXTENSION: Record<string, string> = {
    "text/plain": "txt",
    "application/msword": "docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/pdf": "pdf",
    "application/vnd.ms-powerpoint": "pptx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
    const parts = filename.toLowerCase().split(".");
    return parts.length > 1 ? parts[parts.length - 1] : "";
}

/**
 * Convert file size from bytes to MB
 */
function bytesToMB(bytes: number): number {
    return bytes / (1024 * 1024);
}

/**
 * Validate file upload based on user's plan
 *
 * @param file - The file to validate
 * @param userPlan - The user's subscription plan (starter, basic, essentials, plus, advanced)
 * @returns Validation result with error message if invalid
 */
export function validateFileUpload(file: File, userPlan: string): UploadValidationResult {
    const planLimits = PLAN_LIMITS[userPlan];

    if (!planLimits) {
        return {
            valid: false,
            error: `Plano inválido: ${userPlan}`,
        };
    }

    // Get file extension
    const extension = getFileExtension(file.name);
    const mimeExtension = MIME_TO_EXTENSION[file.type];

    // Check if file type is allowed
    const allowedExtensions = planLimits.doc_type.filter((type) => type !== "text" && type !== "link");
    const isExtensionAllowed =
        allowedExtensions.includes(extension) || (mimeExtension && allowedExtensions.includes(mimeExtension));

    if (!isExtensionAllowed) {
        return {
            valid: false,
            error: `Tipo de arquivo não permitido. Seu plano ${userPlan} permite apenas: ${allowedExtensions
                .join(", ")
                .toUpperCase()}`,
            allowedTypes: allowedExtensions,
        };
    }

    // Check file size
    const fileSizeMB = bytesToMB(file.size);
    if (fileSizeMB > planLimits.docs_size) {
        return {
            valid: false,
            error: `Arquivo muito grande. Tamanho máximo para seu plano: ${
                planLimits.docs_size
            }MB (arquivo: ${fileSizeMB.toFixed(2)}MB)`,
            maxSize: planLimits.docs_size,
        };
    }

    return {
        valid: true,
        allowedTypes: allowedExtensions,
        maxSize: planLimits.docs_size,
    };
}

/**
 * Validate URL/link input based on user's plan
 * Links are only available for Essentials, Plus, and Advanced plans
 *
 * @param url - The URL to validate
 * @param userPlan - The user's subscription plan
 * @returns Validation result with error message if invalid
 */
export function validateLinkInput(url: string, userPlan: string): UploadValidationResult {
    const planLimits = PLAN_LIMITS[userPlan];

    if (!planLimits) {
        return {
            valid: false,
            error: `Plano inválido: ${userPlan}`,
        };
    }

    // Check if plan allows links
    if (!planLimits.doc_type.includes("link")) {
        return {
            valid: false,
            error: `Envio de links não disponível no plano ${userPlan}. Faça upgrade para Essentials, Plus ou Advanced.`,
        };
    }

    // Validate URL format
    try {
        new URL(url);
        return { valid: true };
    } catch (error) {
        return {
            valid: false,
            error: "URL inválida. Por favor, insira um link válido (ex: https://exemplo.com)",
        };
    }
}

/**
 * Check if text input is allowed for a plan
 * Text input is available for all plans
 *
 * @param userPlan - The user's subscription plan
 * @returns True if text input is allowed
 */
export function isTextInputAllowed(userPlan: string): boolean {
    const planLimits = PLAN_LIMITS[userPlan];
    return planLimits ? planLimits.doc_type.includes("text") : false;
}

/**
 * Check if link input is allowed for a plan
 * Links are only available for Essentials, Plus, and Advanced
 *
 * @param userPlan - The user's subscription plan
 * @returns True if link input is allowed
 */
export function isLinkInputAllowed(userPlan: string): boolean {
    const planLimits = PLAN_LIMITS[userPlan];
    return planLimits ? planLimits.doc_type.includes("link") : false;
}

/**
 * Get allowed file types for a plan
 *
 * @param userPlan - The user's subscription plan
 * @returns Array of allowed file extensions (excluding 'text' and 'link')
 */
export function getAllowedFileTypes(userPlan: string): string[] {
    const planLimits = PLAN_LIMITS[userPlan];
    if (!planLimits) return [];

    return planLimits.doc_type.filter((type) => type !== "text" && type !== "link");
}

/**
 * Get maximum file size for a plan
 *
 * @param userPlan - The user's subscription plan
 * @returns Maximum file size in MB
 */
export function getMaxFileSize(userPlan: string): number {
    const planLimits = PLAN_LIMITS[userPlan];
    return planLimits ? planLimits.docs_size : 0;
}

/**
 * Get human-readable upload capabilities for a plan
 *
 * @param userPlan - The user's subscription plan
 * @returns Description of upload capabilities
 */
export function getPlanUploadCapabilities(userPlan: string): string {
    const planLimits = PLAN_LIMITS[userPlan];
    if (!planLimits) return "Plano inválido";

    const fileTypes = getAllowedFileTypes(userPlan);
    const hasTextInput = isTextInputAllowed(userPlan);
    const hasLinkInput = isLinkInputAllowed(userPlan);

    let capabilities = `Arquivos: ${fileTypes.join(", ").toUpperCase()} (até ${planLimits.docs_size}MB)`;

    if (hasTextInput) {
        capabilities += " | Texto direto";
    }

    if (hasLinkInput) {
        capabilities += " | Links externos";
    }

    return capabilities;
}
