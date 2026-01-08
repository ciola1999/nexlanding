import type { Product } from '@/features/smart-pos/db/schema';
import {
  Search,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
// IMPORT COMPONENT BARU
import { PriceEditableCell } from './price-editable-cell';
import { CostEditableCell } from './cost-editable-cell';

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(number);
};

const formatPercent = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(number / 100);
};

export default function ProductTable({ data }: { data: Product[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-white/10 rounded-2xl bg-[#18191e]/50 backdrop-blur-sm">
        <div className="p-4 bg-white/5 rounded-full mb-4 animate-pulse">
          <Search className="text-gray-500" size={32} />
        </div>
        <p className="text-gray-400 font-medium">Belum ada data produk.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#18191e] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">
                Produk
              </th>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">
                HPP
              </th>
              {/* Kolom Harga Jual ada icon edit hint */}
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">
                <div
                  className="flex items-center justify-end gap-1 cursor-help"
                  title="Klik harga untuk edit cepat"
                >
                  Harga Jual
                </div>
              </th>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                Margin
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
            {data.map((product) => {
              const cost = Number(product.costPrice);
              const price = product.price;
              const marginPercentage =
                price > 0 ? ((price - cost) / price) * 100 : 0;
              const netProfit = price - cost;

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
                  className="group hover:bg-white/[0.03] transition-all duration-200"
                >
                  <td className="p-5">
                    <div className="font-medium text-white group-hover:text-[#dfff4f] transition-colors">
                      {product.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-gray-500 font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                        {product.sku || 'NO-SKU'}
                      </span>
                    </div>
                  </td>

                  <td className="p-5 text-right">
                    <div className="flex justify-end relative w-full">
                      {/* Tambahkan hint/title agar user tau ini bisa diedit */}
                      <div title="Klik untuk ubah modal">
                        <CostEditableCell id={product.id} initialCost={cost} />
                      </div>
                    </div>
                  </td>

                  {/* --- DISINI KITA PAKAI COMPONENT BARU --- */}
                  <td className="p-5 text-right relative">
                    {/* Relative needed untuk positioning popup input */}
                    <div className="flex justify-end">
                      <PriceEditableCell
                        id={product.id}
                        initialPrice={product.price}
                        costPrice={cost} // Pass HPP untuk kalkulasi "Smart Suggestion"
                      />
                    </div>
                  </td>

                  <td className="p-5">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border transition-all duration-300',
                          badgeColor
                        )}
                      >
                        <Icon size={12} strokeWidth={3} />
                        {formatPercent(marginPercentage)}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-mono transition-colors',
                          netProfit < 0 ? 'text-red-500' : 'text-gray-500'
                        )}
                      >
                        {netProfit > 0 ? '+' : ''}
                        {formatRupiah(netProfit)}
                      </span>
                    </div>
                  </td>

                  <td className="p-5 text-center">
                    <span
                      className={cn(
                        'text-xs font-bold px-3 py-1 rounded-md border',
                        product.stock < 10
                          ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                          : 'bg-[#dfff4f]/10 text-[#dfff4f] border-[#dfff4f]/20'
                      )}
                    >
                      {product.stock}
                    </span>
                  </td>

                  <td className="p-5 text-center">
                    <div className="flex justify-center">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full',
                          product.isActive
                            ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                            : 'bg-gray-600'
                        )}
                      />
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
