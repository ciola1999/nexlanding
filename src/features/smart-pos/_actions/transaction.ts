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

// --- TYPE DEFINITIONS ---

type CheckoutResult =
  | { success: false; message: string; data?: never }
  | { success: true; message: string; data: Order };

type CheckoutItem = {
  id: number;
  quantity: number;
  price: number;
};

// 1. UPDATE: Tambahkan amountPaid ke sini supaya Backend tau user bayar berapa
type CustomerData = {
  orderType: 'dine_in' | 'take_away';
  paymentMethod: 'cash' | 'debit' | 'qris';
  tableNumber: string;
  customerName?: string;
  customerPhone?: string;
  amountPaid: number; // 👈 Wajib ada angka uang yang dibayar
};

export async function processCheckout(
  items: CheckoutItem[],
  customer: CustomerData
): Promise<CheckoutResult> {
  // 1. Validasi Input Dasar
  if (!items.length) {
    return { success: false, message: 'Keranjang belanja kosong.' };
  }

  // 2. Logic Validasi Table Number
  let finalTableNumber = customer.tableNumber;

  if (customer.orderType === 'dine_in' && !finalTableNumber) {
    return { success: false, message: 'Nomor Meja wajib diisi untuk Dine In!' };
  }

  if (customer.orderType === 'take_away') {
    finalTableNumber = 'TAKE AWAY';
  }

  try {
    const result = await db.transaction(async (tx) => {
      // A. Hitung Queue Number
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const lastOrderToday = await tx.query.orders.findFirst({
        where: gte(orders.createdAt, startOfDay),
        orderBy: [desc(orders.queueNumber)],
        columns: { queueNumber: true },
      });

      const nextQueueNumber = (lastOrderToday?.queueNumber ?? 0) + 1;

      // B. Hitung Total Amount (Backend Calculation is Safer)
      const totalAmount = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // 🔥 VALIDASI LOGIC (Backend Guard)
      // Cek apakah uang pembayaran kurang dari total belanja
      if (customer.amountPaid < totalAmount) {
        throw new Error(
          `Pembayaran kurang! Total: ${totalAmount}, Dibayar: ${customer.amountPaid}`
        );
      }

      // 🔥 HITUNG KEMBALIAN
      const change = customer.amountPaid - totalAmount;

      // C. Insert Order Header
      const [insertedOrder] = await tx
        .insert(orders)
        .values({
          totalAmount,
          orderType: customer.orderType,
          paymentMethod: customer.paymentMethod,

          // 👇 FIX: Masukkan variable angkanya, bukan Zod Schema
          amountPaid: customer.amountPaid,
          change: change, // Pastikan kolom ini ada di schema.ts kamu

          customerName: customer.customerName || 'Guest',
          customerPhone: customer.customerPhone || null,
          tableNumber: finalTableNumber,
          queueNumber: nextQueueNumber,
        })
        .returning();

      // D. Insert Items & Update Stock
      for (const item of items) {
        const productInfo = await tx.query.products.findFirst({
          where: eq(products.id, item.id),
          columns: {
            name: true,
            sku: true,
            costPrice: true,
            stock: true,
          },
        });

        if (!productInfo) {
          throw new Error(`Produk ID ${item.id} tidak ditemukan`);
        }

        if (productInfo.stock < item.quantity) {
          throw new Error(
            `Stok untuk produk "${productInfo.name}" tidak mencukupi.`
          );
        }

        await tx.insert(orderItems).values({
          orderId: insertedOrder.id,
          productId: item.id,
          quantity: item.quantity,
          priceAtTime: item.price,
          costPriceAtTime: productInfo.costPrice || '0',
          productNameSnapshot: productInfo.name,
          skuSnapshot: productInfo.sku || null,
        });

        // Kurangi Stok
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

    return {
      success: true,
      message: 'Transaksi Berhasil!',
      data: result,
    };
  } catch (error) {
    console.error('Checkout Error:', error);

    // Tips: Jika error manual yang kita throw di atas, pesan errornya akan muncul di sini
    const errorMessage =
      error instanceof Error ? error.message : 'Gagal memproses transaksi.';

    return {
      success: false,
      message: errorMessage,
    };
  }
}
