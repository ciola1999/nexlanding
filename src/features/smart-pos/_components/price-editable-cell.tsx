'use client';

import {
  useState,
  useOptimistic,
  startTransition,
  useRef,
  useEffect,
} from 'react';
import { updateProductPrice } from '../_actions/smart-price-adjustment';
import { cn, formatRupiah } from '@/lib/utils';
import { PencilLine, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface PriceEditableCellProps {
  id: number;
  initialPrice: number;
  costPrice: number;
}

export function PriceEditableCell({
  id,
  initialPrice,
  costPrice,
}: PriceEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Optimistic UI
  const [optimisticPrice, setOptimisticPrice] = useOptimistic(
    initialPrice,
    (state, newPrice: number) => newPrice
  );

  // Business Logic: Smart Margin (Hanya untuk perhitungan background)
  const targetMargin = 0.3;
  const rawSuggestedPrice = costPrice > 0 ? costPrice / (1 - targetMargin) : 0;
  const suggestedPrice = Math.ceil(rawSuggestedPrice / 100) * 100;

  const currentMargin =
    optimisticPrice > 0 ? (optimisticPrice - costPrice) / optimisticPrice : 0;

  const isLowMargin = currentMargin < 0.1;
  const isHealthyMargin = currentMargin >= 0.3;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async (val: number) => {
    if (val < 0) return;
    setIsEditing(false);
    if (val === initialPrice) return;

    setIsLoading(true);
    startTransition(async () => {
      setOptimisticPrice(val);
      const result = await updateProductPrice(id, val);
      setIsLoading(false);

      if (result.success) {
        toast.success(`Harga: ${formatRupiah(val)}`);
      } else {
        toast.error('Gagal update');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = parseInt(e.currentTarget.value);
      if (!isNaN(val)) handleSave(val);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  // --- MODE EDIT (CLEAN & MINIMAL) ---
  if (isEditing) {
    return (
      <div className="relative flex justify-center min-h-[30px]">
        {/* Backdrop transparent untuk click outside */}
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsEditing(false)}
        />

        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'flex flex-col gap-1 p-1 min-w-[130px]', // Ukuran pas, tidak terlalu lebar
            'bg-[#121317] border border-[#dfff4f]', // Single Border Neon
            'rounded-lg shadow-xl shadow-black/50',
            'animate-in zoom-in-95 duration-150'
          )}
        >
          <div className="relative flex items-center">
            {/* Label Rp minimalis */}
            <span className="absolute left-2 text-[#dfff4f]/70 font-mono text-xs pointer-events-none">
              Rp
            </span>

            <input
              ref={inputRef}
              type="number"
              defaultValue={optimisticPrice}
              className={cn(
                'w-full bg-transparent text-white text-right font-mono font-bold text-sm',
                'pl-8 pr-2 py-1.5',
                'outline-none border-none ring-0', // Hapus border input bawaan
                '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
              )}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Tombol Auto Fix: Muncul kecil saja jika perlu */}
          {costPrice > 0 && isLowMargin && (
            <button
              onClick={() => handleSave(suggestedPrice)}
              className="flex items-center justify-center gap-1.5 text-[10px] bg-[#dfff4f]/10 text-[#dfff4f] py-1 rounded hover:bg-[#dfff4f]/20 transition-colors w-full"
              title={`Saran Harga: ${formatRupiah(suggestedPrice)}`}
            >
              <Sparkles size={10} />
              <span>Fix: {formatRupiah(suggestedPrice)}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- MODE DISPLAY ---
  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        'group/price relative cursor-pointer flex items-center justify-end gap-2 py-1.5 px-2 rounded-lg transition-all',
        'hover:bg-white/5 border border-transparent hover:border-white/10'
      )}
    >
      {isLoading ? (
        <Loader2 className="animate-spin text-[#dfff4f]" size={14} />
      ) : (
        <>
          <span
            className={cn(
              'font-mono font-medium text-sm transition-colors text-right',
              isLowMargin
                ? 'text-orange-400'
                : isHealthyMargin
                ? 'text-[#dfff4f]'
                : 'text-gray-300'
            )}
          >
            {formatRupiah(optimisticPrice)}
          </span>

          <PencilLine
            size={12}
            className="opacity-0 group-hover/price:opacity-50 text-gray-500 transition-opacity absolute right-full mr-1"
          />
        </>
      )}
    </div>
  );
}
