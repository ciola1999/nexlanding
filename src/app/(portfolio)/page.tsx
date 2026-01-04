'use client'; // Client component karena kita mau pass function onClick

import Hero from '@/components/landing/Hero';
import BentoGrid from '@/components/landing/BentoGrid';
import Pricing from '@/components/landing/Pricing';
import Footer from '@/components/landing/Footer';
import SelectedWork from '@/components/landing/SelectedWork';
import LogoTicker from '@/components/landing/LogoTicker';

export default function Home() {
  
  // Function handle click (contoh logic)
  const handleStartProject = () => {
    console.log("User mau mulai project!");
    // Nanti bisa diarahkan ke scroll section atau halaman kontak
  };

  return (
    <main>
      {/* Coba arahkan mouse ke <Hero /> dan tekan Ctrl+Spasi.
        VS Code bakal kasih tau properti apa aja yang WAJIB diisi.
      */}
      <Hero 
        titleLine1="Freelance"
        titleLine2="Mastery 2026"
        subtitle="Membangun sistem manajemen bisnis dengan teknologi Next.js, AI, dan animasi kelas dunia."
        ctaText="Lihat Portofolio"
        onCtaClick={handleStartProject}
      />

      <LogoTicker />

      <BentoGrid />

      <SelectedWork />

      <Pricing />

      <Footer />
    </main>
  );
}