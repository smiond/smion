/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove deprecated appDir option
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig