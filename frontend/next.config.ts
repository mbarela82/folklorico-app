import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // TypeScript errors can still be ignored here
  typescript: {
    ignoreBuildErrors: true,
  },
  // REMOVED 'eslint' block (it causes the error)
};

export default withPWA(nextConfig);
