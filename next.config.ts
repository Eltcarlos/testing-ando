import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set correct workspace root to prevent tracing parent directories
  outputFileTracingRoot: __dirname,

  // Disable source maps in production to reduce build size
  productionBrowserSourceMaps: false,

  // Optimize output file tracing - exclude unused platform-specific binaries
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@swc/core-linux-x64-gnu",
      "node_modules/@swc/core-linux-x64-musl",
      "node_modules/@esbuild/linux-x64",
      "node_modules/webpack/lib",
      "node_modules/webpack/hot",
      "node_modules/@next/swc-darwin-arm64",
      "node_modules/@next/swc-darwin-x64",
      "node_modules/@next/swc-linux-x64-gnu",
      "node_modules/@next/swc-linux-x64-musl",
    ],
  },

  // Ensure critical dependencies are included in standalone output
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/.pnpm/react@*/node_modules/react/**/*",
      "./node_modules/.pnpm/react-dom@*/node_modules/react-dom/**/*",
      "./node_modules/.pnpm/next@*/node_modules/next/dist/**/*",
    ],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.brandfetch.io",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "www.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "logos-world.net",
      },
      {
        protocol: "https",
        hostname: "www.gob.mx",
      },
      {
        protocol: "https",
        hostname: "www.sat.gob.mx",
      },
      {
        protocol: "https",
        hostname: "coparmex.org.mx",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
  },

  // Enable experimental optimizations for smaller bundles
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "recharts",
      "date-fns",
    ],
  },
};

export default nextConfig;
