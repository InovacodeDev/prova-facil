// This serverless loader expects a compiled Nest (Fastify) app at ../dist/main.js
// after running `pnpm --filter @prova-facil/api run build`.
// Export a function that bootstraps the compiled Nest app on first request and forwards requests to it.
let bootstrap;
try {
    const distPath = require.resolve("../dist/main.js");
    const { bootstrap: nestBootstrap } = require(distPath);
    bootstrap = nestBootstrap;
    console.log("Using compiled NestJS app at ../dist/main.js");
} catch (e) {
    // Do NOT fallback to Express — fail loudly so deploy/build issues are obvious.
    console.error(
        "Compiled Nest app not found at ../dist/main.js. Build the API (pnpm --filter @prova-facil/api run build) before deploying.",
        e.message || e
    );
}

if (!bootstrap) {
    // Export a handler that returns a 500 with actionable message when compiled Nest is missing
    module.exports = async (_req, res) => {
        res.statusCode = 500;
        res.setHeader("content-type", "application/json");
        res.end(
            JSON.stringify({
                error: "Compiled Nest app not found. Run 'pnpm --filter @prova-facil/api run build' to produce ../dist/main.js",
            })
        );
    };
} else {
    let appInstance;
    module.exports = async (req, res) => {
        try {
            if (!appInstance) {
                const fastify = await bootstrap();
                appInstance = fastify;
            }
            return appInstance.server.emit("request", req, res);
        } catch (err) {
            console.error("Nest bootstrap error", err);
            res.statusCode = 500;
            res.end("Internal Server Error");
        }
    };
}
