// E:\Belajar Javascript\.vscode\Project-Freelance\nexlanding\frontend\src\features\smart-pos\_components\ReceiptTemplate.tsx

import * as React from 'react';
import { formatRupiah } from '@/lib/utils';

interface ReceiptProps {
  storeName: string;
  storeAddress: string;
  storePhone?: string; // Tambahan: No Telp Toko
  receiptFooter?: string; // Tambahan: Footer dari Settings
  taxRate?: number; // Tambahan: Persen Pajak

  date: Date | string;
  orderId: string | number; // Support string/number
  cashierName: string;
  customerName: string;
  items: {
    id: number;
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  paymentMethod: string;
  cashAmount?: number;
  changeAmount?: number;
  payments?: {
    method: string;
    amount: number;
  }[];
}

// 🔥 WAJIB PAKAI forwardRef AGAR BISA DIPRINT
export const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptProps>(
  (
    {
      storeName,
      storeAddress,
      storePhone,
      receiptFooter,
      taxRate = 0,
      date,
      orderId,
      cashierName,
      customerName,
      items,
      totalAmount,
      paymentMethod,
      cashAmount,
      changeAmount,
      payments = [],
    },
    ref // 👈 Ref ini ditangkap dari library print
  ) => {
    // Hitung Pajak (Opsional, jika ingin ditampilkan terpisah)
    // Asumsi: totalAmount sudah termasuk pajak atau belum, tergantung logika bisnismu.
    // Di sini saya asumsikan totalAmount adalah Grand Total.
    const taxValue =
      taxRate > 0 ? (totalAmount * taxRate) / (100 + taxRate) : 0;
    const subTotal = totalAmount - taxValue;

    return (
      <div
        ref={ref}
        className="w-[80mm] mx-auto bg-white text-black font-mono text-[11px] leading-tight p-2 pb-1"
        style={{ color: 'black' }} // 🔥 PASTI HITAM
      >
        {/* --- HEADER --- */}
        <div className="flex flex-col items-center justify-center text-center mb-2">
          <h1 className="font-bold text-lg uppercase">{storeName}</h1>
          <p className="text-[10px] mt-1 text-gray-600">{storeAddress}</p>
          {storePhone && <p className="text-[10px]">{storePhone}</p>}
          <div className="border-b border-black w-full border-dashed my-2" />
        </div>

        {/* --- INFO TRANSAKSI --- */}
        <div className="flex flex-col gap-1 mb-3 text-[10px]">
          <div className="flex justify-between">
            <span>{new Date(date).toLocaleDateString('id-ID')}</span>
            <span>
              {new Date(date).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>#{orderId}</span>
            <span>Kasir: {cashierName}</span>
          </div>
          <div className="flex justify-between">
            <span>Pelanggan:</span>
            <span className="font-bold truncate max-w-[120px]">
              {customerName}
            </span>
          </div>
        </div>
        <div className="border-b border-black border-dashed w-full mb-2" />

        {/* --- LIST ITEM --- */}
        <div className="flex flex-col gap-2 mb-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="font-bold truncate">{item.name}</span>
              <div className="flex justify-between pl-2 text-gray-700">
                <span>
                  {item.quantity} x {formatRupiah(item.price).replace('Rp', '')}
                </span>
                <span>{formatRupiah(item.quantity * item.price)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="border-b border-black border-dashed w-full my-2" />

        {/* --- TOTAL & PEMBAYARAN --- */}
        <div className="flex flex-col gap-1 text-[12px]">
          {/* Jika ada Pajak, tampilkan Subtotal & PPN */}
          {taxRate > 0 && (
            <>
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>Subtotal</span>
                <span>{formatRupiah(subTotal)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>PPN ({taxRate}%)</span>
                <span>{formatRupiah(taxValue)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between font-bold text-sm mt-1">
            <span>TOTAL</span>
            <span>{formatRupiah(totalAmount)}</span>
          </div>

          {/* LOGIC SPLIT PAYMENT */}
          {paymentMethod === 'split' && payments.length > 0 ? (
            <div className="mt-1 flex flex-col gap-1 border-t border-dashed border-gray-400 pt-1">
              <span className="italic text-[10px]">Split Payment:</span>
              {payments.map((p, i) => (
                <div key={i} className="flex justify-between text-[11px]">
                  <span className="uppercase">- {p.method}</span>
                  <span>{formatRupiah(p.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-between mt-1 text-[11px]">
              <span className="uppercase">Bayar ({paymentMethod})</span>
              <span>{formatRupiah(cashAmount || totalAmount)}</span>
            </div>
          )}

          {/* KEMBALIAN */}
          {changeAmount !== undefined && changeAmount > 0 && (
            <div className="flex justify-between mt-1 pt-1 border-t border-dotted border-gray-400 font-bold">
              <span>KEMBALI</span>
              <span>{formatRupiah(changeAmount)}</span>
            </div>
          )}
        </div>

        <div className="border-b border-black border-dashed w-full my-4" />

        {/* --- FOOTER DINAMIS --- */}
        <div className="text-center text-[10px] space-y-1">
          {/* Gunakan Footer dari Settings, atau default text */}
          <p className="whitespace-pre-wrap">
            {receiptFooter || 'Terima Kasih atas Kunjungan Anda'}
          </p>
          <p className="mt-2 text-[9px] text-gray-400">
            Powered by Junior Freelance
          </p>
        </div>
      </div>
    );
  }
);

// Wajib definisikan displayName untuk debugging React
ReceiptTemplate.displayName = 'ReceiptTemplate';
