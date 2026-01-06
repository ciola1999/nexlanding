import { Metadata } from 'next';
import { getProducts } from '@/features/smart-pos/_actions/products'; // Path action baru
import { Suspense } from 'react';
import SmartPosMainView from '@/features/smart-pos/_components/main-view'; // Path component baru
import SmartPosSkeleton from '@/features/smart-pos/_components/Skeleton';

export const metadata: Metadata = {
  title: 'Kasir - NexLanding POS',
  description: 'Aplikasi Smart POS terintegrasi',
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// 3. Wrapper Component untuk Fetching Data
// Kita pisahkan ini supaya page utamanya render INSTANT, baru datanya nyusul.
async function PosDataLoader({
  currentView,
}: {
  currentView: string | undefined;
}) {
  // Simulasi delay biar kelihatan skeletonnya (Hapus baris ini nanti kalau mau production)
  // await new Promise((resolve) => setTimeout(resolve, 2000));

  const { data: products } = await getProducts();

  return (
    <SmartPosMainView products={products || []} currentView={currentView} />
  );
}

export default async function PosPage({ searchParams }: Props) {
  // 1. Fetch Data di Server (Action tetap berjalan di server)

  // 2. Ambil parameter URL
  const params = await searchParams;
  const currentView = typeof params.view === 'string' ? params.view : undefined;

  // 3. Render View Component
  return (
    <main>
      {/* 4. SUSPENSE BOUNDARY */}
      {/* Artinya: "Tampilkan <SmartPosSkeleton> SELAMA <PosDataLoader> sedang mengambil data" */}
      <Suspense fallback={<SmartPosSkeleton />}>
        <PosDataLoader currentView={currentView} />
      </Suspense>
    </main>
  );
}
