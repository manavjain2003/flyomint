// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  //  Next.js version has already moved turbopack out of experimental and into a top-level config key
  turbopack: {},

  allowedDevOrigins: [
    "10.134.0.2",
    "b2cdev.travelsuperhub.com"
  ]
};

export default nextConfig;