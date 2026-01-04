'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    // 1. Setup posisi awal di tengah biar nggak kaget
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });

    // 2. Gunakan quickTo untuk performa maksimal (super smooth)
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.6, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.6, ease: "power3" });

    // 3. Listener Gerakan Mouse
    const moveCursor = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    // 4. Deteksi Hover pada elemen interaktif
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Cek apakah elemen yang di-hover adalah link, button, atau punya class 'hover-trigger'
      if (
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button' ||
        target.closest('a') || // Handle jika hover icon di dalam link
        target.closest('button') ||
        target.classList.contains('hover-trigger')
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver); // Pakai mouseover untuk mendeteksi elemen

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  // Animasi Scale saat Hover state berubah
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    if (isHovered) {
      // Membesar saat hover link
      gsap.to(cursor, { 
        scale: 3, // Ukuran membesar 3x
        backgroundColor: "rgba(255, 255, 255, 1)", // Jadi solid white (opsional)
        duration: 0.3 
      });
    } else {
      // Kembali normal
      gsap.to(cursor, { 
        scale: 1, 
        backgroundColor: "white", 
        duration: 0.3 
      });
    }
  }, [isHovered]);

  return (
    <div 
      ref={cursorRef}
      className="fixed top-0 left-0 w-4 h-4 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference custom-cursor-element"
      // mix-blend-difference membuat kursor berubah warna otomatis (putih di background hitam, hitam di background putih)
    />
  );
}