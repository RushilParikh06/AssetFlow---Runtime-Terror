import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // By default Next.js inferred C:\Users\jeeru as the root because of a stray package-lock.json.
    // This explicitly forces it to use the current directory.
    root: process.cwd(),
  },
};

export default nextConfig;
