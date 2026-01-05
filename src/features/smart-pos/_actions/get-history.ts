'use server';

import { db } from '@/db';
import { orders } from '@/features/smart-pos/db/schema';
import { desc } from 'drizzle-orm';

export async function getTransactionHistory() {
  try {
    const history = await db.query.orders.findMany({
      // 1. Urutkan dari yang paling baru
      orderBy: [desc(orders.createdAt)],
      limit: 50,

      // 2. RELASI (Bagian ini yang diubah)
      with: {
        items: {
          // Kita masuk ke dalam 'items', lalu minta ambil data 'product'
          with: {
            product: true,
          },
        },
      },
    });

    return { success: true, data: history };
  } catch (error) {
    console.error('Error fetching history:', error);
    return { success: false, data: [] };
  }
}
