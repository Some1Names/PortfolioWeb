import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // GitHub avatars for the project "Party" lists (fetched in src/lib/github.ts)
      { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/u/**" },
      // /inspiration covers (src/data/inspiration.ts): TMDB posters and Apple Music artwork
      { protocol: "https", hostname: "media.themoviedb.org", pathname: "/t/p/**" },
      { protocol: "https", hostname: "*.mzstatic.com", pathname: "/image/thumb/**" },
    ],
  },
};

export default nextConfig;
