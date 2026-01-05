'use client';

import { useState } from 'react';
import { seedDummyProducts } from '@/app/projects/smart-pos/_actions/products';

export default function SeedButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSeed = async () => {
    setIsLoading(true);
    setMessage('');

    const result = await seedDummyProducts();

    setMessage(result.message);
    setIsLoading(false);

    // Hilangkan pesan setelah 3 detik
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSeed}
        disabled={isLoading}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Menambah...' : '+ 1 Produk Acak'}
      </button>
      {message && (
        <span
          className={`text-xs ${
            message.includes('Gagal') || message.includes('sudah ada')
              ? 'text-red-500'
              : 'text-emerald-600'
          }`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
