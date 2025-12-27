'use client';

import React, { useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue
} from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  rotationRange?: number; // Berapa derajat miring maksimal? (default 20)
}

export default function TiltCard({ 
  children, 
  className = "", 
  rotationRange = 20 
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // 1. Motion Values untuk posisi mouse relatif (0 sampai 1)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // 2. Setup Spring Physics (biar miringnya mulus, tidak patah-patah)
  const springConfig = { damping: 20, stiffness: 200 };
  const mouseXSpring = useSpring(x, springConfig);
  const mouseYSpring = useSpring(y, springConfig);

  // 3. Transformasi: Ubah posisi mouse menjadi derajat rotasi
  // Logic: 
  // Jika mouse di KIRI (-0.5), RotateY jadi negatif (miring ke kiri)
  // Jika mouse di ATAS (-0.5), RotateX jadi positif (miring ke atas)
  const rotateX = useTransform(
    mouseYSpring, 
    [-0.5, 0.5], 
    [rotationRange, -rotationRange]
  );
  
  const rotateY = useTransform(
    mouseXSpring, 
    [-0.5, 0.5], 
    [-rotationRange, rotationRange]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Hitung posisi mouse dalam rentang -0.5 sampai 0.5
    // (0 adalah titik tengah kartu)
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    // Reset rotasi ke 0 saat mouse keluar
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d", // Penting agar elemen child bisa timbul (3D)
      }}
      className={`relative transition-all duration-200 ease-out ${className}`}
    >
      {/* Container ini butuh perspective dari parent atau ditambahkan di sini via style */}
      <div 
        style={{ 
          transform: "translateZ(50px)", // Efek agar konten terasa "melayang" dari background
          transformStyle: "preserve-3d" 
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}