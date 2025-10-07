/**
 * API Route para enviar email de verificação
 *
 * Este endpoint permite que usuários solicitem um novo email de verificação.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/error-logs-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar se o usuário está autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se o email já está verificado
    if (user.email_confirmed_at) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    // Enviar email de verificação usando Supabase Auth
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (resendError) {
      await logError({
        message: `Failed to resend verification email: ${resendError.message}`,
        level: 'error',
        context: {
          userId: user.id,
          endpoint: '/api/profile/verify-email',
          method: 'POST',
        },
      });

      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    await logError({
      message: error instanceof Error ? error.message : 'Unknown error in verify-email endpoint',
      stack: error instanceof Error ? error.stack : undefined,
      level: 'error',
      context: {
        endpoint: '/api/profile/verify-email',
        method: 'POST',
      },
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
