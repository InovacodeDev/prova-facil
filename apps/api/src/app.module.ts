import { Module } from "@nestjs/common";
import { AuthController } from "./controllers/auth.controller";
import { RpcController } from "./controllers/rpc.controller";
import { SupabaseService } from "./services/supabase.service";

@Module({
    controllers: [AuthController, RpcController],
    providers: [SupabaseService],
})
export class AppModule {}
