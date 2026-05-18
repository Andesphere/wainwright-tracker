import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
  transpilePackages: ["@wainwrights/backend", "@wainwrights/catalog"],
};

export default nextConfig;
