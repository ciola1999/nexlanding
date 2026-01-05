'use client';

import { useTransition } from 'react';
import { deleteAllProducts } from '@/features/smart-pos/_actions/products';

export default function ResetButton() {
  const [isPending, startTransition] = useTransition();

  const handleReset = () => {
    // Wajib konfirmasi agar tidak terhapus tidak sengaja
    if (
      !confirm('PERINGATAN: Ini akan menghapus SEMUA data produk. Lanjutkan?')
    )
      return;

    startTransition(async () => {
      await deleteAllProducts();
    });
  };

  return (
    <button
      onClick={handleReset}
      disabled={isPending}
      className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
    >
      {isPending ? 'Menghapus...' : '🗑️ Reset Database'}
    </button>
  );
}
