/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    // Normalize: strip trailing /api/v1 so the env var can be set either way
    const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/api\/v1\/?$/, "")
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBase}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiBase}/uploads/:path*`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${apiBase}/socket.io/:path*`,
      },
    ]
  },
}

export default nextConfig
