'use server';

import { db } from '@/db';
import {
  orders,
  orderItems,
  products,
  type Order,
} from '@/features/smart-pos/db/schema';
import { revalidatePath } from 'next/cache';
import { eq, sql, gte, desc } from 'drizzle-orm';

// Definisi Tipe Return agar Frontend tidak menebak-nebak
type CheckoutResult =
  | { success: false; message: string; data?: never }
  | { success: true; message: string; data: Order };

type CheckoutItem = {
  id: number;
  quantity: number;
  price: number;
};

type CustomerData = {
  tableNumber: string;
  customerName?: string;
  customerPhone?: string;
};

export async function processCheckout(
  items: CheckoutItem[],
  customer: CustomerData
): Promise<CheckoutResult> {
  // 1. Validasi Input
  if (!items.length) {
    return { success: false, message: 'Keranjang kosong' };
  }
  if (!customer.tableNumber) {
    return { success: false, message: 'Nomor Meja/Kursi wajib diisi!' };
  }

  try {
    // 2. Database Transaction
    const newOrder = await db.transaction(async (tx) => {
      // A. Hitung Queue Number (Reset Harian)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const lastOrderToday = await tx.query.orders.findFirst({
        where: gte(orders.createdAt, startOfDay),
        orderBy: [desc(orders.queueNumber)],
        columns: { queueNumber: true },
      });

      const nextQueueNumber = (lastOrderToday?.queueNumber ?? 0) + 1;

      // B. Hitung Total
      const totalAmount = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // C. Insert Order (Header)
      const [insertedOrder] = await tx
        .insert(orders)
        .values({
          totalAmount,
          paymentMethod: 'CASH',
          tableNumber: customer.tableNumber,
          customerName: customer.customerName || 'Guest',
          customerPhone: customer.customerPhone || null,
          queueNumber: nextQueueNumber,
        })
        .returning(); // Mengembalikan data order yang baru dibuat

      // D. Insert Items (Detail) & Update Stock
      for (const item of items) {
        await tx.insert(orderItems).values({
          orderId: insertedOrder.id,
          productId: item.id,
          quantity: item.quantity,
          priceAtTime: item.price,
        });

        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
          })
          .where(eq(products.id, item.id));
      }

      return insertedOrder;
    });

    // 3. Revalidate Cache
    revalidatePath('/projects/smart-pos');

    // 4. Return Data Sukses
    return {
      success: true,
      message: 'Transaksi Berhasil!',
      data: newOrder,
    };
  } catch (error) {
    console.error('Checkout Error:', error);
    return {
      success: false,
      message: 'Gagal memproses transaksi. Cek stok barang.',
    };
  }
}
