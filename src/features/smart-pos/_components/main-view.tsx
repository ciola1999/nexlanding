'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
  Store,
  LayoutGrid,
  History,
  LayoutDashboard,
  LucideIcon,
} from 'lucide-react';
import { Toaster } from 'sonner';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Import komponen fitur
import StatusBadge from './status-badge';
import POSInterface from './pos-interface';
import InventoryDashboard from './InventoryDashboard';
import DashboardAnalytics from './DashboardAnalytics';

import { Product } from '../db/schema';

interface NavButtonProps {
  href: string;
  active: boolean;
  icon: LucideIcon;
  label: string;
  special?: boolean;
}

interface SmartPosMainViewProps {
  products: Product[];
  currentView: string | undefined;
}

export default function SmartPosMainView({
  products,
  currentView,
}: SmartPosMainViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Logic view
  const view = currentView || 'dashboard';
  const isPosMode = view === 'cashier';
  const isInventoryMode = view === 'inventory';
  const isDashboardMode = view === 'dashboard';
  const isHistoryMode = view === 'history';

  const totalProducts = products ? products.length : 0;
  const lowStockCount = products
    ? products.filter((p) => p.stock < 20).length
    : 0;

  // --- 1. GSAP Animation Hook ---
  // Setiap kali 'view' berubah, jalankan animasi smooth ini
  useGSAP(
    () => {
      // Kill animasi sebelumnya jika user klik cepat-cepat
      gsap.killTweensOf(containerRef.current);

      // Animasi Masuk: Sedikit geser dari bawah (y: 15) ke posisi asli (y: 0)
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 15, filter: 'blur(5px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.4,
          ease: 'power3.out',
        }
      );
    },
    { dependencies: [view], scope: containerRef }
  ); // Scope penting untuk Next.js cleanup

  // Render Content Switcher
  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <DashboardAnalytics />;
      case 'inventory':
        return (
          <InventoryDashboard
            products={products || []}
            totalProducts={totalProducts}
            lowStockCount={lowStockCount}
          />
        );
      case 'history':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-neutral-500">
            <div className="p-6 bg-white/5 rounded-full mb-4 animate-pulse">
              <History size={48} className="opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Transaction History
            </h3>
            <p className="text-sm">Riwayat transaksi akan muncul di sini.</p>
          </div>
        );
      case 'cashier':
      default:
        return <POSInterface initialProducts={products || []} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1014] text-white selection:bg-[#dfff4f] selection:text-black force-show-cursor">
      <Toaster position="bottom-right" richColors closeButton theme="dark" />

      {/* Navbar (Backdrop Blur diperkuat untuk feel 'Glass') */}
      <div className="bg-[#0f1014]/70 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50 transition-all duration-300">
        {/* Logo Area */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#dfff4f] to-[#b8d63e] rounded-xl shadow-[0_0_20px_rgba(223,255,79,0.2)] flex items-center justify-center text-black font-extrabold text-lg">
            N
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight leading-none">
              NexPOS
            </h1>
            <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
              Smart System
            </span>
          </div>
          <div className="ml-2">
            <StatusBadge />
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex bg-[#18191e] p-1.5 rounded-2xl border border-white/5 gap-1 shadow-2xl shadow-black/50">
          <NavButton
            href="/projects/smart-pos?view=dashboard"
            active={isDashboardMode}
            icon={LayoutDashboard}
            label="Dashboard"
          />
          <NavButton
            href="/projects/smart-pos?view=inventory"
            active={isInventoryMode}
            icon={LayoutGrid}
            label="Inventory"
          />
          <NavButton
            href="/projects/smart-pos?view=history"
            active={isHistoryMode}
            icon={History}
            label="Riwayat"
          />
          <div className="w-px h-6 bg-white/10 mx-1 self-center" />{' '}
          {/* Separator */}
          <NavButton
            href="/projects/smart-pos?view=cashier"
            active={isPosMode}
            icon={Store}
            label="Kasir"
            special
          />
        </div>
      </div>

      {/* Main Content Area */}
      {/* Container Ref dipasang di sini untuk animasi */}
      <div
        ref={containerRef}
        className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-90px)]"
      >
        {renderContent()}
      </div>
    </div>
  );
}

function NavButton({
  href,
  active,
  icon: Icon,
  label,
  special,
}: NavButtonProps) {
  // Base styles
  let containerClass =
    'group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out ';
  const iconClass = 'transition-transform duration-300 group-hover:scale-110';

  if (special && active) {
    containerClass +=
      'bg-[#dfff4f] text-black shadow-[0_0_20px_rgba(223,255,79,0.3)] font-bold';
  } else if (special) {
    containerClass += 'text-[#dfff4f] hover:bg-[#dfff4f]/10';
  } else if (active) {
    containerClass += 'bg-white/10 text-white shadow-inner font-semibold';
  } else {
    containerClass += 'text-gray-400 hover:text-white hover:bg-white/5';
  }

  return (
    // PENTING: scroll={false} mencegah halaman lompat ke atas saat ganti tab
    <Link href={href} scroll={false} className={containerClass}>
      <Icon size={18} className={iconClass} strokeWidth={active ? 2.5 : 2} />
      <span className="hidden md:inline">{label}</span>

      {/* Indikator Active Dot (Micro-interaction) */}
      {active && !special && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full opacity-50" />
      )}
    </Link>
  );
}
