/** @type {import('next').NextConfig} */

// Detect if running on Raspberry Pi or resource-constrained environment
const isRaspberryPi = process.env.LOCAL_DB_DIR?.includes('/home/pi') || 
                      process.env.NODE_ENV === 'production'

const nextConfig = {
  // Optimize for production and Raspberry Pi
  productionBrowserSourceMaps: false,
  
  // React strict mode (helps catch issues)
  reactStrictMode: true,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache images for 1 year
    minimumCacheTTL: 31536000,
  },

  // Performance optimizations
  compress: true,

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
        ],
      },
    ]
  },

  // Redirect HTTP to HTTPS if in production (optional)
  async redirects() {
    return []
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
}

module.exports = nextConfig
