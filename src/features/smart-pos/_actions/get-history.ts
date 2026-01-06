'use server';

import { db } from '@/db'; // Sesuaikan path koneksi DB kamu
import { orders } from '@/features/smart-pos/db/schema'; // Sesuaikan path schema
import { desc } from 'drizzle-orm';

export async function getTransactionHistory() {
  try {
    const data = await db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)], // Urutkan dari yang terbaru
      with: {
        items: {
          with: {
            product: true, // Ambil nama produk relasi
          },
        },
      },
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching history:', error);
    return { success: false, data: [] };
  }
}
