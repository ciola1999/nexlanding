// src/features/smart-pos/_components/price-editable-cell.tsx
'use client';

import {
  useState,
  useOptimistic,
  startTransition,
  useRef,
  useEffect,
} from 'react';
import { updateProductPrice } from '../_actions/smart-price-adjustment';
import { cn } from '@/lib/utils';
import { PencilLine, Loader2, Sparkles, Check, X } from 'lucide-react';

interface PriceEditableCellProps {
  id: number;
  initialPrice: number;
  costPrice: number; // Kita butuh HPP untuk menghitung saran harga
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(val);

export function PriceEditableCell({
  id,
  initialPrice,
  costPrice,
}: PriceEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // REACT 19: Optimistic UI
  // UI berubah duluan sebelum server selesai response
  const [optimisticPrice, setOptimisticPrice] = useOptimistic(
    initialPrice,
    (state, newPrice: number) => newPrice
  );

  // --- BUSINESS LOGIC: SMART SUGGESTION ---
  // Target Margin: 30% (Standard Retail)
  // Rumus: Harga Jual = HPP / (1 - Desimal Margin)
  const targetMargin = 0.3;
  const rawSuggestedPrice = costPrice / (1 - targetMargin);
  // Pembulatan ke atas (kelipatan 100 atau 500 terdekat) untuk psychological pricing
  const suggestedPrice = Math.ceil(rawSuggestedPrice / 100) * 100;

  // Cek apakah margin saat ini "Bahaya" (< 10%)
  const currentMargin =
    optimisticPrice > 0 ? (optimisticPrice - costPrice) / optimisticPrice : 0;
  const isLowMargin = currentMargin < 0.1;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async (val: number) => {
    setIsEditing(false);
    setIsLoading(true);

    startTransition(async () => {
      setOptimisticPrice(val); // Update layar user DETIK ITU JUGA
      const result = await updateProductPrice(id, val); // Kirim ke server
      setIsLoading(false);

      if (!result.success) {
        // Error handling (bisa tambah toast disini)
        console.error('Rollback needed');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = parseInt(e.currentTarget.value.replace(/\D/g, ''));
      if (!isNaN(val)) handleSave(val);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  // Mode EDIT
  if (isEditing) {
    return (
      <div
        className={cn(
          'absolute right-0 top-1/2 -translate-y-1/2 z-50',
          'flex items-center gap-2 p-1.5 min-w-[140px]', // Agak lebih lebar karena ada tombol Auto
          'bg-[#09090b] border border-[#dfff4f]', // Style 'Active'
          'rounded-lg shadow-[0_0_20px_rgba(223,255,79,0.15)]',
          'animate-in zoom-in-95 duration-200'
        )}
      >
        {' '}
        {/* Tombol AUTO FIX (Hanya muncul jika margin rendah/rugi) */}
        {isLowMargin && (
          <button
            onClick={() => handleSave(suggestedPrice)}
            className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1.5 rounded-md hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
            title={`Set ke ${formatRupiah(suggestedPrice)} (Margin 30%)`}
          >
            <Sparkles size={12} />
            <span>Auto {formatRupiah(suggestedPrice)}</span>
          </button>
        )}
        <div className="relative">
          <span className="text-gray-500 text-xs font-mono absolute left-2 top-1.5">
            Rp
          </span>
          <input
            ref={inputRef}
            type="text"
            defaultValue={optimisticPrice}
            className={cn(
              'w-28 bg-[#0a0a0c] text-white text-right font-mono font-bold text-sm',
              'pl-7 pr-2 py-1 rounded border border-white/10',
              'focus:outline-none focus:border-[#dfff4f] focus:ring-1 focus:ring-[#dfff4f]/50'
            )}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          onClick={() => setIsEditing(false)}
          className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  // Mode DISPLAY
  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        'group/price relative cursor-pointer px-3 py-1.5 -mr-3 rounded-lg transition-all duration-200',
        'hover:bg-white/[0.08] flex items-center justify-end gap-2 border border-transparent hover:border-white/5'
      )}
    >
      {/* Loading Indicator */}
      {isLoading && (
        <Loader2 className="animate-spin text-[#dfff4f]" size={12} />
      )}

      {/* Harga Display */}
      <span
        className={cn(
          'text-sm font-bold font-mono tracking-tight transition-colors',
          isLoading ? 'text-[#dfff4f]' : 'text-white'
        )}
      >
        {formatRupiah(optimisticPrice)}
      </span>

      {/* Indikator Edit (Pensil) */}
      <PencilLine
        size={12}
        className="opacity-0 group-hover/price:opacity-50 text-gray-400 transition-opacity"
      />

      {/* Indikator Peringatan (Jika Margin Tipis/Rugi) tapi tidak sedang loading */}
      {!isLoading && isLowMargin && (
        <div className="absolute -top-1 -right-1">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </div>
      )}
    </div>
  );
}
