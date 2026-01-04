'use client';

import { useEffect, useRef } from 'react';
import { LenisRef, ReactLenis, useLenis } from 'lenis/react'; // Import khusus v2
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null); // Gunakan any atau tipe LenisRef jika ada

  useEffect(() => {
    // 1. Integrasi GSAP Ticker
    // Kita matikan auto-update Lenis di component (autoRaf={false}),
    // dan paksa update via GSAP agar sinkron.
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);

    // 2. Matikan Lag Smoothing GSAP
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
    };
  }, []);

  // 3. Sinkronisasi ScrollTrigger
  // useLenis adalah hook bawaan v2 untuk mendeteksi scroll event
  useLenis((lenis) => {
    ScrollTrigger.update();
  });

  return (
    // root: memberitahu Lenis untuk meng-handle <html> / window scroll
    // options: konfigurasi scroll
    // autoRaf={false}: PENTING! Kita matikan loop internal Lenis biar digerakkan oleh GSAP
    <ReactLenis
      root
      ref={lenisRef}
      autoRaf={false} 
      options={{
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        // Di v2, properti ini bernama 'vertical' (default), jadi tidak perlu ditulis
        // gestureDirection juga otomatis
        // touchMultiplier defaultnya sudah bagus
        smoothWheel: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}