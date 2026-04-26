/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@fluentui/react-components',
    '@fluentui/react-icons',
    '@griffel/react',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

module.exports = nextConfig
