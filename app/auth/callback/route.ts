import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") || "/dashboard";

    if (code) {
        const supabase = await createClient();

        // Trocar o código por uma sessão
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Redirecionar para o dashboard com mensagem de sucesso
            return NextResponse.redirect(new URL(`${next}?confirmed=true`, requestUrl.origin));
        }

        console.error("Erro ao confirmar email:", error);
    }

    // Redirecionar para a página de login com erro
    return NextResponse.redirect(new URL("/auth?error=confirmation_failed", requestUrl.origin));
}
