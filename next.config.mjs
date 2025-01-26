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
          source: '/',
          destination: '/front/game'
        },
        {
          source: '/archive',
          destination: '/front/archive'
        },
        {
          source: '/archive/:month',
          destination: '/front/archive/:month'
        },
        {
          source: '/:date',
          destination: '/front/game/:date'
        }
      ]
    }
  }
}

export default nextConfig; 