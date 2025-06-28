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
          source: '/:slug((?!_next|api|archive|front).*)*',
          destination: '/front/game/:slug*'
        },
        {
          source: '/archive',
          destination: '/front/archive'
        },
        {
          source: '/archive/:month*',
          destination: '/front/archive/:month*'
        }
      ]
    }
  }
}

export default nextConfig; 