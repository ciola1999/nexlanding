'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Zap, 
  ShieldCheck, 
  BarChart3, 
  Globe, 
  Cpu, 
  Rocket 
} from 'lucide-react'; // Import ikon keren

// Register plugin ScrollTrigger agar animasi jalan saat discroll
gsap.registerPlugin(useGSAP, ScrollTrigger);

// 1. Definisikan Tipe Data untuk Kotak Bento
interface BentoItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string; // Opsional: untuk mengatur lebar kotak (col-span)
}

// 2. Data Dummy (Konten Website)
const bentoItems: BentoItemProps[] = [
  {
    title: "Instant Deploy",
    description: "Deploy proyekmu ke server global dalam hitungan detik dengan CI/CD otomatis.",
    icon: <Rocket className="w-8 h-8 text-blue-400" />,
    className: "md:col-span-2 bg-neutral-900", // 👈 Kotak Lebar (Makan 2 kolom)
  },
  {
    title: "Global CDN",
    description: "Akses super cepat dari manapun.",
    icon: <Globe className="w-8 h-8 text-green-400" />,
    className: "md:col-span-1 bg-neutral-900", // Kotak Kecil
  },
  {
    title: "AI Analytics",
    description: "Insight bisnis berbasis Artificial Intelligence real-time.",
    icon: <BarChart3 className="w-8 h-8 text-purple-400" />,
    className: "md:col-span-1 bg-neutral-900",
  },
  {
    title: "Bank-Grade Security",
    description: "Data terenkripsi AES-256 bit. Aman dari serangan siber.",
    icon: <ShieldCheck className="w-8 h-8 text-red-400" />,
    className: "md:col-span-1 bg-neutral-900",
  },
  {
    title: "Scalable Infrastructure",
    description: "Siap menampung 1 juta user tanpa down, auto-scaling otomatis.",
    icon: <Cpu className="w-8 h-8 text-yellow-400" />,
    className: "md:col-span-2 bg-neutral-900", // 👈 Kotak Lebar di bawah
  },
];

export default function BentoGrid() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Animasi: Muncul satu per satu saat di-scroll
    const items = gsap.utils.toArray<HTMLElement>('.bento-card');

    items.forEach((item, index) => {
      gsap.fromTo(item, 
        { 
          y: 50, 
          opacity: 0 
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: item, // Animasi mulai saat elemen ini masuk layar
            start: 'top 85%', // Mulai saat bagian atas elemen menyentuh 85% tinggi layar
            toggleActions: 'play none none reverse' // Kalau discroll balik, animasi mundur
          },
          delay: index * 0.1 // Sedikit delay biar munculnya berurutan (cascade)
        }
      );
    });

  }, { scope: container });

  return (
    <section ref={container} id="features" className="py-24 px-4 bg-black text-white w-full">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-gray-100 to-gray-500 bg-clip-text text-transparent mb-4">
            Tech Stack Unggulan
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Kami menggunakan teknologi terbaru standar industri 2026 untuk memastikan performa maksimal.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(180px,auto)]">
          {bentoItems.map((item, i) => (
            <div
              key={i}
              className={`bento-card group relative flex flex-col justify-between p-6 rounded-3xl border border-white/10 hover:border-white/30 hover:bg-neutral-800/50 transition-all duration-300 ${item.className}`}
            >
              {/* Icon floating */}
              <div className="mb-4 p-3 bg-white/5 w-fit rounded-xl group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>

              {/* Text Content */}
              <div>
                <h3 className="text-xl font-bold mb-2 text-gray-100 group-hover:text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}