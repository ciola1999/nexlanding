/** @type {import('next').NextConfig} */
const nextConfig = {
  // Config lama (biar deploy Vercel aman)
  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '1mb', // <--- Di sini tempatnya
    },
  },

  // Config Images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com', // Kadang unsplash pakai subdomain ini juga
      },
      // 👇 Tambahkan domain Supabase project kamu
      {
        protocol: 'https',
        hostname: 'egzgoewvdgqukeschevz.supabase.co', // ⚠️ GANTI INI dengan hostname dari SUPABASE_URL kamu
      },
    ],
  },
};

export default nextConfig;
