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
} from 'lucide-react';

// Tipe Data
type HistoryItem = {
  id: number;
  totalAmount: number;
  paymentMethod: string;
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
      month: 'long',
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
        '.history-row', // Class target kita ubah namanya biar sesuai konteks
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
      <div className="text-center py-20 text-gray-500">
        <div className="bg-neutral-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 opacity-50" />
        </div>
        <p>Belum ada riwayat transaksi.</p>
      </div>
    );
  }

  return (
    // HAPUS space-y-3 dan pb-20 agar rapat seperti tabel
    <div ref={containerRef} className="flex flex-col">
      {history.map((order) => (
        <div
          key={order.id}
          // UBAH STYLE DI SINI:
          // 1. Hapus rounded-xl & margin
          // 2. Ganti jadi border-b (garis bawah)
          // 3. Tambahkan hover effect yang halus
          className="history-row border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors duration-200"
        >
          {/* Header Row (Klik untuk Expand) */}
          <div
            onClick={() => toggleExpand(order.id)}
            className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            {/* Kiri: Info Utama */}
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  order.paymentMethod === 'CASH'
                    ? 'bg-emerald-500/10 text-emerald-500' // Background lebih soft (/10)
                    : 'bg-blue-500/10 text-blue-500'
                }`}
              >
                <ShoppingBag size={18} />
              </div>
              <div>
                <h3 className="font-medium text-white text-base">
                  Order #{order.id}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                  <Calendar size={12} />
                  <span>{formatDate(order.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Kanan: Harga & Chevron */}
            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pl-14 sm:pl-0">
              <div className="text-right">
                <div className="text-base font-bold text-white tracking-tight">
                  {formatRupiah(order.totalAmount)}
                </div>
                <div className="flex items-center justify-end gap-1 text-[10px] text-gray-500 uppercase font-medium tracking-wider mt-1">
                  <CreditCard size={10} />
                  {order.paymentMethod}
                </div>
              </div>

              <div
                className={`p-1 rounded-full transition-transform duration-300 ${
                  expandedId === order.id
                    ? 'rotate-180 bg-white/10'
                    : 'text-gray-500'
                }`}
              >
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          {/* Body Expand (Detail Item) */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              expandedId === order.id
                ? 'max-h-[500px] opacity-100'
                : 'max-h-0 opacity-0'
            }`}
          >
            {/* Background detail dibikin gelap sedikit (bg-black/20) supaya kontras dengan list utama */}
            <div className="bg-black/20 px-5 pb-5">
              <div className="border-t border-dashed border-white/10 pt-4">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-[10px] text-gray-500 uppercase font-medium">
                    <tr>
                      <th className="pb-3 font-normal">Produk</th>
                      <th className="pb-3 text-center font-normal">Qty</th>
                      <th className="pb-3 text-right font-normal">Harga</th>
                      <th className="pb-3 text-right font-normal">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs sm:text-sm">
                    {order.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-white/5 last:border-0 hover:text-white transition-colors"
                      >
                        <td className="py-2 pr-2">
                          {item.product ? (
                            item.product.name
                          ) : (
                            <span className="text-red-400 italic flex items-center gap-1">
                              <PackageX size={12} /> Dihapus
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-center text-gray-400">
                          x{item.quantity}
                        </td>
                        <td className="py-2 text-right text-gray-400">
                          {formatRupiah(item.priceAtTime)}
                        </td>
                        <td className="py-2 text-right font-medium">
                          {formatRupiah(item.priceAtTime * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
