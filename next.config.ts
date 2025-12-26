/** @type {import('next').NextConfig} */
const nextConfig = {
  // Config lama (biar deploy Vercel aman)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 👇 INI SOLUSINYA: Daftarkan Unsplash di sini
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Izin resmi buat Unsplash
      },
    ],
  },
};

export default nextConfig;