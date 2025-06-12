/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  serverExternalPackages: ['@prisma/client'],
  experimental: {
    typedRoutes: true
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: '/api/:path*'
        },
        {
          source: '/_next/:path*',
          destination: '/_next/:path*'
        },
        {
          source: '/favicon.ico',
          destination: '/favicon.ico'
        },
        {
          source: '/robots.txt',
          destination: '/robots.txt'
        },
        {
          source: '/',
          destination: '/front/game'
        },
        {
          source: '/:slug((?!_next|api|archive).*)*',
          destination: '/front/game/:slug*'
        }
      ]
    }
  }
}

export default nextConfig; 