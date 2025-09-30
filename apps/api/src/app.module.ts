import { Module } from "@nestjs/common";
import { AuthController } from "./controllers/auth.controller";
import { RpcController } from "./controllers/rpc.controller";
import { AiController } from "./controllers/ai.controller";
import { SupabaseService } from "./services/supabase.service";
import { AiService } from "./services/ai.service";

@Module({
    controllers: [AuthController, RpcController, AiController],
    providers: [SupabaseService, AiService],
})
export class AppModule {}
