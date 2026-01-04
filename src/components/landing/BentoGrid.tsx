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
} from 'lucide-react';
import TiltCard from '../ui/tilt-card'; 

gsap.registerPlugin(useGSAP, ScrollTrigger);

// ... (Interface dan Array bentoItems TETAP SAMA, tidak perlu diubah) ...
interface BentoItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gridClass?: string; 
}

const bentoItems: BentoItemProps[] = [
  // ... (Data items tetap sama)
  {
    title: "Instant Deploy",
    description: "Deploy proyekmu ke server global dalam hitungan detik dengan CI/CD otomatis.",
    icon: <Rocket className="w-8 h-8 text-blue-400" />,
    gridClass: "md:col-span-2", 
  },
  {
    title: "Global CDN",
    description: "Akses super cepat dari manapun.",
    icon: <Globe className="w-8 h-8 text-green-400" />,
    gridClass: "md:col-span-1",
  },
  {
    title: "AI Analytics",
    description: "Insight bisnis berbasis Artificial Intelligence real-time.",
    icon: <BarChart3 className="w-8 h-8 text-purple-400" />,
    gridClass: "md:col-span-1",
  },
  {
    title: "Bank-Grade Security",
    description: "Data terenkripsi AES-256 bit. Aman dari serangan siber.",
    icon: <ShieldCheck className="w-8 h-8 text-red-400" />,
    gridClass: "md:col-span-1",
  },
  {
    title: "Scalable Infrastructure",
    description: "Siap menampung 1 juta user tanpa down, auto-scaling otomatis.",
    icon: <Cpu className="w-8 h-8 text-yellow-400" />,
    gridClass: "md:col-span-2", 
  },
];

export default function BentoGrid() {
  const container = useRef<HTMLDivElement>(null);

  // --- BAGIAN INI YANG DIUBAH ---
  useGSAP(() => {
    // 1. Inisialisasi MatchMedia
    const mm = gsap.matchMedia();
    const items = gsap.utils.toArray<HTMLElement>('.bento-card');

    // 2. Setup Kondisi DESKTOP (Min-width: 768px)
    mm.add("(min-width: 768px)", () => {
      items.forEach((item, index) => {
        gsap.fromTo(item, 
          { y: 50, opacity: 0 }, // Jarak gerak 50px (lebih dramatis)
          {
            y: 0,
            opacity: 1,
            duration: 0.8, // Durasi smooth
            ease: 'power2.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            },
            delay: index * 0.15 // Stagger (delay antar item) aktif
          }
        );
      });
    });

    // 3. Setup Kondisi MOBILE (Max-width: 767px)
    mm.add("(max-width: 767px)", () => {
      items.forEach((item) => {
        gsap.fromTo(item, 
          { y: 30, opacity: 0 }, // Jarak gerak cuma 30px (biar enteng)
          {
            y: 0,
            opacity: 1,
            duration: 0.5, // Lebih cepat (snappy)
            ease: 'power1.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 90%', // Trigger lebih awal di layar kecil
              toggleActions: 'play none none reverse'
            },
            delay: 0 // MATIKAN STAGGER di mobile agar user tidak menunggu lama saat scroll cepat
          }
        );
      });
    });

    // Tidak perlu mm.revert() manual karena useGSAP sudah mengurusnya saat unmount

  }, { scope: container });
  // --- END PERUBAHAN ---

  return (
    <section ref={container} id="features" className="py-24 px-4 bg-black text-white w-full">
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-gray-100 to-gray-500 bg-clip-text text-transparent mb-4">
            Tech Stack Unggulan
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Kami menggunakan teknologi terbaru standar industri 2026 untuk memastikan performa maksimal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)]">
          {bentoItems.map((item, i) => (
            <div
              key={i}
              className={`bento-card relative z-0 ${item.gridClass || 'md:col-span-1'}`}
              // Hapus style perspective di div pembungkus jika tidak diperlukan oleh TiltCard
            >
              <TiltCard 
                className="w-full h-full bg-neutral-900 rounded-3xl border border-white/10 p-8 flex flex-col gap-8 justify-start items-start group hover:border-white/30 transition-colors duration-300"
                rotationRange={15} 
              >
                {/* Icon */}
                <div className="p-3 bg-white/5 w-fit rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-black/50">
                  {item.icon}
                </div>

                {/* Text Content */}
                <div style={{ transform: "translateZ(20px)" }}> 
                  <h3 className="text-xl font-bold mb-3 text-gray-100 group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors max-w-md">
                    {item.description}
                  </p>
                </div>

              </TiltCard>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}