/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 配置API路由前缀
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