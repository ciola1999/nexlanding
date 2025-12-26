'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { projects } from "@/app/data/projects"; // Pastikan path ini benar
import { motion } from "framer-motion";

export default function SelectedWork() {
  const MotionImage = (motion as any).div; 

  return (
    <section className="py-32 px-6 md:px-12 bg-black">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <span className="text-purple-500 font-medium tracking-wider text-sm uppercase mb-2 block">
              Selected Work
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Crafting Digital <br />
              <span className="text-gray-500">Masterpieces.</span>
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
              className={`group relative block rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 ${
                index === 0 ? "md:col-span-2 aspect-[2/1]" : "aspect-[4/3]"
              }`}
            >
              <MotionImage
                layoutId={`image-${project.slug}`} // ID UNIK (Magic Key-nya di sini)
                className="w-full h-full relative"
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
              <Image 
                src={project.image}
                alt={project.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              </MotionImage>
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