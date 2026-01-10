import type { Product } from '@/features/smart-pos/db/schema';
import {
  Search,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Package,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { cn, formatPercent, formatRupiah } from '@/lib/utils';
import { PriceEditableCell } from './price-editable-cell';
import { CostEditableCell } from './cost-editable-cell';
import { StockEditableCell } from './stock-editable-cell';
import { StatusToggleCell } from './status-toggle-cell';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

// --- SUB-COMPONENT: SKU COPY BUTTON ---
const SkuBadge = ({ sku }: { sku: string | null }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!sku) return;
    navigator.clipboard.writeText(sku);
    setCopied(true);
    toast.success('SKU disalin ke clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      disabled={!sku}
      className="group/sku flex items-center gap-1.5 text-xs text-gray-500 font-mono hover:text-[#dfff4f] transition-colors cursor-pointer"
      title="Klik untuk salin SKU"
    >
      <span>{sku || 'NO-SKU'}</span>
      {sku && (
        <span className="opacity-0 group-hover/sku:opacity-100 transition-opacity">
          {copied ? <CheckCircle2 size={10} /> : <Copy size={10} />}
        </span>
      )}
    </button>
  );
};

export default function ProductTable({ data }: { data: Product[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-16 border border-dashed border-white/10 rounded-2xl bg-[#18191e]/50 backdrop-blur-sm">
        <div className="p-4 bg-white/5 rounded-full mb-4 ring-1 ring-white/10">
          <Search className="text-gray-500" size={32} />
        </div>
        <h3 className="text-white font-bold text-lg">Data Kosong</h3>
        <p className="text-gray-500 text-sm mt-1 max-w-xs">
          Belum ada produk yang ditambahkan. Mulai tambahkan produk baru
          sekarang.
        </p>
      </div>
    );
  }

  return (
    // Tambahkan max-h-[600px] agar tabel bisa discroll vertikal jika data panjang
    <div className="bg-[#18191e] border border-white/5 rounded-2xl shadow-2xl relative flex flex-col max-h-[calc(100vh-200px)]">
      {/* Container Table dengan Scroll */}
      <div className="overflow-auto custom-scrollbar flex-1 w-full">
        <table className="w-full text-left border-collapse min-w-200">
          {/* STICKY HEADER: Tetap menempel di atas saat scroll ke bawah */}
          <thead className="sticky top-0 z-20 bg-[#18191e] shadow-[0_1px_0_rgba(255,255,255,0.05)]">
            <tr>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest bg-[#18191e]">
                Produk
              </th>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right bg-[#18191e]">
                Harga Pokok
              </th>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right bg-[#18191e]">
                <div
                  className="flex items-center justify-end gap-1 cursor-help"
                  title="Klik harga untuk edit cepat"
                >
                  Harga Jual
                </div>
              </th>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center bg-[#18191e]">
                Margin
              </th>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center bg-[#18191e]">
                Stok Barang
              </th>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center bg-[#18191e]">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {data.map((product) => {
              const cost = Number(product.costPrice);
              const price = product.price;
              const marginPercentage =
                price > 0 ? ((price - cost) / price) * 100 : 0;
              const netProfit = price - cost;

              // Logic Warna Badge (Sama seperti kodemu)
              let badgeColor = '';
              let Icon = TrendingUp;

              if (netProfit < 0) {
                badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
                Icon = TrendingDown;
              } else if (marginPercentage >= 35) {
                badgeColor =
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]';
                Icon = TrendingUp;
              } else if (marginPercentage >= 15) {
                badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                Icon = TrendingUp;
              } else {
                badgeColor =
                  'bg-amber-500/10 text-amber-400 border-amber-500/20';
                Icon = AlertCircle;
              }

              return (
                <tr
                  key={product.id}
                  className="group hover:bg-white/[0.03] transition-colors duration-200"
                >
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      {/* Image Thumbnail */}
                      <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative shrink-0 group-hover:border-white/20 transition-colors">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <Package className="text-gray-600" size={20} />
                        )}
                      </div>

                      {/* Product Info */}
                      <div>
                        <div
                          className="font-bold text-white mb-1 line-clamp-1 max-w-[200px]"
                          title={product.name}
                        >
                          {product.name}
                        </div>
                        {/* Component SKU Copy yang baru */}
                        <SkuBadge sku={product.sku} />
                      </div>
                    </div>
                  </td>

                  <td className="p-5 text-right">
                    <div className="flex justify-end w-full font-mono font-medium text-gray-300">
                      <CostEditableCell id={product.id} initialCost={cost} />
                    </div>
                  </td>

                  <td className="p-5 text-right relative">
                    <div className="flex justify-end">
                      <PriceEditableCell
                        id={product.id}
                        initialPrice={product.price}
                        costPrice={cost}
                      />
                    </div>
                  </td>

                  <td className="p-5">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border',
                          badgeColor
                        )}
                      >
                        <Icon size={12} strokeWidth={3} />
                        {formatPercent(marginPercentage)}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-mono',
                          netProfit < 0 ? 'text-red-500' : 'text-gray-500'
                        )}
                      >
                        {netProfit > 0 ? '+' : ''}
                        {formatRupiah(netProfit)}
                      </span>
                    </div>
                  </td>

                  <td className="p-5 text-center">
                    <span className={cn('flex justify-center')}>
                      <StockEditableCell
                        id={product.id}
                        initialStock={product.stock}
                      />
                    </span>
                  </td>

                  <td className="p-5 text-center">
                    <div className="flex justify-center group/status relative cursor-help">
                      <div className="flex justify-center">
                        {/* 👇 Panggil komponen disini */}
                        <StatusToggleCell
                          id={product.id}
                          initialStatus={product.isActive ?? false} // Handle jika null
                        />
                      </div>
                      {/* Tooltip sederhana saat hover status */}
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/status:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {product.isActive ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
