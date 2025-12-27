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
import TiltCard from './ui/tilt-card'; 

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface BentoItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gridClass?: string; 
}

const bentoItems: BentoItemProps[] = [
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
    gridClass: "md:col-span-2", // Card Lebar di bawah
  },
];

export default function BentoGrid() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const items = gsap.utils.toArray<HTMLElement>('.bento-card');

    items.forEach((item, index) => {
      gsap.fromTo(item, 
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          },
          delay: index * 0.1 
        }
      );
    });

  }, { scope: container });

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
              style={{ perspective: "1000px" }}
            >
              <TiltCard 
                // PERBAIKAN DI SINI:
                // 1. justify-between DIHAPUS, diganti flex-col + gap-8 (supaya teks nempel wajar ke icon)
                // 2. p-6 diganti p-8 (supaya lebih lega dari pinggir)
                // 3. items-start (memastikan rata kiri rapi)
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
                  {/* Max Width ditambahkan agar tulisan di card lebar tidak 'memanjang' berlebihan */}
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