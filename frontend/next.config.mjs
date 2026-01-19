import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: [],
  },
  output: 'standalone',
  // Set turbopack root to silence monorepo warnings
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/placeholder-logo.png' }]
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
}

export default nextConfig
