import { Controller, Post, Get, Body, Headers } from "@nestjs/common";
import { SupabaseService } from "../services/supabase.service";

@Controller("auth")
export class AuthController {
    constructor(private readonly supabaseService: SupabaseService) {}

    @Post("signup")
    async signup(@Body() body: unknown) {
        return this.supabaseService.signup(body);
    }

    @Post("signin")
    async signin(@Body() body: unknown) {
        return this.supabaseService.signin(body);
    }

    @Post("change-password")
    async changePassword(@Body() body: unknown, @Headers("authorization") auth?: string) {
        const token = auth && auth.startsWith("Bearer ") ? auth.slice(7) : null;
        return this.supabaseService.changePassword(token, body);
    }

    @Get("me")
    async me(@Headers("authorization") auth?: string) {
        const token = auth && auth.startsWith("Bearer ") ? auth.slice(7) : null;
        return this.supabaseService.me(token);
    }
}
