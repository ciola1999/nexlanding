import { Metadata } from 'next';
import { getProducts } from '@/features/smart-pos/_actions/products'; // Path action baru
import SmartPosMainView from '@/features/smart-pos/_components/main-view'; // Path component baru

export const metadata: Metadata = {
  title: 'Kasir - NexLanding POS',
  description: 'Aplikasi Smart POS terintegrasi',
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function PosPage({ searchParams }: Props) {
  // 1. Fetch Data di Server (Action tetap berjalan di server)
  const { data: products } = await getProducts();

  // 2. Ambil parameter URL
  const params = await searchParams;
  const currentView = typeof params.view === 'string' ? params.view : undefined;

  // 3. Render View Component
  return (
    <main>
      <SmartPosMainView products={products || []} currentView={currentView} />
    </main>
  );
}
