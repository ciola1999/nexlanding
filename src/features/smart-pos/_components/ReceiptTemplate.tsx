import * as React from 'react';
import { formatRupiah } from '@/lib/utils'; // Pastikan path ini sesuai

interface ReceiptProps {
  storeName: string;
  storeAddress: string;
  date: Date | string;
  orderId: number;
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

export const ReceiptTemplate: React.FC<ReceiptProps> = ({
  storeName,
  storeAddress,
  date,
  orderId,
  cashierName,
  customerName,
  items,
  totalAmount,
  paymentMethod,
  cashAmount,
  changeAmount,
  payments, // 🔥 1. JANGAN LUPA AMBIL PROPS INI
}) => {
  return (
    // 🔥 2. KURANGI PADDING BAWAH AGAR TIDAK TEMBUS 2 HALAMAN
    // Ubah pb-5 menjadi pb-1 atau hapus pb nya.
    <div className="w-full bg-white text-black font-mono text-[11px] leading-tight p-2 pb-0">
      {/* --- HEADER --- */}
      <div className="flex flex-col items-center justify-center text-center mb-2">
        <h1 className="font-bold text-base uppercase">{storeName}</h1>
        <p className="text-[10px] mt-1">{storeAddress}</p>
        <div className="border-b border-black w-full border-dashed my-2" />
      </div>

      {/* --- INFO TRANSAKSI --- */}
      <div className="flex flex-col gap-1 mb-3 text-[10px]">
        <div className="flex justify-between">
          <span>Tgl: {new Date(date).toLocaleDateString('id-ID')}</span>
          <span>
            Jam:{' '}
            {new Date(date).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span>No: #{orderId}</span>
          <span>Kasir: {cashierName}</span>
        </div>
        <div className="flex justify-between">
          <span>Pelanggan:</span>
          <span className="font-bold truncate max-w-[100px]">
            {customerName}
          </span>
        </div>
      </div>
      <div className="border-b border-black border-dashed w-full mb-2" />

      {/* --- LIST ITEM --- */}
      <div className="flex flex-col gap-2 mb-2">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col">
            <span className="font-bold truncate">{item.name}</span>
            <div className="flex justify-between pl-2">
              <span>
                {item.quantity} x {formatRupiah(item.price).replace('Rp', '')}
              </span>
              <span>{formatRupiah(item.quantity * item.price)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-b border-black border-dashed w-full my-2" />

      {/* --- TOTAL & PEMBAYARAN (🔥 LOGIKA BARU DISINI) --- */}
      <div className="flex flex-col gap-1 text-[12px]">
        <div className="flex justify-between font-bold text-sm">
          <span>TOTAL</span>
          <span>{formatRupiah(totalAmount)}</span>
        </div>

        {/* 🔥 CEK APAKAH SPLIT PAYMENT ATAU BUKAN */}
        {paymentMethod === 'split' && payments && payments.length > 0 ? (
          // JIKA SPLIT, TAMPILKAN LIST PEMBAYARAN
          <div className="mt-1 flex flex-col gap-1">
            <div className="text-[10px] font-bold italic mb-1">
              Rincian Split:
            </div>
            {payments.map((pay, idx) => (
              <div key={idx} className="flex justify-between text-[11px]">
                <span className="uppercase pl-2">- {pay.method}</span>
                <span>{formatRupiah(pay.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          // JIKA BUKAN SPLIT (SINGLE PAYMENT)
          <div className="flex justify-between mt-1">
            <span className="uppercase">{paymentMethod}</span>
            <span>
              {cashAmount
                ? formatRupiah(cashAmount)
                : formatRupiah(totalAmount)}
            </span>
          </div>
        )}

        {/* KEMBALIAN (Hanya tampil jika ada changeAmount dan > 0) */}
        {changeAmount !== undefined && changeAmount > 0 && (
          <div className="flex justify-between mt-1 pt-1 border-t border-dotted border-gray-400">
            <span>KEMBALI</span>
            <span>{formatRupiah(changeAmount)}</span>
          </div>
        )}
      </div>

      <div className="border-b border-black border-dashed w-full my-4" />

      {/* --- FOOTER --- */}
      <div className="text-center text-[10px]">
        <p>Terima Kasih atas Kunjungan Anda</p>
        <p className="mt-1">Barang yang sudah dibeli</p>
        <p>tidak dapat ditukar/dikembalikan</p>
        <p className="mt-2 font-bold">--- LUNAS ---</p>
      </div>
    </div>
  );
};
