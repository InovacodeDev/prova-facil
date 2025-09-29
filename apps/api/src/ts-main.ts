import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";

export async function createApp() {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
    app.enableCors({ origin: process.env.FRONTEND_URL || "*" });
    await app.init();
    return app;
}

if (require.main === module) {
    (async () => {
        const app = await createApp();
        await app.listen(8000);
        console.log("API listening on http://localhost:8000");
    })();
}
