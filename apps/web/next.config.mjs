/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@invoice/invoice-core'],
  // Only NEXT_PUBLIC_API_URL allowed per spec
};

export default nextConfig;
