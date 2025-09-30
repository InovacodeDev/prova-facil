import { Controller, Post, Get, Body, Headers, Res, HttpCode } from "@nestjs/common";
import { randomBytes } from 'crypto';
import { SupabaseService } from "../services/supabase.service";

@Controller("auth")
export class AuthController {
    constructor(private readonly supabaseService: SupabaseService) {}

    @Post("signup")
    async signup(@Body() body: unknown) {
        return this.supabaseService.signup(body);
    }

    @Post("signin")
    async signin(@Body() body: unknown, @Res({ passthrough: true }) res: any) {
        const data = await this.supabaseService.signin(body);
        // data should contain session: { access_token, refresh_token, expires_in }
        const session = (data && (data as any).session) || (data as any);
        if (session?.access_token) {
            // set secure httpOnly cookies for access and refresh tokens
            const secure = process.env.NODE_ENV === 'production';
            res.cookie('sb_access_token', session.access_token, { httpOnly: true, secure, sameSite: 'lax', maxAge: (session.expires_in || 3600) * 1000 });
            if (session.refresh_token) {
                // long lived refresh cookie
                res.cookie('sb_refresh_token', session.refresh_token, { httpOnly: true, secure, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
            }
            // set a double-submit CSRF cookie (httpOnly); client must fetch it via /api/auth/csrf
            try {
                const csrf = randomBytes(16).toString('hex');
                // store csrf as httpOnly cookie to avoid XSS-readable tokens
                res.cookie('sb_csrf', csrf, { httpOnly: true, secure, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
            } catch (e) {
                // ignore csurf generation failures (non-fatal)
            }
        }
        return data;
    }

    @Post("change-password")
    async changePassword(@Body() body: unknown, @Headers("authorization") auth?: string) {
        const token = auth && auth.startsWith("Bearer ") ? auth.slice(7) : null;
        return this.supabaseService.changePassword(token, body);
    }

    @Post('refresh')
    @HttpCode(200)
    async refresh(@Headers('cookie') cookieHeader?: string, @Res({ passthrough: true }) res?: any) {
        // parse cookie header to find sb_refresh_token
        const cookies = (cookieHeader || '').split(';').map(c => c.trim()).filter(Boolean);
        const cookieMap: Record<string,string> = {};
        for (const c of cookies) {
            const [k, ...rest] = c.split('=');
            cookieMap[k] = rest.join('=');
        }
        const refreshToken = cookieMap['sb_refresh_token'] || null;
        const session = await this.supabaseService.refreshToken(refreshToken);
        // set new cookies
        if (res && session?.access_token) {
            const secure = process.env.NODE_ENV === 'production';
            res.cookie('sb_access_token', session.access_token, { httpOnly: true, secure, sameSite: 'lax', maxAge: (session.expires_in || 3600) * 1000 });
            if (session.refresh_token) {
                res.cookie('sb_refresh_token', session.refresh_token, { httpOnly: true, secure, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
            }
            // rotate csrf token as httpOnly cookie as well
            try {
                const csrf = randomBytes(16).toString('hex');
                res.cookie('sb_csrf', csrf, { httpOnly: true, secure, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
            } catch (e) {
                // ignore
            }
        }
        return session;
    }

    @Get("me")
    async me(@Headers("authorization") auth?: string, @Headers('cookie') cookieHeader?: string, @Res({ passthrough: true }) res?: any) {
        // priority: Authorization header (Bearer), then sb_access_token cookie, then attempt refresh
        let token = auth && auth.startsWith("Bearer ") ? auth.slice(7) : null;
        // parse cookies
        const cookies = (cookieHeader || '').split(';').map(c => c.trim()).filter(Boolean);
        const cookieMap: Record<string,string> = {};
        for (const c of cookies) {
            const [k, ...rest] = c.split('=');
            cookieMap[k] = rest.join('=');
        }
        if (!token && cookieMap['sb_access_token']) token = cookieMap['sb_access_token'];

        try {
            return await this.supabaseService.me(token || null);
        } catch (e: any) {
            // if token invalid/expired and we have a refresh cookie, try to refresh
            const refreshToken = cookieMap['sb_refresh_token'];
            if (refreshToken) {
                try {
                    const session = await this.supabaseService.refreshToken(refreshToken);
                    if (res && session?.access_token) {
                        const secure = process.env.NODE_ENV === 'production';
                        res.cookie('sb_access_token', session.access_token, { httpOnly: true, secure, sameSite: 'lax', maxAge: (session.expires_in || 3600) * 1000 });
                        if (session.refresh_token) {
                            res.cookie('sb_refresh_token', session.refresh_token, { httpOnly: true, secure, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
                        }
                    }
                    return await this.supabaseService.me(session?.access_token || null);
                } catch (re: any) {
                    // fallthrough to return original error
                    throw re;
                }
            }
            throw e;
        }
    }

    @Post("logout")
    async logout(@Res({ passthrough: true }) res: any) {
        const secure = process.env.NODE_ENV === 'production';
        // clear cookies
        res.clearCookie('sb_access_token', { httpOnly: true, secure, sameSite: 'lax' });
        res.clearCookie('sb_refresh_token', { httpOnly: true, secure, sameSite: 'lax' });
        res.clearCookie('sb_csrf', { httpOnly: true, secure, sameSite: 'lax' });
        return { success: true };
    }

    @Get('csrf')
    async getCsrf(@Headers('cookie') cookieHeader?: string) {
        const cookies = (cookieHeader || '').split(';').map(c => c.trim()).filter(Boolean);
        const cookieMap: Record<string,string> = {};
        for (const c of cookies) {
            const [k, ...rest] = c.split('=');
            cookieMap[k] = rest.join('=');
        }
        const csrf = cookieMap['sb_csrf'] || null;
        if (!csrf) return { csrf: null };
        return { csrf };
    }
}
