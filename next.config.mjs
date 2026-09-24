/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Journal CSV imports on the complaints page go through a server action.
    serverActions: { bodySizeLimit: '5mb' },
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
