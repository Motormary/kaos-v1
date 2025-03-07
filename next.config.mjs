/** @type {import('next').NextConfig} */

const nextConfig = {
    logging: {
        fetches: {
          fullUrl: true, // Displays fetch path + cache
        },
      },
};

export default nextConfig;
