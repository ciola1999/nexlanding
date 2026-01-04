// src/app/projects/smart-pos/page.tsx
import Link from 'next/link';
import StatusBadge from './_components/status-badge';
import SeedButton from './_components/seed-button';

export default function PosPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Smart POS Dashboard</h1>
      <p className="mb-6 text-gray-600">Aplikasi Kasir Terintegrasi</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold">Transaksi Baru</h2>
          <p className="text-sm text-gray-500 mt-2">Mulai transaksi kasir.</p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold">Database Status</h2>
          <p className="text-sm text-gray-500 mt-2">Menunggu koneksi...</p>
        </div>

        <SeedButton />

        <StatusBadge />
      </div>

      <div className="mt-8">
        <Link href="/" className="text-blue-600 hover:underline">
          &larr; Kembali ke Portfolio
        </Link>
      </div>
    </div>
  );
}
