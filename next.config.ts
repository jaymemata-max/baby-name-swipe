import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  // Every API route reads the session cookie, so nothing here is statically cacheable.
  experimental: {},
};

export default nextConfig;
