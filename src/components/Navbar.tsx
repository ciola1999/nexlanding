'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import MagneticWrapper from './ui/magnetic-wrapper';

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useGSAP(() => {
    gsap.from(navRef.current, {
      y: -100,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      delay: 0.5
    });
  });

  return (
    <nav 
      ref={navRef}
      className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4"
    >
      <div 
        className="flex items-center gap-8 px-6 py-3 md:px-8 md:py-4 rounded-full border border-white/10 bg-black/60 backdrop-blur-md shadow-2xl shadow-purple-500/10 transition-all duration-300 hover:border-white/30"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        
        {/* 1. Logo juga dikasih Magnet dikit (0.2) biar asik */}
        <MagneticWrapper strength={0.2}>
          <Link href="/" className="text-xl font-bold tracking-tighter flex items-center gap-2 px-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            NexLanding
          </Link>
        </MagneticWrapper>

        {/* 2. Menu Tengah */}
        <div className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-400">
          {['features', 'pricing', 'about'].map((item) => (
            // Note: className dipindah ke dalam Link/span agar area click-nya pas
            <MagneticWrapper key={item} strength={0.3} className="relative group"> 
              <Link 
                href={`#${item}`} 
                className="block px-4 py-2 hover:text-white transition-colors capitalize relative z-10"
              >
                {item}
              </Link>
              {/* Optional: Dot indikator saat hover */}
              <span className="absolute left-1/2 bottom-0 w-1 h-1 bg-white rounded-full -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </MagneticWrapper>
          ))}
        </div>

        {/* 3. Tombol Call to Action - Magnetnya lebih kuat (0.5)! */}
        <MagneticWrapper strength={0.5}>
          <button className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors">
            Book Call
          </button>
        </MagneticWrapper>

      </div>
    </nav>
  );
}