'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { projects } from "@/app/(portfolio)/data/projects";
import { motion } from "framer-motion";
import TextReveal from "../ui/text-reveal";

// --- NEW: Import GSAP Modules ---
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// --- NEW: Register Plugin ---
gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function SelectedWork() {
  // --- NEW: Ref untuk container scope ---
  const containerRef = useRef<HTMLElement>(null);

  // --- NEW: Implementasi Animation Logic ---
  useGSAP(() => {
    const mm = gsap.matchMedia();
    const cards = gsap.utils.toArray<HTMLElement>('.project-card');

    // 1. DESKTOP SETUP (Min-width: 768px)
    mm.add("(min-width: 768px)", () => {
      cards.forEach((card, i) => {
        gsap.fromTo(card,
          { 
            y: 80, // Jarak gerak cukup jauh (dramatis)
            opacity: 0,
            scale: 0.95 // Sedikit efek zoom-in
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%", // Mulai saat elemen masuk 85% dari atas viewport
              toggleActions: "play none none reverse"
            },
            delay: i % 2 === 0 ? 0 : 0.2 // Stagger manual: Card kanan muncul lebih lambat dikit dari card kiri
          }
        );
      });
    });

    // 2. MOBILE SETUP (Max-width: 767px)
    mm.add("(max-width: 767px)", () => {
      cards.forEach((card) => {
        gsap.fromTo(card,
          { 
            y: 30, // Jarak pendek (supaya enteng render-nya)
            opacity: 0 
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.5, // Cepat (Snappy)
            ease: "power1.out",
            scrollTrigger: {
              trigger: card,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
            // Tidak ada delay/stagger di mobile agar responsif
          }
        );
      });
    });

  }, { scope: containerRef });
  // ----------------------------------------

  return (
    // Tambahkan ref={containerRef} di section utama
    <section ref={containerRef} className="py-32 px-6 md:px-12 bg-black">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-6">
          <div className="text-center md:text-left">
            <span className="text-purple-500 font-medium tracking-wider text-sm uppercase mb-2 block">
              Selected Work
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              <TextReveal text="Crafting Digital" />
              <br />
              <TextReveal text="Masterpieces." className="text-gray-500" />
            </h2>
          </div>

          <Link 
            href="/projects" 
            className="hidden md:flex items-center gap-2 text-white border-b border-white/20 pb-1 hover:border-white transition-colors"
          >
            View All Works <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid Project */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <Link 
              key={project.id}
              href={`/project/${project.slug}`}
              // --- PENTING: Tambahkan class 'project-card' di sini agar GSAP bisa menemukannya ---
              className={`project-card group relative block rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 ${
                index === 0 ? "md:col-span-2 aspect-[2/1]" : "aspect-[4/3]"
              }`}
            >
              <motion.div
                layoutId={`image-${project.slug}`} 
                className="w-full h-full relative"
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
              <Image 
                src={project.image}
                alt={project.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              </motion.div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              
              <div className="absolute bottom-0 left-0 p-8 w-full flex justify-between items-end">
                <div>
                  <span className="text-purple-400 text-xs font-medium px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full mb-3 inline-block">
                    {project.category}
                  </span>
                  <h3 className="text-2xl md:text-4xl font-bold text-white mb-2">
                    {project.title}
                  </h3>
                  <p className="text-gray-300 text-sm md:text-base max-w-md line-clamp-2">
                    {project.description}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <ArrowUpRight className="w-5 h-5 text-black" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile Button */}
        <div className="mt-12 md:hidden text-center">
            <Link 
            href="/projects" 
            className="inline-flex items-center gap-2 text-white border-b border-white/20 pb-1"
          >
            View All Works <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}