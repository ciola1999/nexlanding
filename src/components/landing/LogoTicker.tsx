'use client';

import { motion } from 'framer-motion';
// Import MagneticWrapper (sesuaikan path-nya jika beda folder)
import MagneticWrapper from '../ui/magnetic-wrapper';

import {
  Figma,
  Github,
  Framer,
  Chrome,
  Slack,
  Twitter,
  Instagram,
  Linkedin,
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
        <h3 className="text-center text-sm font-medium text-gray-500 uppercase tracking-widest mb-8">
          Trusted by the world&nbsp;s most innovative teams
        </h3>

        <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <motion.div
            className="flex gap-16 flex-none pr-16"
            animate={{
              translateX: '-50%',
            }}
            transition={{
              duration: 20,
              ease: 'linear',
              repeat: Infinity,
            }}
          >
            {[...logos, ...logos].map((logo, index) => (
              // 👇 PERUBAHAN DI SINI
              // 1. Ganti <div> biasa dengan <MagneticWrapper>
              // 2. Pindahkan key={index} ke wrapper ini
              // 3. Pindahkan className (flex, group, dll) ke wrapper ini
              <MagneticWrapper
                key={index}
                className="flex items-center justify-center gap-2 group cursor-pointer"
                strength={0.4} // Opsional: atur kekuatan magnet (0.1 - 1)
              >
                {/* Icon */}
                <logo.icon className="w-8 h-8 text-gray-500 transition-all duration-300 group-hover:text-white group-hover:scale-110" />

                {/* Nama Logo */}
                <span className="text-lg font-semibold text-gray-600 group-hover:text-white transition-colors">
                  {logo.name}
                </span>
              </MagneticWrapper>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
