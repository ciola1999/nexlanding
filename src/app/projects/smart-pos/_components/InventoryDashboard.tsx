'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import Link from 'next/link';
import ProductTable, { Product } from './product-table'; // Sesuaikan path import
import SeedButton from './seed-button'; // Sesuaikan path import
import ResetButton from './reset-button'; // Sesuaikan path import

interface InventoryDashboardProps {
  products: Product[];
  totalProducts: number;
  lowStockCount: number;
}

export default function InventoryDashboard({
  products,
  totalProducts,
  lowStockCount,
}: InventoryDashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 🔥 SETUP GSAP ANIMATION
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 1. Stagger Card Entrance (Blur + Slide Up)
      tl.fromTo(
        '.stat-card',
        { y: 50, opacity: 0, filter: 'blur(10px)' },
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.8,
          stagger: 0.15,
        }
      );

      // 2. Animate Numbers (Counter Effect)
      // Kita animate object dummy val: 0 -> target
      const targets = [
        { el: '#count-total', val: totalProducts },
        { el: '#count-low', val: lowStockCount },
      ];

      targets.forEach((target) => {
        const obj = { value: 0 };
        gsap.to(obj, {
          value: target.val,
          duration: 1.5,
          ease: 'power2.out',
          onUpdate: () => {
            const el = document.querySelector(target.el);
            if (el) el.textContent = Math.round(obj.value).toString();
          },
        });
      });

      // 3. Table Entrance (Delay sedikit biar elegan)
      tl.fromTo(
        '.inventory-section',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 },
        '-=0.4'
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="w-full">
      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Total Products */}
        <div className="stat-card p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Total Produk
            </h2>
            <span className="text-indigo-600 bg-indigo-50 p-2 rounded-lg text-lg">
              📦
            </span>
          </div>
          {/* ID digunakan untuk GSAP Counter Selector */}
          <p
            id="count-total"
            className="text-4xl font-bold text-gray-900 font-mono tracking-tighter"
          >
            0
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Item terdaftar di database
          </p>
        </div>

        {/* Card 2: Low Stock */}
        <div className="stat-card p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Perlu Restock
            </h2>
            <span className="text-orange-600 bg-orange-50 p-2 rounded-lg text-lg">
              ⚠️
            </span>
          </div>
          <p
            id="count-low"
            className={`text-4xl font-bold font-mono tracking-tighter ${
              lowStockCount > 0 ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            0
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Produk dengan stok &lt; 20
          </p>
        </div>

        {/* Card 3: Actions */}
        <div className="stat-card p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Database Action
          </h2>
          <div className="flex flex-col gap-2">
            <SeedButton />
            <ResetButton />
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="inventory-section mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">
            Inventory Produk
          </h2>
        </div>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          <ProductTable data={products || []} />
        </div>
      </div>

      {/* FOOTER LINK */}
      <div className="inventory-section mt-12 pt-6 border-t border-gray-200">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors font-medium group"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">
            &larr;
          </span>
          <span className="ml-2">Kembali ke Halaman Portfolio</span>
        </Link>
      </div>
    </div>
  );
}
