'use client';

import { useState, useRef, Fragment } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Helper Formatters
const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));

// Tipe Data STRICT (Tidak perlu | null lagi)
type TransactionData = {
  id: number;
  totalAmount: number;
  paymentMethod: string; // Sudah pasti string
  createdAt: Date; // Sudah pasti Date
  items: {
    id: number;
    quantity: number;
    priceAtTime: number;
    product: { name: string } | null; // Product tetap bisa null jika master produk dihapus (opsional)
  }[];
};

export default function TransactionList({
  initialData,
}: {
  initialData: TransactionData[];
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animasi Masuk (Stagger)
  useGSAP(
    () => {
      if (initialData.length > 0) {
        gsap.from('.transaction-row', {
          y: 20,
          opacity: 0,
          duration: 0.5,
          stagger: 0.05,
          ease: 'power2.out',
          clearProps: 'all',
        });
      }
    },
    { scope: containerRef, dependencies: [initialData] }
  );

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (initialData.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
        <p className="text-slate-500">Belum ada transaksi yang tercatat.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
          <tr>
            <th className="px-6 py-4">ID & Waktu</th>
            <th className="px-6 py-4">Metode Bayar</th>
            <th className="px-6 py-4">Total</th>
            <th className="px-6 py-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {initialData.map((trx) => {
            const isExpanded = expandedId === trx.id;

            return (
              <Fragment key={trx.id}>
                <tr
                  onClick={() => toggleExpand(trx.id)}
                  className={`transaction-row cursor-pointer transition-colors hover:bg-slate-50 ${
                    isExpanded ? 'bg-slate-50/50' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="font-mono font-medium text-slate-900">
                      #{trx.id}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {formatDate(trx.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        trx.paymentMethod === 'CASH'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}
                    >
                      {trx.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {formatRupiah(trx.totalAmount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                      {isExpanded ? 'Tutup' : 'Lihat Detail'}
                    </button>
                  </td>
                </tr>

                {isExpanded && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={4} className="px-6 py-4 pb-6">
                      {/* Kode detail item sama seperti sebelumnya */}
                      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                        <ul className="space-y-2">
                          {trx.items.map((item) => (
                            <li
                              key={item.id}
                              className="flex justify-between text-sm"
                            >
                              <span>
                                {item.product?.name} x{item.quantity}
                              </span>
                              <span className="font-mono">
                                {formatRupiah(item.priceAtTime * item.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
