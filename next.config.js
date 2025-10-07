/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    unoptimized: false, // Permitir otimização
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  typescript: {
    // Ignore build errors in src.old directory
    ignoreBuildErrors: false,
  },
  eslint: {
    // Ignore src.old directory during build
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'lib', 'hooks', 'db'],
  },
  webpack: (config, { isServer }) => {
    // Configuração para pdfjs-dist funcionar corretamente no client-side
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
        encoding: false,
      };
    }

    // Suprimir warnings de dependências críticas do Genkit/Express/OpenTelemetry
    config.ignoreWarnings = [
      { module: /node_modules\/express\/lib\/view\.js/ },
      { module: /node_modules\/require-in-the-middle\/index\.js/ },
      { message: /Critical dependency: the request of a dependency is an expression/ },
      { message: /Critical dependency: require function is used in a way/ },
    ];

    return config;
  },
};

export default nextConfig;
