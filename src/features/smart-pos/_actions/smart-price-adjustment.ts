// src/features/smart-pos/actions.ts
'use server';

import { db } from '@/db';
import { products } from '@/features/smart-pos/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateProductPrice(id: number, newPrice: number) {
  try {
    // Validasi basic
    if (newPrice < 0) throw new Error('Harga tidak boleh minus');

    await db
      .update(products)
      .set({
        price: newPrice,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    // Revalidate agar tabel utama refresh datanya (termasuk badge margin)
    revalidatePath('/dashboard/products');

    return { success: true };
  } catch (error) {
    console.error('Update Error:', error);
    return { success: false, message: 'Gagal update harga' };
  }
}

export async function updateProductCost(id: number, newCost: number) {
  try {
    if (newCost < 0) throw new Error('HPP tidak boleh minus');

    await db
      .update(products)
      .set({
        // Konversi ke string untuk tipe data DECIMAL di Postgres
        costPrice: newCost.toString(),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    // Refresh halaman agar Margin & Profit otomatis terhitung ulang
    revalidatePath('/dashboard/products');

    return { success: true };
  } catch (error) {
    console.error('Update Cost Error:', error);
    return { success: false, message: 'Gagal update HPP' };
  }
}
