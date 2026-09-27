import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // GitHub avatars for the project "Party" lists (fetched in src/lib/github.ts)
    remotePatterns: [{ protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/u/**" }],
  },
};

export default nextConfig;
