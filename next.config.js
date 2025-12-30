/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  poweredByHeader: false,
  // 图片优化配置
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // API超时配置（Vercel免费版限制10秒）
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
