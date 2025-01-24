/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  serverExternalPackages: ['@prisma/client'],
  experimental: {
    typedRoutes: true
  }
}

export default nextConfig; 