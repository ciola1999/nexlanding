import * as React from 'react';
import { formatRupiah } from '@/lib/utils';

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
}) => {
  return (
    // Container utama struk (lebar biasanya 58mm atau 80mm)
    <div className="w-full bg-white text-black font-mono text-[11px] leading-tight p-2 pb-5">
      {' '}
      {/* --- HEADER (RATA TENGAH) --- */}
      {/* HEADER: flex-col + items-center = RATA TENGAH SEMPURNA */}
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
            {/* Nama Produk */}
            <span className="font-bold truncate">{item.name}</span>
            <div className="flex justify-between pl-2">
              {/* Qty x Harga */}
              <span>
                {item.quantity} x {formatRupiah(item.price).replace('Rp', '')}
              </span>
              {/* Total per Item */}
              <span>{formatRupiah(item.quantity * item.price)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-b border-black border-dashed w-full my-2" />
      {/* --- TOTAL & PEMBAYARAN --- */}
      <div className="flex flex-col gap-1 text-[12px]">
        <div className="flex justify-between font-bold text-sm">
          <span>TOTAL</span>
          <span>{formatRupiah(totalAmount)}</span>
        </div>

        <div className="flex justify-between mt-1">
          <span className="uppercase">{paymentMethod}</span>
          <span>
            {cashAmount ? formatRupiah(cashAmount) : formatRupiah(totalAmount)}
          </span>
        </div>

        {/* Jika Cash, tampilkan kembalian */}
        {paymentMethod === 'cash' && changeAmount !== undefined && (
          <div className="flex justify-between">
            <span>KEMBALI</span>
            <span>{formatRupiah(changeAmount)}</span>
          </div>
        )}
      </div>
      <div className="border-b border-black border-dashed w-full my-4" />
      {/* --- FOOTER (RATA TENGAH) --- */}
      <div className="text-center text-[10px]">
        <p>Terima Kasih atas Kunjungan Anda</p>
        <p className="mt-1">Barang yang sudah dibeli</p>
        <p>tidak dapat ditukar/dikembalikan</p>
        <p className="mt-2 font-bold">--- LUNAS ---</p>
      </div>
    </div>
  );
};
