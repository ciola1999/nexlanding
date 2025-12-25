'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  
  // State untuk efek hover sederhana
  const [isHovered, setIsHovered] = useState(false);

  useGSAP(() => {
    // Animasi: Navbar turun dari atas saat loading
    gsap.from(navRef.current, {
      y: -100, // Dari atas layar
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      delay: 0.5 // Muncul setelah Hero mulai
    });
  });

  return (
    // Container Fixed: Mengunci posisi di layar
    <nav 
      ref={navRef}
      className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4"
    >
      {/* Glassmorphism Box:
        - backdrop-blur-md: Efek buram di belakang kaca
        - bg-black/70: Warna hitam transparan
        - rounded-full: Bentuk pil (Modern UI)
      */}
      <div 
        className="flex items-center gap-8 px-8 py-4 rounded-full border border-white/10 bg-black/60 backdrop-blur-md shadow-2xl shadow-purple-500/10 transition-all duration-300 hover:border-white/30"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        
        {/* Logo Kiri */}
        <Link href="/" className="text-xl font-bold tracking-tighter flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          NexLanding
        </Link>

        {/* Menu Tengah (Hidden di HP, Muncul di Laptop) */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#about" className="hover:text-white transition-colors">About</Link>
        </div>

        {/* Tombol Kanan */}
        <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-transform active:scale-95">
          Book Call
        </button>

      </div>
    </nav>
  );
}