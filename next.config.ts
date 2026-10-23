import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  turbopack: {},

  allowedDevOrigins: [
    "10.134.0.2",
    "https://b2cdev.travelsuperhub.com"
  ],

  devIndicators: false,
};

export default nextConfig;