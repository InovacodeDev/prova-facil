import { Controller, Post, Body, Patch, Headers } from "@nestjs/common";
import { SupabaseService } from "../services/supabase.service";

@Controller("api")
export class RpcController {
    constructor(private readonly supabaseService: SupabaseService) {}

    @Post("rpc/query")
    async rpcQuery(@Body() body: any): Promise<any> {
        return this.supabaseService.rpcQuery(body, null);
    }

    @Post("assessments")
    async createAssessment(@Body() body: any, @Headers("authorization") auth?: string): Promise<any> {
        const token = auth && auth.startsWith("Bearer ") ? auth.slice(7) : null;
        return this.supabaseService.createAssessment(token, body);
    }

    @Patch("profile")
    async updateProfile(@Body() body: any, @Headers("authorization") auth?: string): Promise<any> {
        const token = auth && auth.startsWith("Bearer ") ? auth.slice(7) : null;
        return this.supabaseService.updateProfile(token, body);
    }
}
