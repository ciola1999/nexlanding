import type { Product } from '@/features/smart-pos/db/schema';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils'; // Pastikan punya utils cn, atau hapus cn(...) dan pakai string biasa

export type { Product };

// Helper: Format Angka ke Rupiah
const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number);
};

export default function ProductTable({ data }: { data: Product[] }) {
  // State Kosong (Dark Mode Style)
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-white/10 rounded-2xl bg-[#18191e]/50">
        <div className="p-4 bg-white/5 rounded-full mb-4">
          <Search className="text-gray-500" size={32} />
        </div>
        <p className="text-gray-400 font-medium">Belum ada data produk.</p>
        <p className="text-sm text-gray-600 mt-1">
          Klik tombol &apos + 1 Produk Acak &apos di atas untuk mengisi data.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#18191e] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto custom-scrollbar">
        {' '}
        {/* Tambahkan class custom-scrollbar dari globals.css */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">
                Nama Produk
              </th>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">
                SKU
              </th>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">
                Harga
              </th>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                Stok
              </th>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((product) => (
              <tr
                key={product.id}
                className="group hover:bg-white/[0.03] transition-colors duration-200"
              >
                <td className="p-5">
                  <div className="font-medium text-white group-hover:text-[#dfff4f] transition-colors">
                    {product.name}
                  </div>
                  {product.description && (
                    <div className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[200px]">
                      {product.description}
                    </div>
                  )}
                </td>
                <td className="p-5 text-sm text-gray-500 font-mono tracking-wide">
                  {product.sku}
                </td>
                <td className="p-5 text-sm text-white font-medium text-right">
                  {formatRupiah(product.price)}
                </td>
                <td className="p-5 text-center">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                      product.stock < 20
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-[#dfff4f]/10 text-[#dfff4f] border-[#dfff4f]/20'
                    }`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="p-5 text-center">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                      product.isActive
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}
                  >
                    {product.isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    )}
                    {product.isActive ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
