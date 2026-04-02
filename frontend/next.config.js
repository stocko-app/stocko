/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.yahoo.com" },
    ],
  },
};

module.exports = nextConfig;
