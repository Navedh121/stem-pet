import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from Supabase storage (used for child avatars if we add them later).
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
