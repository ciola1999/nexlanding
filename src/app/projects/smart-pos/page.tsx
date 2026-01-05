// src/app/projects/smart-pos/page.tsx

import Link from 'next/link';
import { getProducts } from '@/app/projects/smart-pos/_actions/products';
import StatusBadge from './_components/status-badge';
import POSInterface from './_components/pos-interface';
// 👇 Import Component Baru
import InventoryDashboard from './_components/InventoryDashboard';
import { Store, LayoutGrid } from 'lucide-react';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Kasir - NexLanding POS',
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function PosPage({ searchParams }: Props) {
  const { data: products } = await getProducts();
  const params = await searchParams;
  const isPosMode = params.view === 'cashier';

  const totalProducts = products ? products.length : 0;
  const lowStockCount = products
    ? products.filter((p) => p.stock < 20).length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50/30 selection:bg-blue-100 selection:text-blue-900">
      <Toaster position="bottom-right" richColors closeButton />

      {/* Navbar - Sticky & Glass Effect for Modern Feel */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50 transition-all">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="text-blue-600">Nex</span>POS
            <StatusBadge />
          </h1>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <Link
            href="/projects/smart-pos?view=inventory"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              !isPosMode
                ? 'bg-white text-gray-900 shadow-sm font-bold scale-100'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            <LayoutGrid size={16} /> Inventory
          </Link>
          <Link
            href="/projects/smart-pos?view=cashier"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              isPosMode
                ? 'bg-blue-600 text-white shadow-sm font-bold scale-100'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            <Store size={16} /> Mode Kasir
          </Link>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        {isPosMode ? (
          // Jika kamu mau POSInterface juga dianimasikan, bungkus dia dengan wrapper client component serupa
          // Untuk sekarang kita pakai animasi CSS standar dulu
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <POSInterface initialProducts={products || []} />
          </div>
        ) : (
          // 👇 INI BAGIAN MODERN-NYA
          <InventoryDashboard
            products={products || []}
            totalProducts={totalProducts}
            lowStockCount={lowStockCount}
          />
        )}
      </div>
    </div>
  );
}
