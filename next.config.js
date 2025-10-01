/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**.supabase.co",
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: "2mb",
        },
    },
    typescript: {
        // Ignore build errors in src.old directory
        ignoreBuildErrors: false,
    },
    eslint: {
        // Ignore src.old directory during build
        ignoreDuringBuilds: false,
        dirs: ["app", "components", "lib", "hooks", "db"],
    },
};

export default nextConfig;
