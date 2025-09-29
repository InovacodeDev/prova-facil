const { NestFactory } = require("@nestjs/core");
const { FastifyAdapter, NestFastifyApplication } = require("@nestjs/platform-fastify");
const { AppModule } = require("./app.module");

async function bootstrap() {
    const app = await NestFactory.create(NestFastifyApplication, new FastifyAdapter(), { bodyParser: false });
    app.enableCors({ origin: process.env.FRONTEND_URL || "*" });
    await app.init();
    return app.getHttpAdapter().getInstance();
}

module.exports = { bootstrap };
