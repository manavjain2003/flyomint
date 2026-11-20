import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  turbopack: {},

  allowedDevOrigins: [
    "10.134.0.2",
    "https://b2cdev.travelsuperhub.com"
  ],

  devIndicators: false,

  // Old URLs → the URL structure used by the CMS (also what the CMS sitemap and SEO tags point to).
  async redirects() {
    return [
      { source: "/blogs", destination: "/blog", permanent: true },
      { source: "/support", destination: "/help-center", permanent: true },
      { source: "/contact", destination: "/contact-us", permanent: true },
      { source: "/about", destination: "/about-us", permanent: true },
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      { source: "/terms", destination: "/terms-and-conditions", permanent: true },
      { source: "/refunds", destination: "/payment-and-refund-policy", permanent: true },
    ];
  },
};

export default nextConfig;
