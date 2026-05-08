import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '7d76c35e78af24.lhr.life', 
    '192.168.18.30',
    'wicked-results-juggle.loca.lt',
    'tiny-cooks-doubt.loca.lt',
    'some-wings-serve.loca.lt'
  ],
  serverExternalPackages: ['firebase-admin', 'sharp', 'mysql2', 'node-vibrant', 'blurhash', 'exifr'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      }
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
