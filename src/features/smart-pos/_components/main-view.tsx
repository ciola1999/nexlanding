import Link from 'next/link';
import { Store, LayoutGrid, History } from 'lucide-react';
import { Toaster } from 'sonner';

// Perbaiki import path sesuai struktur baru (hapus underscore jika folder sudah diubah)
import StatusBadge from './status-badge';
import POSInterface from './pos-interface';
import InventoryDashboard from './InventoryDashboard';
import { Product } from '../db/schema'; // Import type dari schema DB yang baru

interface SmartPosMainViewProps {
  products: Product[]; // Gunakan tipe data asli
  currentView: string | undefined;
}

export default function SmartPosMainView({
  products,
  currentView,
}: SmartPosMainViewProps) {
  const isPosMode = currentView === 'cashier';

  const totalProducts = products ? products.length : 0;
  const lowStockCount = products
    ? products.filter((p) => p.stock < 20).length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-blue-100 selection:text-blue-900 force-show-cursor">
      <Toaster position="bottom-right" richColors closeButton />

      {/* Navbar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50 transition-all">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="text-blue-600">Nex</span>POS
            <StatusBadge />
          </h1>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
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
          {/* Tombol History (BARU) */}
          <Link
            href="/projects/smart-pos/history"
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 transition-all flex items-center gap-2"
          >
            <History size={16} /> Riwayat
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

      {/* Content Area */}
      <div className="p-8 max-w-7xl mx-auto">
        {isPosMode ? (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <POSInterface initialProducts={products || []} />
          </div>
        ) : (
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
