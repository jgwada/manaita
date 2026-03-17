import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Next.js 16 experimental option（型定義未追加だが有効）
  experimental: {
    middlewareClientMaxBodySize: '25mb',
  },
};

export default nextConfig;
