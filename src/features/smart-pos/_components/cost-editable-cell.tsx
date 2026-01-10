'use client';

import {
  useState,
  useOptimistic,
  startTransition,
  useRef,
  useEffect,
} from 'react';
import { updateProductCost } from '../_actions/smart-price-adjustment';
import { cn, formatRupiah } from '@/lib/utils';
import { PencilLine, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CostEditableCellProps {
  id: number;
  initialCost: number;
}

export function CostEditableCell({ id, initialCost }: CostEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Optimistic UI
  const [optimisticCost, setOptimisticCost] = useOptimistic(
    initialCost,
    (state, newCost: number) => newCost
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async (val: number) => {
    if (val < 0) return;
    setIsEditing(false);

    if (val === initialCost) return;

    setIsLoading(true);
    startTransition(async () => {
      setOptimisticCost(val);
      const result = await updateProductCost(id, val);
      setIsLoading(false);

      if (result.success) {
        toast.success(`HPP diupdate: ${formatRupiah(val)}`);
      } else {
        toast.error('Gagal update HPP');
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

  // --- MODE EDIT (CLEAN & MINIMALIST) ---
  if (isEditing) {
    return (
      <div className="relative flex justify-center min-h-[30px]">
        {/* Backdrop transparent */}
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsEditing(false)}
        />

        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'flex items-center gap-1 p-1 min-w-[130px]',
            'bg-[#121317] border border-[#dfff4f]', // Konsisten dengan PriceCell
            'rounded-lg shadow-xl shadow-black/50',
            'animate-in zoom-in-95 duration-150'
          )}
        >
          {/* Label Rp */}
          <span className="absolute left-2 text-[#dfff4f]/70 font-mono text-xs pointer-events-none">
            Rp
          </span>

          <input
            ref={inputRef}
            type="number"
            defaultValue={optimisticCost}
            className={cn(
              'w-full bg-transparent text-white text-right font-mono font-bold text-sm',
              'pl-8 pr-2 py-1.5',
              'outline-none border-none ring-0',
              // Menghilangkan Spinner bawaan browser
              '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
            )}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
    );
  }

  // --- MODE DISPLAY ---
  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        'group/cost relative cursor-pointer flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg transition-all',
        'hover:bg-white/5 border border-transparent hover:border-white/10'
      )}
    >
      {isLoading ? (
        <Loader2 className="animate-spin text-gray-500" size={14} />
      ) : (
        <>
          <span className="text-gray-400 font-mono font-medium text-sm transition-colors group-hover/cost:text-gray-300">
            {formatRupiah(optimisticCost)}
          </span>

          <PencilLine
            size={12}
            className="opacity-0 group-hover/cost:opacity-50 text-gray-500 transition-opacity absolute right-2"
          />
        </>
      )}
    </div>
  );
}
