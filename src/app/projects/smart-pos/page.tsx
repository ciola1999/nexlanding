import { Metadata } from 'next';
import { Suspense } from 'react';

// Actions & Components
import { getProducts } from '@/features/smart-pos/_actions/products'; // Cek path action kamu
import { getTransactionHistory } from '@/features/smart-pos/_actions/get-history';
import SmartPosMainView from '@/features/smart-pos/_components/main-view';
import SmartPosSkeleton from '@/features/smart-pos/_components/Skeleton';

export const metadata: Metadata = {
  title: 'Kasir - NexLanding POS',
  description: 'Aplikasi Smart POS terintegrasi',
};

// Pastikan selalu fresh data
export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// --- KOMPONEN PENGAMBIL DATA (SERVER COMPONENT) ---
// Komponen ini akan "ditahan" oleh Suspense sampai datanya siap.
async function PosDataLoader({
  currentView,
}: {
  currentView: string | undefined;
}) {
  // 1. Fetching Data secara PARALEL di sini
  const [productsResult, historyResult] = await Promise.all([
    getProducts(),
    getTransactionHistory(),
  ]);

  // 2. Olah Datanya
  const products = productsResult.success ? productsResult.data : [];
  const history = historyResult.success ? historyResult.data : [];

  // 3. Render View Utama setelah data siap
  return (
    <SmartPosMainView
      products={products}
      currentView={currentView}
      transactionHistory={history}
    />
  );
}

// --- HALAMAN UTAMA (PARENT) ---
// Halaman ini langsung muncul INSTANT (menampilkan Skeleton),
// sambil menunggu PosDataLoader selesai mengambil data.
export default async function PosPage({ searchParams }: Props) {
  const params = await searchParams;
  const currentView = typeof params.view === 'string' ? params.view : undefined;

  return (
    <main>
      {/* Boundary Suspense */}
      <Suspense fallback={<SmartPosSkeleton />}>
        {/* Panggil Loader Component di sini */}
        <PosDataLoader currentView={currentView} />
      </Suspense>
    </main>
  );
}
