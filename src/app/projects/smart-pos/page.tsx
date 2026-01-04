import Link from 'next/link';
import { getProducts } from '@/actions/products'; // Import Server Action
import StatusBadge from './_components/status-badge';
import SeedButton from './_components/seed-button';
import ProductTable from './_components/product-table';
import ResetButton from './_components/reset-button';

// Ubah function menjadi ASYNC karena kita memanggil database
export default async function PosPage() {
  // 1. Fetch data dari database (Server-side)
  const { data: products } = await getProducts();

  // 2. Hitung statistik sederhana untuk Widget
  const totalProducts = products ? products.length : 0;
  const lowStockCount = products
    ? products.filter((p) => p.stock < 20).length
    : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/30">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Smart POS Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Sistem Manajemen Kasir & Inventory
          </p>
        </div>
        <StatusBadge />
      </div>

      {/* Grid Widget (Statistik & Action) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Widget 1: Total Produk */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Total Produk
            </h2>
            <span className="text-indigo-600 bg-indigo-50 p-2 rounded-lg">
              📦
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
          <p className="text-xs text-gray-400 mt-1">
            Item terdaftar di database
          </p>
        </div>

        {/* Widget 2: Stok Menipis */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Perlu Restock
            </h2>
            <span className="text-orange-600 bg-orange-50 p-2 rounded-lg">
              ⚠️
            </span>
          </div>
          <p
            className={`text-3xl font-bold ${
              lowStockCount > 0 ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {lowStockCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Produk dengan stok &lt; 20
          </p>
        </div>

        {/* Widget 3: Action Panel (Seed Button) */}
        <div className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Database Action
          </h2>
          <SeedButton />
          <ResetButton />
        </div>
      </div>

      {/* Section Tabel Inventory */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Inventory Produk</h2>
        </div>

        {/* Render Tabel dengan data yang sudah di-fetch */}
        <ProductTable data={products || []} />
      </div>

      {/* Footer Link */}
      <div className="mt-12 pt-6 border-t border-gray-200">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors font-medium"
        >
          &larr; Kembali ke Halaman Portfolio
        </Link>
      </div>
    </div>
  );
}
