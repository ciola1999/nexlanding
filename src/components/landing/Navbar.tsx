'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Untuk auto-close menu
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { motion, AnimatePresence, Variants } from 'framer-motion'; // Tambah ini
import { Menu, X } from 'lucide-react'; // Tambah Icon
import MagneticWrapper from '../ui/magnetic-wrapper';

// --- VARIANTS UNTUK MOBILE MENU ---
const menuVars: Variants = {
  initial: { 
    scaleY: 0 
  },
  animate: { 
    scaleY: 1, 
    transition: { 
      duration: 0.5, 
      // Menggunakan 'as const' atau casting tuple agar TS tidak bingung
      ease: [0.12, 0, 0.39, 0] as [number, number, number, number] 
    }
  },
  exit: { 
    scaleY: 0,
    transition: { 
      duration: 0.5, 
      delay: 0.5, 
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number] 
    }
  }
};

const linkVars: Variants = {
  initial: { 
    y: "30vh", 
    transition: { 
      duration: 0.5, 
      ease: [0.37, 0, 0.63, 1] as [number, number, number, number] 
    } 
  },
  open: { 
    y: 0, 
    transition: { 
      ease: [0, 0.55, 0.45, 1] as [number, number, number, number], 
      duration: 0.7 
    } 
  }
};

const containerVars: Variants = {
  initial: { 
    transition: { 
      staggerChildren: 0.09, 
      staggerDirection: -1 
    } 
  },
  open: { 
    transition: { 
      delayChildren: 0.3, 
      staggerChildren: 0.09, 
      staggerDirection: 1 
    } 
  }
};

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // State Menu Mobile
  const pathname = usePathname();

  // 1. Reset menu saat pindah halaman
  useEffect(() => {
    // HANYA tutup jika menu sedang terbuka (mencegah render berulang yang tidak perlu)
    if (isOpen) {
      setIsOpen(false);
    }
    // Kita disable rule 'exhaustive-deps' di baris ini karena kita 
    // TIDAK ingin 'isOpen' masuk ke dependency array (nanti menu malah auto-close pas dibuka)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // 2. Disable scroll saat menu terbuka
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
  }, [isOpen]);

  // 3. GSAP Entrance Animation (Tetap Dipertahankan)
  useGSAP(() => {
    gsap.from(navRef.current, {
      y: -100,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      delay: 0.5
    });
  });

  const menuItems = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
  ];

  return (
    <>
      <nav 
        ref={navRef}
        className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4"
      >
        <div 
          className="flex items-center gap-4 md:gap-8 px-5 py-3 md:px-8 md:py-4 rounded-full border border-white/10 bg-black/80 backdrop-blur-md shadow-2xl shadow-purple-500/10 transition-all duration-300 hover:border-white/30 relative z-50"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          
          {/* --- LOGO --- */}
          <MagneticWrapper strength={0.2}>
            <Link href="/" className="text-lg md:text-xl font-bold tracking-tighter flex items-center gap-2 px-2 z-50 relative">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              NexLanding
            </Link>
          </MagneticWrapper>

          {/* --- DESKTOP MENU (Hidden di Mobile) --- */}
          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-400">
            {menuItems.map((item) => (
              <MagneticWrapper key={item.label} strength={0.3} className="relative group"> 
                <Link 
                  href={item.href} 
                  className="block px-4 py-2 hover:text-white transition-colors capitalize relative z-10"
                >
                  {item.label}
                </Link>
                <span className="absolute left-1/2 bottom-0 w-1 h-1 bg-white rounded-full -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </MagneticWrapper>
            ))}
          </div>

          {/* --- CTA BUTTON (Desktop Only) --- */}
          <div className="hidden md:block">
            <MagneticWrapper strength={0.5}>
              <button className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors">
                Book Call
              </button>
            </MagneticWrapper>
          </div>

          {/* --- MOBILE HAMBURGER (Visible Mobile Only) --- */}
          <div className="md:hidden flex items-center">
             <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-2 text-white focus:outline-none"
             >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
             </button>
          </div>

        </div>
      </nav>

      {/* --- FULLSCREEN OVERLAY MENU --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVars}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed left-0 top-0 w-full h-screen bg-black origin-top flex flex-col justify-center items-center z-40"
          >
            <motion.div
              variants={containerVars}
              initial="initial"
              animate="open"
              exit="initial"
              className="flex flex-col gap-8 text-center"
            >
              {menuItems.map((item, index) => (
                <div key={index} className="overflow-hidden">
                  <motion.div variants={linkVars}>
                    <Link 
                      href={item.href} 
                      onClick={() => setIsOpen(false)} // Tutup menu saat klik
                      className="text-5xl font-bold text-white hover:text-blue-500 transition-colors tracking-tighter"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                </div>
              ))}

              {/* Mobile CTA (Karena di navbar disembunyikan) */}
              <div className="overflow-hidden mt-4">
                  <motion.div variants={linkVars}>
                     <button
                     onClick={() => setIsOpen(false)} 
                     className="text-xl font-medium text-gray-400 border border-white/20 px-8 py-3 rounded-full hover:bg-white hover:text-black transition-all">
                        Book a Call
                     </button>
                  </motion.div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}