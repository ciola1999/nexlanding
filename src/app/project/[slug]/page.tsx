'use client';

import { projects } from "@/app/data/projects";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { motion } from "framer-motion"; // <--- Perbaikan Import (pakai kurung kurawal)
import { use } from "react"; 

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProjectDetail({ params }: PageProps) {
  // 1. Unwrap params (Standar Next.js 15)
  const { slug } = use(params);

  // 2. Cari project
  const project = projects.find((p) => p.slug === slug);

  // 3. Jurus 'as any' supaya TypeScript tidak rewel
  const MotionImage = (motion as any).div;
  const MotionContent = (motion as any).div;

  if (!project) {
    return notFound();
  }

  return (
    <main className="min-h-screen bg-black text-white p-8 md:p-24">
      {/* Tombol Back */}
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-12 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Kiri: Gambar Besar (DENGAN ANIMASI) */}
        {/* Kita ganti div biasa dengan MotionImage + layoutId */}
        <MotionImage 
            layoutId={`image-${project.slug}`} // <--- KUNCI ANIMASINYA DISINI
            className="relative h-[400px] lg:h-[600px] rounded-3xl overflow-hidden border border-white/10 bg-zinc-900"
            transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <Image 
            src={project.image} 
            alt={project.title}
            fill
            className="object-cover"
            priority // Agar gambar loading prioritas
          />
        </MotionImage>

        {/* Kanan: Detail Info (Dikasih efek muncul pelan/Fade In) */}
        <MotionContent 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col justify-center"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="bg-purple-500/20 text-purple-400 px-4 py-1 rounded-full text-sm font-medium border border-purple-500/20">
              {project.category}
            </span>
            {/* Sekarang aman karena data year sudah ada */}
            <span className="text-gray-500">{project.year}</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            {project.title}
          </h1>

          <p className="text-xl text-gray-400 mb-12 leading-relaxed">
            {project.description}
          </p>

          {/* Tech Stack */}
          <div>
            <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-4">Tech Stack</h3>
            <div className="flex flex-wrap gap-3">
              {/* Sekarang aman karena data tech sudah ada */}
              {project.tech?.map((tech: string) => (
                <span key={tech} className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 hover:border-white/30 transition-colors">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </MotionContent>

      </div>
    </main>
  );
}