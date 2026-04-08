/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: process.env.VITE_STRIPE_PUBLIC_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY,
  },
  async redirects() {
    return [
      {
        source: '/signup',
        destination: '/register',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
