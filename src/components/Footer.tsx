'use client';

import { Github, Twitter, Linkedin, Instagram, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black text-white py-20 px-4 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        
        {/* 1. Header Besar: Call to Action */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-8">
          <div>
            <p className="text-gray-400 mb-4 text-lg">Siap mendominasi pasar?</p>
            <h2 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none group cursor-pointer">
              <span className="group-hover:text-purple-500 transition-colors duration-300">LET&apos;S</span> <br />
              <span className="text-gray-700 group-hover:text-white transition-colors duration-300">WORK.</span>
            </h2>
          </div>
          
          {/* Tombol Email */}
          <a 
            href="mailto:hello@nexlanding.com"
            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-purple-500 hover:text-white transition-all duration-300 group"
          >
            Start a Project
            <ArrowUpRight className="w-5 h-5 group-hover:rotate-45 transition-transform" />
          </a>
        </div>

        {/* 2. Grid Link & Socials */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-t border-white/10 pt-12">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">NexLanding</h3>
            <p className="text-gray-500 max-w-sm">
              Membangun pengalaman digital masa depan dengan teknologi web terkini.
              Bekasi, Indonesia.
            </p>
          </div>

          {/* Sitemaps */}
          <div>
            <h4 className="font-bold mb-4 text-gray-300">Sitemap</h4>
            <ul className="space-y-2 text-gray-500">
              <li><a href="#" className="hover:text-purple-400 transition-colors">Home</a></li>
              <li><a href="#features" className="hover:text-purple-400 transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-purple-400 transition-colors">Pricing</a></li>
              <li><a href="#about" className="hover:text-purple-400 transition-colors">About</a></li>
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h4 className="font-bold mb-4 text-gray-300">Socials</h4>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-purple-500 hover:text-white transition-all"><Github className="w-5 h-5"/></a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-blue-400 hover:text-white transition-all"><Twitter className="w-5 h-5"/></a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-blue-600 hover:text-white transition-all"><Linkedin className="w-5 h-5"/></a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-pink-500 hover:text-white transition-all"><Instagram className="w-5 h-5"/></a>
            </div>
          </div>

        </div>

        {/* 3. Copyright */}
        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
          <p>© 2026 NexLanding Agency. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
}