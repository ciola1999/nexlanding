'use client';
import { motion, Variants } from 'framer-motion';

// 1. Konfigurasi Animasi Container (Pengatur Urutan)
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      // Ini kuncinya: Memberi jeda 0.08 detik sebelum memunculkan anak berikutnya
      staggerChildren: 0.08,
    }
  }
};

// 2. Konfigurasi Animasi Kata (Anak)
const wordVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40, // Posisi awal: di bawah sejauh 40px
    rotate: 10, // Sedikit miring biar dramatis
    filter: "blur(10px)", // Efek blur saat belum muncul
  },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 0,
    filter: "blur(0px)",
    transition: {
      // Menggunakan fisika pegas (spring) biar gerakannya luwes
      type: "spring",
      damping: 20,
      stiffness: 100,
    }
  }
};

interface TextRevealProps {
  text: string; // Teks yang mau dianimasikan
  className?: string; // Untuk tambahan style (misal: warna text-gray-500)
}

export default function TextReveal({ text, className = "" }: TextRevealProps) {
  // Pecah kalimat menjadi array kata-kata
  const words = text.split(" ");

  // Kita gunakan 'motion.span' dengan display 'inline-flex' agar bisa dibungkus di dalam <h1>/<h2>
  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      // viewport: trigger saat 50% elemen masuk layar, dan hanya sekali main (once: true)
      viewport={{ once: true, amount: 0.5 }}
      className={`inline-flex flex-wrap ${className}`}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={wordVariants}
          // 'inline-block' PENTING agar properti transform (y dan rotate) berfungsi
          // 'mr-[0.25em]' memberi spasi alami antar kata
          // 'whitespace-nowrap' menjaga agar satu kata tidak terpotong
          className="inline-block mr-[0.25em] whitespace-nowrap origin-top-left"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}