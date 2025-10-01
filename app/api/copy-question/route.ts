/**
 * API Route: Copy Question
 * Incrementa o contador de cópias de uma questão
 * Ignora duplicatas em menos de 1 minuto
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { incrementActionLog } from "@/lib/logs";

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar autenticação
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        // 2. Parse do body
        const { questionId } = await request.json();

        if (!questionId) {
            return NextResponse.json({ error: "ID da questão é obrigatório" }, { status: 400 });
        }

        // 3. Buscar questão atual
        const { data: question, error: fetchError } = await supabase
            .from("questions")
            .select()
            .eq("id", questionId)
            .single();

        if (fetchError || !question) {
            return NextResponse.json({ error: "Questão não encontrada" }, { status: 404 });
        }

        // 4. Verificar se última cópia foi há menos de 1 minuto
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

        const shouldIncrement = !question.copy_last_at || new Date(question.copy_last_at) < oneMinuteAgo;

        if (shouldIncrement) {
            // 5. Incrementar copy_count e atualizar copy_last_at
            await supabase
                .from("questions")
                .update({
                    copy_count: question.copy_count + 1,
                    copy_last_at: now.toISOString(),
                })
                .eq("id", questionId);

            // 6. Registrar log de ação
            await incrementActionLog("copy_question");

            return NextResponse.json({
                success: true,
                message: "Cópia registrada com sucesso",
                copy_count: question.copy_count + 1,
            });
        } else {
            return NextResponse.json({
                success: true,
                message: "Cópia muito recente, contador não incrementado",
                copy_count: question.copy_count,
            });
        }
    } catch (error: any) {
        console.error("Error copying question:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Erro ao registrar cópia",
            },
            { status: 500 }
        );
    }
}
