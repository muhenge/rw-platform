import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // This option allows TypeScript errors to be ignored during the build process.
    // It is useful for development but should be used with caution in production.
    ignoreBuildErrors: true,
  },

  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

};

export default nextConfig;
