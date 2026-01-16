// src/app/projects/smart-pos/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

// Actions & Utils
import { getProducts } from '@/features/smart-pos/_actions/products';
import { getTransactionHistory } from '@/features/smart-pos/_actions/get-history';
import { getSession } from '@/lib/auth';
import { getDashboardData } from '@/features/smart-pos/services/dashboard.service';
import { getStoreSettings } from '@/features/smart-pos/_actions/setting-action';

// 🔥 1. IMPORT DB & SCHEMA UNTUK FETCH PAJAK
import { db } from '@/db';
import { taxes } from '@/features/smart-pos/db/schema';

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
async function PosDataLoader({
  currentView,
  sort,
  order,
}: {
  currentView: string | undefined;
  sort: string;
  order: 'asc' | 'desc';
}) {
  // 🔥 2. TAMBAHKAN db.select().from(taxes) KE PROMISE.ALL
  const [
    productsResult,
    historyResult,
    dashboardData,
    storeSettings,
    taxesData, // 👈 Hasil fetch pajak
  ] = await Promise.all([
    getProducts(sort, order),
    getTransactionHistory(),
    getDashboardData(),
    getStoreSettings(),
    db.select().from(taxes), // 👈 Fetch langsung dari DB (Aman di Server Component)
  ]);

  const products = productsResult.success ? productsResult.data : [];
  const history = historyResult.success ? historyResult.data : [];

  return (
    <SmartPosMainView
      products={products}
      transactionHistory={history}
      dashboardData={dashboardData}
      storeSettings={storeSettings}
      taxesData={taxesData} // 👈 3. PASS DATA PAJAK KE VIEW
      currentView={currentView}
    />
  );
}

// --- HALAMAN UTAMA ---
export default async function PosPage({ searchParams }: Props) {
  // 🔒 CEK AUTENTIKASI
  const session = await getSession();

  if (!session) {
    redirect('/projects/smart-pos/login');
  }

  const params = await searchParams;

  // 1. Ambil View
  const currentView = typeof params.view === 'string' ? params.view : undefined;

  // 2. Ambil Sorting
  const sort = typeof params.sort === 'string' ? params.sort : 'createdAt';
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
