// src/app/projects/smart-pos/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

// Actions & Utils
import { getProducts } from '@/features/smart-pos/_actions/products'; // Pastikan action ini sudah di-update support sorting
import { getTransactionHistory } from '@/features/smart-pos/_actions/get-history';
import { getSession } from '@/lib/auth';

import SmartPosMainView from '@/features/smart-pos/_components/main-view';
import SmartPosSkeleton from '@/features/smart-pos/_components/Skeleton';

export const metadata: Metadata = {
  title: 'Kasir - NexLanding POS',
  description: 'Aplikasi Smart POS terintegrasi',
};

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// --- KOMPONEN PENGAMBIL DATA (UPDATED) ---
// Kita tambahkan parameter sort & order disini
async function PosDataLoader({
  currentView,
  sort,
  order,
}: {
  currentView: string | undefined;
  sort: string;
  order: 'asc' | 'desc';
}) {
  // Panggil getProducts dengan parameter sorting
  const [productsResult, historyResult] = await Promise.all([
    getProducts(sort, order),
    getTransactionHistory(),
  ]);

  const products = productsResult.success ? productsResult.data : [];
  const history = historyResult.success ? historyResult.data : [];

  return (
    <SmartPosMainView
      products={products}
      currentView={currentView}
      transactionHistory={history}
    />
  );
}

// --- HALAMAN UTAMA ---
export default async function PosPage({ searchParams }: Props) {
  // 🔒 1. CEK AUTENTIKASI
  const session = await getSession();

  if (!session) {
    redirect('/projects/smart-pos/login');
  }

  const params = await searchParams;

  // 1. Ambil View
  const currentView = typeof params.view === 'string' ? params.view : undefined;

  // 2. Ambil Sorting (Default: CreatedAt - Descending/Terbaru)
  const sort = typeof params.sort === 'string' ? params.sort : 'createdAt';

  // Validasi order hanya boleh 'asc' atau 'desc'
  const orderRaw = typeof params.order === 'string' ? params.order : 'desc';
  const order: 'asc' | 'desc' = orderRaw === 'asc' ? 'asc' : 'desc';

  return (
    <main>
      <Suspense fallback={<SmartPosSkeleton />}>
        <PosDataLoader currentView={currentView} sort={sort} order={order} />
      </Suspense>
    </main>
  );
}
