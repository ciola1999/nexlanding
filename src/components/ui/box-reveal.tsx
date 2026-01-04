'use client';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface BoxRevealProps {
  children: ReactNode;
  width?: "fit-content" | "100%";
  boxColor?: string;
  duration?: number;
}

export default function BoxReveal({ children, width = "fit-content", duration = 0.5 }: BoxRevealProps) {
  return (
    <div style={{ position: "relative", width, overflow: "hidden" }}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 75 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate="visible"
        transition={{ duration, ease: "easeOut", delay: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
}