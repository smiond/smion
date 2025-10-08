/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Keep unoptimized to avoid requiring next/image optimization on Vercel plan
    unoptimized: true,
  },
}

module.exports = nextConfig