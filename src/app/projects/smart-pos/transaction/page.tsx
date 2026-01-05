import { db } from '@/db';
import { orders } from '@/db/schema';
import { desc } from 'drizzle-orm';
import TransactionList from '../_components/TransactionList';

// Paksa render dinamis (Server-Side Rendering tiap request)
export const dynamic = 'force-dynamic';

async function getTransactions() {
  // Query ke PostgreSQL via Drizzle
  const data = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    limit: 50,
    with: {
      items: {
        with: {
          product: true,
        },
      },
    },
  });
  return data;
}

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return (
    <main className="min-h-screen bg-slate-50/30 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        {/* Header Section */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Riwayat Penjualan
            </h1>
            <p className="mt-2 text-slate-500">
              Data real-time dari PostgreSQL Database.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-center">
              <div className="text-xs text-slate-400 uppercase font-bold">
                Total Bon
              </div>
              <div className="text-xl font-bold text-indigo-600">
                {transactions.length}
              </div>
            </div>
          </div>
        </header>

        {/* Tabel Transaksi */}
        <TransactionList initialData={transactions} />
      </div>
    </main>
  );
}
