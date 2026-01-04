'use client';

import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import MagneticWrapper from '../ui/magnetic-wrapper'; // Ambil dari folder ui
import TextReveal from '../ui/text-reveal'; // Punya KAMU (Word by Word)
import BoxReveal from '../ui/box-reveal';   // Punya SAYA (Slide Up biasa)

// 🔥 1. Interface Tetap Dipertahankan (Good Practice!)
interface HeroProps {
  titleLine1?: string; // Bikin optional biar fleksibel
  titleLine2?: string;
  subtitle?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

export default function Hero({ 
  titleLine1 = "Digital Design", // Default value biar gak error kalau kosong
  titleLine2 = "That Inspires.", 
  subtitle = "We build immersive web experiences that elevate your brand. Fast, smooth, and unforgettable.", 
  ctaText = "Start Project",
  onCtaClick 
}: HeroProps) {
  
  const container = useRef<HTMLElement>(null);
  
  // ❌ Kita HAPUS useGSAP manual di sini.
  // ✅ Kita serahkan tugas animasi ke Component TextReveal & BoxReveal.
  
  return (
    <section 
      ref={container} 
      className="relative min-h-screen w-full flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-black text-white pt-20"
    >
        
      {/* --- A. BACKGROUND GRID (Biar gak sepi) --- */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* --- B. GLOW EFFECT --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />

      {/* --- C. CONTENT (Z-10 biar di atas background) --- */}
      <div className="z-10 flex flex-col items-center gap-6 max-w-5xl">
        
        {/* 1. Label Kecil (Opsional - Tambahan biar manis) */}
        <BoxReveal boxColor="#8b5cf6" duration={0.5}>
           <div className="border border-white/10 bg-white/5 px-4 py-1.5 rounded-full backdrop-blur-sm mb-2 inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium tracking-widest uppercase text-gray-300">
                Available for work
              </span>
           </div>
        </BoxReveal>

        {/* 2. HEADLINE UTAMA (Pakai TextReveal KAMU) */}
        <div className="flex flex-col items-center justify-center -space-y-2 md:-space-y-4">
             {/* Baris 1 */}
             <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-white">
                <TextReveal text={titleLine1} />
             </h1>
             
             {/* Baris 2 - Gradient Style */}
             <h1 className="text-5xl md:text-8xl font-bold tracking-tighter">
                <TextReveal 
                    text={titleLine2} 
                    className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500" 
                />
             </h1>
        </div>

        {/* 3. SUBTITLE (Pakai BoxReveal Simple) */}
        <BoxReveal width="100%" duration={0.7}>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mt-4">
              {subtitle}
            </p>
        </BoxReveal>

        {/* 4. BUTTONS (Pakai Magnetic Wrapper) */}
        <div className="flex flex-col md:flex-row gap-4 mt-8">
            {/* Primary Button */}
            <MagneticWrapper strength={0.3}>
                <button 
                  onClick={onCtaClick}
                  className="group relative flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-all active:scale-95"
                >
                    {ctaText}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </MagneticWrapper>

            {/* Secondary Button */}
            <MagneticWrapper strength={0.3}>
                <button className="px-8 py-4 border border-white/20 rounded-full font-medium text-lg hover:bg-white/10 transition-colors">
                    View Showreel
                </button>
            </MagneticWrapper>
        </div>

      </div>
    </section>
  );
}