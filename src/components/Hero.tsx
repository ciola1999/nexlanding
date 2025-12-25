'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

// 🔥 1. Definisikan Interface (Kontrak Data)
// Ini bikin VS Code ngasih autocompletion saat komponen dipanggil. Keren kan?
interface HeroProps {
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  ctaText: string;
  onCtaClick?: () => void; // Optional function prop
}

// 🔥 2. Pasang Interface ke Function Component
export default function Hero({ 
  titleLine1, 
  titleLine2, 
  subtitle, 
  ctaText,
  onCtaClick 
}: HeroProps) {
  
  // 🔥 3. Explicit Type untuk useRef (Biar TS tau ini elemen HTML apa)
  // HTMLSectionElement = tag <section>
  // HTMLHeadingElement = tag <h1>
  const container = useRef<HTMLElement>(null);
  
  useGSAP(() => {
    // Safety check: Pastikan elemen ada (Best practice TS)
    if (!container.current) return;

    const tl = gsap.timeline();

    tl.from('.hero-word', {
      y: 100,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'power4.out'
    })
    .fromTo('.hero-btn', 
      { scale: 0.5, opacity: 0 }, // Posisi Awal (Hilang)
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }, // Posisi Akhir (Ukuran Asli/100%)
      '-=0.5'
    );

  }, { scope: container });

  return (
    <section 
      ref={container} 
      className="h-screen w-full flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-black text-white"
    >
      <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6 leading-tight">
        <div className="overflow-hidden">
          {/* Kita render props dari parent */}
          <span className="hero-word inline-block bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            {titleLine1}
          </span>
        </div>
        <div className="overflow-hidden">
          <span className="hero-word inline-block text-white">
            {titleLine2}
          </span>
        </div>
      </h1>

      <div className="overflow-hidden mb-10 max-w-2xl">
        <p className="hero-word text-xl md:text-2xl text-gray-400">
          {subtitle}
        </p>
      </div>

      <button 
        onClick={onCtaClick}
        className="hero-btn px-8 py-4 bg-white text-black text-lg font-bold rounded-full hover:bg-gray-200 transition-transform active:scale-95"
      >
        {ctaText}
      </button>
    </section>
  );
}