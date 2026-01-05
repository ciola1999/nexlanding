import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
// 👇 Gunakan alias '@/' supaya lebih rapi daripada '../../../../'
import { getTransactionHistory } from '@/features/smart-pos/_actions/get-history';
import HistoryList from '@/features/smart-pos/_components/HistoryList';

// Pakai dynamic force supaya data selalu fresh saat dibuka
export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  // 1. Fetch data di Server Component
  const { data: history } = await getTransactionHistory();

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 force-show-cursor">
      <div className="max-w-4xl mx-auto">
        {/* 👇 BAGIAN TOMBOL KEMBALI (BARU) */}
        <div className="mb-6">
          <Link
            href="/projects/smart-pos"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 group"
          >
            <ArrowLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="font-medium">Kembali ke POS</span>
          </Link>
        </div>

        {/* Header Page */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              Riwayat Transaksi
            </h1>
            <p className="text-gray-400 mt-2 text-sm md:text-base">
              Pantau semua penjualan yang masuk secara real-time.
            </p>
          </div>

          {/* Stats Sederhana */}
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
              <span className="text-xs text-gray-400 block uppercase tracking-wider mb-1">
                Total Transaksi
              </span>
              <span className="text-2xl font-bold font-mono text-blue-400">
                {history?.length || 0}
              </span>
            </div>
          </div>
        </header>

        {/* List Transaksi */}
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <HistoryList history={history || []} />
        </div>
      </div>
    </main>
  );
}
