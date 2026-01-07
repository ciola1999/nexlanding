// src/app/projects/smart-pos/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

// Actions & Utils
import { getProducts } from '@/features/smart-pos/_actions/products';
import { getTransactionHistory } from '@/features/smart-pos/_actions/get-history';
import { getSession } from '@/lib/auth'; // 👇 Import session checker

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

// --- KOMPONEN PENGAMBIL DATA ---
async function PosDataLoader({
  currentView,
}: {
  currentView: string | undefined;
}) {
  const [productsResult, historyResult] = await Promise.all([
    getProducts(),
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
  // 🔒 1. CEK AUTENTIKASI DI SINI
  const session = await getSession();

  // Jika tidak ada session, tendang ke halaman login
  if (!session) {
    redirect('/projects/smart-pos/login');
  }

  const params = await searchParams;
  const currentView = typeof params.view === 'string' ? params.view : undefined;

  // Jika Role = 'cashier' tapi mencoba akses halaman Admin (Inventory/History),
  // paksa balik ke view 'cashier' (OPSIONAL - Rules Protection)
  /*
  if (session.role === 'cashier' && (currentView === 'inventory' || currentView === 'history')) {
     // Bisa redirect atau biarkan saja tapi hide tombol di UI
  }
  */

  return (
    <main>
      <Suspense fallback={<SmartPosSkeleton />}>
        <PosDataLoader currentView={currentView} />
      </Suspense>
    </main>
  );
}
