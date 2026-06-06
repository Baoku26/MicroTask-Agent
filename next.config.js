/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Suppress optional peer dep warnings from MetaMask SDK and WalletConnect
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
      '@react-native-async-storage/async-storage': false,
    }
    return config
  },
}

module.exports = nextConfig
