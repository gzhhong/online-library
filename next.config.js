/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'online-library-133937-9-1334202186.sh.run.tcloudbase.com'
    ]
  },
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    },
    responseLimit: '50mb'
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
      {
        // 为上传的文件提供静态文件服务
        source: '/files/:path*',
        destination: '/api/files/:path*',
      }
    ];
  },
}

module.exports = nextConfig 