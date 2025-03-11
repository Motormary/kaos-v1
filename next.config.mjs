/** @type {import('next').NextConfig} */

const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true, // Displays fetch path + cache
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "192.168.10.132",
        port: '8000',
        pathname: "/assets/**",
        search: "",
      },
    ],
  },
}

export default nextConfig
