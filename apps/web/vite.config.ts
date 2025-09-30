import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
    const root = path.resolve(__dirname, "..", "..");
    const env = loadEnv(mode, root);
    const apiUrl = env.API_URL || env.API_URL || "http://localhost:8801";

    return {
        envDir: root,
        server: {
            host: "::",
            port: env.API_PORT ? parseInt(env.API_PORT, 10) : 8800,
            proxy: {
                "/api": {
                    target: apiUrl,
                    changeOrigin: true,
                    secure: false,
                    rewrite: (p) => p,
                },
            },
        },
        plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
    };
});
