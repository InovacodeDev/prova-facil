import { Controller, Post, Body, Headers } from "@nestjs/common";
import { AiService } from "../services/ai.service";
import { SupabaseService } from "../services/supabase.service";

@Controller('ai')
export class AiController {
    constructor(private readonly ai: AiService, private readonly supa: SupabaseService) {}

    @Post('generate')
    async generate(@Body() body: any, @Headers('authorization') auth?: string) {
        const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
        // optional category parameter
        const category = body.category;
        const types = body.questionTypes || ['mcq','tf','dissertativa','somatoria','ligacao'];
        const count = body.count || 5;
        // resolve user id from token if provided
        let userId = null;
        if (token) {
            const { data, error } = await this.supa.client().auth.getUser(token);
            if (error || !data?.user) userId = null; else userId = data.user.id;
        }

        return this.ai.generateAndSave({ topic: body.title || body.content || 'assunto geral', content: body.content, types, count, userId, category });
    }
}
