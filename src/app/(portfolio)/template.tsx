// app/template.tsx
'use client';

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  
  // Kita pakai jurus 'as any' lagi biar TypeScript tidak rewel

  return (
    <motion.div
      // Posisi Awal: Sedikit di bawah (y: 20) dan transparan (opacity: 0)
      initial={{ y: 20, opacity: 0 }}
      
      // Posisi Akhir: Kembali ke posisi normal (y: 0) dan jelas (opacity: 1)
      animate={{ y: 0, opacity: 1 }}
      
      // Durasi: 0.75 detik (agak lambat biar elegan/cinematic)
      transition={{ ease: "easeInOut", duration: 0.75 }}
    >
      {children}
    </motion.div>
  );
}