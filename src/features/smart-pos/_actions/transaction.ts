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

// --- UPDATE 1: Type Definition untuk Input Customer ---
type CustomerData = {
  orderType: 'dine_in' | 'take_away';
  paymentMethod: 'cash' | 'transfer';
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
  // --- UPDATE 2: Logic Validasi Table Number ---
  // Jika Dine In, nomor meja wajib. Jika Take Away, boleh kosong (kita set strip)
  let finalTableNumber = customer.tableNumber;

  if (customer.orderType === 'dine_in' && !finalTableNumber) {
    return { success: false, message: 'Nomor Meja wajib diisi untuk Dine In!' };
  }

  if (customer.orderType === 'take_away' && !finalTableNumber) {
    finalTableNumber = 'TAKE AWAY'; // Default value agar database tidak error jika kolom notNull
  }

  try {
    const newOrder = await db.transaction(async (tx) => {
      // A. Hitung Queue Number (Tetap sama)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const lastOrderToday = await tx.query.orders.findFirst({
        where: gte(orders.createdAt, startOfDay),
        orderBy: [desc(orders.queueNumber)],
        columns: { queueNumber: true },
      });

      const nextQueueNumber = (lastOrderToday?.queueNumber ?? 0) + 1;

      // B. Hitung Total (Tetap sama)
      const totalAmount = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // --- UPDATE 3: Insert dengan Data Baru ---
      const [insertedOrder] = await tx
        .insert(orders)
        .values({
          totalAmount,
          orderType: customer.orderType, // field baru
          paymentMethod: customer.paymentMethod, // field baru
          tableNumber: finalTableNumber,
          customerName: customer.customerName || 'Guest',
          customerPhone: customer.customerPhone || null,
          queueNumber: nextQueueNumber,
          // cashierId: ... (Nanti ambil dari session jika auth sudah jalan)
        })
        .returning();

      // D. Insert Items (Detail) & Update Stock (Tetap sama)
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
