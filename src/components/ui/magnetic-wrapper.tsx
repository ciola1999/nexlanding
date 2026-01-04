'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

interface MagneticWrapperProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

export default function MagneticWrapper({ 
  children, 
  className = "", 
  strength = 0.5 
}: MagneticWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false); // State untuk simpan status mobile

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Physics: stiffness & damping diatur agar 'kenyal'
  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);

  // --- NEW: Cek kemampuan pointer device saat komponen di-load ---
  useEffect(() => {
    // (pointer: coarse) biasanya berarti layar sentuh (tidak akurat seperti mouse)
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    
    const checkDevice = () => {
      setIsMobile(mediaQuery.matches);
    };

    // Cek awal
    checkDevice();

    // Opsional: Listener jika user mengubah mode input (jarang terjadi tapi best practice)
    mediaQuery.addEventListener("change", checkDevice);
    return () => mediaQuery.removeEventListener("change", checkDevice);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Jika ref null ATAU sedang di mode mobile, hentikan fungsi (jangan gerak)
    if (!ref.current || isMobile) return;

    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();

    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);

    x.set(middleX * strength);
    y.set(middleY * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: xSpring, y: ySpring }}
      className={className}
    >
      {children}
    </motion.div>
  );
}