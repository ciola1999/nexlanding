'use client';

import { motion } from 'framer-motion';
// Kita pakai Icon sebagai pengganti logo perusahaan biar praktis
import { 
  Figma, 
  Github, 
  Framer, 
  Chrome, 
  Slack, 
  Twitter, 
  Instagram, 
  Linkedin 
} from 'lucide-react';

const logos = [
  { name: 'Figma', icon: Figma },
  { name: 'GitHub', icon: Github },
  { name: 'Framer', icon: Framer },
  { name: 'Chrome', icon: Chrome },
  { name: 'Slack', icon: Slack },
  { name: 'Twitter', icon: Twitter },
  { name: 'Instagram', icon: Instagram },
  { name: 'LinkedIn', icon: Linkedin },
];

export default function LogoTicker() {
  return (
    <section className="py-20 bg-black text-white overflow-hidden border-t border-white/10">
      <div className="container mx-auto px-4">
        
        {/* Judul Kecil di atas Ticker */}
        <h3 className="text-center text-sm font-medium text-gray-500 uppercase tracking-widest mb-8">
          Trusted by the world&nbsp;s most innovative teams
        </h3>

        {/* CONTAINER UTAMA DENGAN MASKING GRADIENT */}
        {/* Masking ini yang bikin efek pudar di kiri & kanan */}
        <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          
          <motion.div
            className="flex gap-16 flex-none pr-16"
            // Animasi Geser ke Kiri (-50%)
            animate={{
              translateX: "-50%",
            }}
            transition={{
              duration: 20, // Kecepatan (makin besar makin pelan)
              ease: "linear", // Wajib linear biar gak ada hentakan
              repeat: Infinity, // Ulang terus selamanya
            }}
          >
            {/* TRIK RAHASIA: Render Logo 2 KALI (Double)
               Supaya saat set pertama habis digeser, set kedua langsung nyambung.
               Efeknya jadi "Infinity Loop".
            */}
            {[...logos, ...logos].map((logo, index) => (
              <div 
                key={index} 
                className="flex items-center justify-center gap-2 group cursor-pointer"
              >
                {/* Icon */}
                <logo.icon 
                   className="w-8 h-8 text-gray-500 transition-all duration-300 group-hover:text-white group-hover:scale-110" 
                />
                
                {/* Nama Logo (Optional, kalau mau icon doang hapus span ini) */}
                <span className="text-lg font-semibold text-gray-600 group-hover:text-white transition-colors">
                  {logo.name}
                </span>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
}