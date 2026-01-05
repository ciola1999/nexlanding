'use server';

import { db } from '@/db'; // Pastikan path import db benar
import { orders, orderItems, products } from '@/features/smart-pos/db/schema';
import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';

type CheckoutItem = {
  id: number; // Product ID
  quantity: number;
  price: number;
};

export async function processCheckout(items: CheckoutItem[]) {
  if (!items.length) {
    return { success: false, message: 'Keranjang kosong' };
  }

  try {
    // KITA PAKAI TRANSACTION BIAR DATA KONSISTEN
    await db.transaction(async (tx) => {
      // 1. Hitung Total
      const totalAmount = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // 2. Buat Order Baru
      const [newOrder] = await tx
        .insert(orders)
        .values({
          totalAmount: totalAmount,
          paymentMethod: 'CASH', // Default dulu
        })
        .returning();

      // 3. Loop setiap item untuk simpan detail & kurangi stok
      for (const item of items) {
        // A. Simpan ke order_items
        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          productId: item.id,
          quantity: item.quantity,
          priceAtTime: item.price,
        });

        // B. Kurangi Stok Produk (Atomic Update)
        // sql`...` memastikan kita mengurangi stok dari nilai yang ada di DB saat itu
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
          })
          .where(eq(products.id, item.id));
      }
    });

    // 4. Refresh halaman agar stok di UI terupdate otomatis
    revalidatePath('/projects/smart-pos');

    return { success: true, message: 'Transaksi Berhasil!' };
  } catch (error) {
    console.error('Checkout Error:', error);
    return {
      success: false,
      message: 'Gagal memproses transaksi. Cek stok barang.',
    };
  }
}
