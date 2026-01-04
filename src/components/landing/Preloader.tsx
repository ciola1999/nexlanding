'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function Preloader() {
  const [counter, setCounter] = useState(0);
  const comp = useRef(null); // Ref untuk context GSAP
  
  // Ref untuk elemen yang akan dianimasikan
  const loaderRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
            // Opsional: Code yang jalan setelah preloader selesai
        }
      });

      // 1. Animasi Counter (Angka naik)
      // Kita "nipu" dikit, animasikan object dummy, lalu update state
      const progress = { value: 0 };
      
      tl.to(progress, {
        value: 100,
        duration: 2, // Durasi loading (2 detik)
        ease: "power2.inOut",
        onUpdate: () => {
          // Update angka di layar, bulatkan ke integer
          setCounter(Math.round(progress.value));
        },
      })
      
      // 2. Animasi Keluar (Angka hilang & Tirai naik)
      .to(counterRef.current, {
        opacity: 0,
        duration: 0.5,
      })
      .to(loaderRef.current, {
        yPercent: -100, // Geser ke atas 100%
        duration: 1.2,
        ease: "power4.inOut", // Easing dramatis
      })
      .set(loaderRef.current, {
        display: "none", // Hilangkan dari DOM agar bisa klik elemen di bawahnya
      });

    }, comp); // Scope GSAP ke component ini

    return () => ctx.revert(); // Cleanup
  }, []);

  return (
    <div ref={comp}>
      {/* Container Hitam Full Screen */}
      <div 
        ref={loaderRef}
        className="fixed top-0 left-0 w-full h-screen bg-black z-[99999] flex items-center justify-center"
      >
        {/* Angka Counter */}
        <div 
          ref={counterRef}
          className="text-white text-8xl md:text-9xl font-bold font-mono tracking-tighter"
        >
          {counter}%
        </div>
      </div>
    </div>
  );
}