/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep production deploys safe: fail build on lint/type errors.
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

export default nextConfig