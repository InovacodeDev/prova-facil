import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";

async function start() {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
    app.enableCors({ origin: process.env.FRONTEND_URL || "*" });
    await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001, "0.0.0.0");
    console.log("API dev server listening on port", process.env.PORT || 3001);
}

start().catch((err) => {
    console.error(err);
    process.exit(1);
});
