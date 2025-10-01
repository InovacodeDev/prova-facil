/**
 * Logs Helper
 * Gerencia o registro de ações na tabela de logs com upsert
 */

import { ActionType } from "@/db/schema";
import { createClient } from "./supabase/server";

export type ActionTypeKey = keyof typeof ActionType;

/**
 * Incrementa o contador de uma ação específica
 * Se a ação não existir, cria uma nova entrada
 * Se existir, incrementa o count e atualiza updated_at
 */
export async function incrementActionLog(action: ActionTypeKey) {
    try {
        const supabase = await createClient();
        const actionValue = ActionType[action];

        // Buscar log existente
        const { data: existingLog, error: fetchError } = await supabase
            .from("logs")
            .select("*")
            .eq("action", actionValue)
            .single();

        if (existingLog && !fetchError) {
            // Atualizar log existente
            const { error: updateError } = await supabase
                .from("logs")
                .update({
                    count: existingLog.count + 1,
                    updated_at: new Date().toISOString(),
                })
                .eq("action", actionValue);

            if (updateError) {
                console.error(`Error updating log for ${action}:`, updateError);
                return { success: false, error: updateError };
            }
        } else {
            // Criar novo log
            const { error: insertError } = await supabase.from("logs").insert({
                action: actionValue,
                count: 1,
            });

            if (insertError) {
                console.error(`Error inserting log for ${action}:`, insertError);
                return { success: false, error: insertError };
            }
        }

        return { success: true };
    } catch (error) {
        console.error(`Error incrementing action log for ${action}:`, error);
        return { success: false, error: String(error) };
    }
}

/**
 * Busca todas as estatísticas de logs
 * Retorna array com action, count, created_at e updated_at
 */
export async function getAllLogsStats() {
    try {
        const supabase = await createClient();
        const { data: stats } = await supabase.from("logs").select();
        return stats;
    } catch (error) {
        console.error("Error fetching logs stats:", error);
        return [];
    }
}

/**
 * Busca estatísticas de uma ação específica
 */
export async function getActionLogStats(action: ActionTypeKey) {
    try {
        const supabase = await createClient();
        const actionValue = ActionType[action];
        const { data: stat } = await supabase.from("logs").select().eq("action", actionValue).limit(1).single();

        return stat || null;
    } catch (error) {
        console.error(`Error fetching log stats for ${action}:`, error);
        return null;
    }
}
