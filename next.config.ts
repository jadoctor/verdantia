import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '7d76c35e78af24.lhr.life', 
    '192.168.18.30',
    'wicked-results-juggle.loca.lt'
  ],
  serverExternalPackages: ['firebase-admin'],
  /* config options here */
};

export default nextConfig;
