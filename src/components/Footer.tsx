'use client';

import Link from 'next/link';
import { Github, Twitter, Linkedin, Instagram, ArrowUpRight } from 'lucide-react';
import MagneticWrapper from './ui/magnetic-wrapper'; // Import Magnet
import TextReveal from './ui/text-reveal'; // Import Text Reveal

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-black text-white pt-20 pb-10 px-6 md:px-12 overflow-hidden border-t border-white/10">
      
      {/* 1. Background Glow Effect (Ungu halus di tengah) */}
      <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        
        {/* 2. Header Besar: Call to Action */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-12">
          <div>
            <div className="mb-4 text-lg text-gray-400">
               {/* Animasi Text Reveal untuk Tagline */}
               <TextReveal text="Siap mendominasi pasar?" />
            </div>
            
            <h2 className="text-6xl md:text-9xl font-bold tracking-tighter leading-[0.9] group">
              <span className="block group-hover:text-purple-500 transition-colors duration-500">LET&apos;S</span>
              <span className="block text-gray-700 group-hover:text-white transition-colors duration-500">WORK.</span>
            </h2>
          </div>
          
          {/* 3. Tombol Magnetic Besar (Ganti tombol kapsul lama) */}
          <div className="hidden md:block">
            <MagneticWrapper strength={0.5}>
                <a 
                    href="mailto:hello@nexlanding.com"
                    className="flex flex-col items-center justify-center w-40 h-40 bg-white rounded-full text-black group transition-all duration-300 hover:bg-purple-500 hover:text-white"
                >
                    <span className="font-bold text-lg mb-1">Start Now</span>
                    <ArrowUpRight className="w-6 h-6 group-hover:rotate-45 transition-transform duration-300" />
                </a>
            </MagneticWrapper>
          </div>

          {/* Tombol Mobile (Tetap kapsul biar hemat tempat di HP) */}
          <a 
            href="mailto:hello@nexlanding.com"
            className="md:hidden flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-purple-500 hover:text-white transition-all"
          >
             Start a Project <ArrowUpRight className="w-5 h-5" />
          </a>
        </div>

        {/* 4. Grid Link & Socials (Konten asli kamu, dipercantik) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-t border-white/10 pt-16">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-2xl font-bold">NexLanding</h3>
            <p className="text-gray-400 max-w-sm leading-relaxed">
              Membangun pengalaman digital masa depan dengan teknologi web terkini.
              <br />
              <span className="text-purple-400">Bekasi, Indonesia.</span>
            </p>
          </div>

          {/* Sitemaps */}
          <div>
            <h4 className="font-bold mb-6 text-white">Sitemap</h4>
            <ul className="space-y-3 text-gray-400">
              {['Home', 'Features', 'Pricing', 'About'].map((item) => (
                <li key={item}>
                    <Link href={`#${item.toLowerCase()}`} className="hover:text-purple-400 hover:pl-2 transition-all duration-300 block">
                        {item}
                    </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Socials dengan Magnetic Effect */}
          <div>
            <h4 className="font-bold mb-6 text-white">Socials</h4>
            <div className="flex gap-4">
                {[
                    { icon: <Github className="w-5 h-5"/>, href: "#" },
                    { icon: <Twitter className="w-5 h-5"/>, href: "#" },
                    { icon: <Linkedin className="w-5 h-5"/>, href: "#" },
                    { icon: <Instagram className="w-5 h-5"/>, href: "#" }
                ].map((social, idx) => (
                    <MagneticWrapper key={idx} strength={0.3}>
                        <a 
                            href={social.href} 
                            className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-purple-600 hover:text-white transition-all border border-white/5 hover:border-purple-500"
                        >
                            {social.icon}
                        </a>
                    </MagneticWrapper>
                ))}
            </div>
          </div>

        </div>

        {/* 5. Copyright */}
        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
          <p>© {currentYear} NexLanding Agency. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
}