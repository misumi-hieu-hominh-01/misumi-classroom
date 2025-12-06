import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow common image hosting domains
    // For other external domains, SafeImage component will use regular img tag
    remotePatterns: [
      {
        protocol: "https",
        hostname: "meaning-book.com",
      },
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
      },
      // Add more common domains here if needed
    ],
  },
};

export default nextConfig;
