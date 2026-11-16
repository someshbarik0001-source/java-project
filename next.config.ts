import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  reactCompiler: true,
  async rewrites() {
    const javaBackendUrl = process.env.JAVA_BACKEND_URL || "http://127.0.0.1:8080";
    return [
      {
        source: "/api/java/:path*",
        destination: `${javaBackendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
