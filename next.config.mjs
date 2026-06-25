/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // wagmi/walletconnect pull in some optional native deps (e.g. pino-pretty)
  // that are not needed in the browser. Silence the webpack warnings.
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // @metamask/sdk imports a React Native-only storage module that doesn't
    // exist in a web build. Mark it optional so it's ignored in the browser.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
    };
    return config;
  },
};

export default nextConfig;
