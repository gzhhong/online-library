/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'online-library-133937-9-1334202186.sh.run.tcloudbase.com'
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
      {
        source: '/files/:path*',
        destination: '/api/files/:path*',
      }
    ];
  },
}

module.exports = nextConfig 