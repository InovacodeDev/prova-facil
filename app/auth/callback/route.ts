import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") || "/dashboard";

    if (code) {
        const supabase = await createClient();

        // Trocar o código por uma sessão
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data.user) {
            // Verificar se o profile existe, se não, criar automaticamente
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', data.user.id)
                .single();

            if (!existingProfile) {
                // Criar profile automaticamente se não existir
                const { error: profileError } = await supabase.from('profiles').insert({
                    user_id: data.user.id,
                    full_name: data.user.user_metadata?.full_name || null,
                    email: data.user.email!,
                    plan: 'starter',
                    renew_status: 'none',
                    academic_level_id: data.user.user_metadata?.academic_level_id 
                        ? parseInt(data.user.user_metadata.academic_level_id) 
                        : null,
                    email_verified: data.user.email_confirmed_at ? true : false,
                    email_verified_at: data.user.email_confirmed_at || null,
                });

                if (profileError) {
                    console.error('Erro ao criar profile no callback:', profileError);
                }
            } else {
                // Atualizar status de verificação de email se necessário
                if (data.user.email_confirmed_at) {
                    await supabase
                        .from('profiles')
                        .update({
                            email_verified: true,
                            email_verified_at: data.user.email_confirmed_at,
                        })
                        .eq('user_id', data.user.id);
                }
            }

            // Redirecionar para o dashboard com mensagem de sucesso
            return NextResponse.redirect(new URL(`${next}?confirmed=true`, requestUrl.origin));
        }

        console.error("Erro ao confirmar email:", error);
    }

    // Redirecionar para a página de login com erro
    return NextResponse.redirect(new URL("/auth?error=confirmation_failed", requestUrl.origin));
}
