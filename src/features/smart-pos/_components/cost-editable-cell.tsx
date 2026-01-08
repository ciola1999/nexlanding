// src/features/smart-pos/_components/cost-editable-cell.tsx
'use client';

import {
  useState,
  useOptimistic,
  startTransition,
  useRef,
  useEffect,
} from 'react';
import { updateProductCost } from '../_actions/smart-price-adjustment';
import { cn } from '@/lib/utils';
import { PencilLine, Loader2, X } from 'lucide-react'; // Hapus Wallet jika tidak dipakai

interface CostEditableCellProps {
  id: number;
  initialCost: number;
}

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(val);

export function CostEditableCell({ id, initialCost }: CostEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [optimisticCost, setOptimisticCost] = useOptimistic(
    initialCost,
    (state, newCost: number) => newCost
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // Auto block text saat muncul
    }
  }, [isEditing]);

  const handleSave = async (val: number) => {
    setIsEditing(false); // Tutup dulu biar UI responsif
    setIsLoading(true);

    startTransition(async () => {
      setOptimisticCost(val);
      const result = await updateProductCost(id, val);
      setIsLoading(false);
      if (!result.success) console.error('Gagal update HPP');
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = parseFloat(e.currentTarget.value.replace(/[^\d.]/g, ''));
      if (!isNaN(val)) handleSave(val);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  // --- STRUKTUR BARU (GHOST ELEMENT) ---
  return (
    <div className="relative flex justify-end items-center">
      {/* 1. LAYER VISUAL (Display) 
          Kita gunakan opacity-0 saat editing, BUKAN menghilangkannya dari DOM.
          Ini kuncinya: teks ini tetap 'mengganjal' ketinggian baris.
      */}
      <div
        onClick={() => !isEditing && setIsEditing(true)}
        className={cn(
          'group/cost cursor-pointer px-3 py-1.5 rounded-lg transition-all duration-200 border border-transparent',
          'hover:bg-white/[0.08] flex items-center gap-2 hover:border-white/5',
          // Jika sedang edit, sembunyikan isinya tapi tetap ambil ruang (invisible)
          isEditing ? 'invisible pointer-events-none' : 'visible'
        )}
      >
        {isLoading && (
          <Loader2 className="animate-spin text-gray-400" size={12} />
        )}

        <span
          className={cn(
            'text-sm font-medium font-mono tracking-tight transition-colors',
            isLoading ? 'text-gray-500' : 'text-gray-400'
          )}
        >
          {formatRupiah(optimisticCost)}
        </span>

        <PencilLine
          size={12}
          className="opacity-0 group-hover/cost:opacity-50 text-gray-500 transition-opacity"
        />
      </div>
      {/* 2. LAYER INPUT (Absolute Overlay) 
          Muncul TEPAT di atas elemen yang di-hidden tadi.
          top-1/2 -translate-y-1/2 memastikan dia selalu di tengah vertikal.
      */}
      {isEditing && (
        <div
          className={cn(
            // POSISI (Tetap sama)
            'absolute right-0 top-1/2 -translate-y-1/2 z-50',

            // LAYOUT & SIZE
            'flex items-center gap-1 p-1.5 min-w-[120px]',

            // VISUAL STYLE (YANG BARU)
            'bg-[#09090b]', // Background hitam pekat agar kontras dari tabel abu-abu
            'border border-[#dfff4f]', // Border warna Neon (Warna brand Anda)
            'rounded-lg shadow-[0_0_20px_rgba(223,255,79,0.15)]', // Efek Glowing

            // ANIMASI
            'animate-in fade-in zoom-in-95 duration-150'
          )}
        >
          <span className="text-[#dfff4f] text-xs font-mono pl-2 font-bold">
            Rp
          </span>
          <input
            ref={inputRef}
            type="text"
            defaultValue={optimisticCost}
            className="w-full bg-transparent text-white text-right font-mono font-bold text-sm py-1 pr-1 focus:outline-none placeholder:text-gray-700"
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(false);
            }}
            className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}{' '}
    </div>
  );
}
