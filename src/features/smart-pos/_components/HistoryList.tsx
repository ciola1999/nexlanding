'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  ChevronDown,
  ShoppingBag,
  Calendar,
  CreditCard,
  PackageX,
  User,
  Phone,
  Armchair,
  Hash,
} from 'lucide-react';

// Tipe Data
type HistoryItem = {
  id: number;
  totalAmount: number;
  paymentMethod: string;
  tableNumber: string;
  customerName?: string;
  customerPhone?: string;
  queueNumber: number;
  createdAt: Date;
  items: {
    id: number;
    quantity: number;
    priceAtTime: number;
    product: {
      name: string;
    } | null;
  }[];
};

export default function HistoryList({ history }: { history: HistoryItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 1. FORMAT RUPIAH
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // 2. FORMAT TANGGAL
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(date));
  };

  useGSAP(
    () => {
      if (!containerRef.current) return;
      gsap.fromTo(
        '.history-row',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      );
    },
    { scope: containerRef }
  );

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500 flex flex-col items-center">
        <div className="bg-neutral-900/50 w-20 h-20 rounded-full flex items-center justify-center mb-4 border border-white/5">
          <ShoppingBag className="w-8 h-8 opacity-40" />
        </div>
        <p className="text-sm">Belum ada riwayat transaksi.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col w-full">
      {history.map((order) => (
        <div
          key={order.id}
          className={`history-row border-b border-white/5 last:border-0 transition-colors duration-200 ${
            expandedId === order.id
              ? 'bg-white/[0.02]'
              : 'hover:bg-white/[0.02]'
          }`}
        >
          {/* --- HEADER ROW (KLIK UNTUK EXPAND) --- */}
          <div
            onClick={() => toggleExpand(order.id)}
            className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            {/* Kiri: Icon & Basic Info */}
            <div className="flex items-start sm:items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                  order.paymentMethod === 'CASH'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                }`}
              >
                <ShoppingBag size={18} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white text-sm sm:text-base">
                    Order #{order.id}
                  </h3>
                  {/* Badge Status kecil */}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-400 border border-white/5">
                    Selesai
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-600" />
                  <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>{order.customerName || 'Guest'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kanan: Harga & Chevron */}
            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pl-14 sm:pl-0">
              <div className="text-right">
                <div className="text-base font-bold text-white tracking-tight">
                  {formatRupiah(order.totalAmount)}
                </div>
                <div className="flex items-center justify-end gap-1 text-[10px] text-gray-500 uppercase font-medium tracking-wider mt-0.5">
                  <CreditCard size={10} />
                  {order.paymentMethod}
                </div>
              </div>

              <div
                className={`p-1.5 rounded-full transition-all duration-300 ${
                  expandedId === order.id
                    ? 'rotate-180 bg-[#dfff4f] text-black'
                    : 'text-gray-500 bg-white/5'
                }`}
              >
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {/* --- EXPANDED BODY (DETAIL) --- */}
          <div
            className={`grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              expandedId === order.id
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="bg-black/20 border-t border-dashed border-white/10 mx-0 sm:mx-4 mb-4 rounded-b-xl px-4 pb-4">
                {/* 1. INFORMASI ORDER (GRID LAYOUT) - Ini perbaikan layoutnya */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 text-xs sm:text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium">
                      <Armchair size={12} /> No. Meja
                    </span>
                    <span className="text-white font-medium">
                      {order.tableNumber}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium">
                      <Hash size={12} /> Antrian
                    </span>
                    <span className="text-white font-medium">
                      #{order.queueNumber}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium">
                      <User size={12} /> Pelanggan
                    </span>
                    <span className="text-white font-medium">
                      {order.customerName || 'Guest'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium">
                      <Phone size={12} /> No. HP
                    </span>
                    <span className="text-white font-medium">
                      {order.customerPhone || '-'}
                    </span>
                  </div>
                </div>

                {/* 2. TABEL ITEM (LEBIH CLEAN) */}
                <div className="border border-white/5 rounded-lg overflow-hidden bg-white/[0.02]">
                  <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-[10px] text-gray-500 uppercase bg-white/5">
                      <tr>
                        <th className="px-4 py-2 font-medium">Produk</th>
                        <th className="px-4 py-2 text-right font-medium">
                          Harga
                        </th>
                        <th className="px-4 py-2 text-center font-medium">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {order.items.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-3">
                            {item.product ? (
                              <span className="text-white">
                                {item.product.name}
                              </span>
                            ) : (
                              <span className="text-red-400 italic flex items-center gap-1 text-xs">
                                <PackageX size={12} /> Produk Dihapus
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-400 font-mono text-xs">
                            {formatRupiah(item.priceAtTime)}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-400 text-xs">
                            x{item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-white font-medium font-mono text-xs">
                            {formatRupiah(item.priceAtTime * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Total Footer (Optional, untuk penegas) */}
                  <div className="px-4 py-3 bg-white/5 flex justify-between items-center border-t border-white/5">
                    <span className="text-xs text-gray-400">
                      Total Transaksi
                    </span>
                    <span className="text-sm font-bold text-[#dfff4f]">
                      {formatRupiah(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
