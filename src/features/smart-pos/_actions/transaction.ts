'use server';

import { db } from '@/db';
import {
  orders,
  orderItems,
  orderPayments, // 👈 UPDATE: Import tabel baru
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

// 1. UPDATE: Struktur Data Pembayaran
type PaymentDetail = {
  method: 'cash' | 'debit' | 'qris';
  amount: number;
  referenceId?: string; // Opsional untuk No Kartu / Ref QRIS
};

// 2. UPDATE: CustomerData sekarang menerima Array Payment
type CustomerData = {
  orderType: 'dine_in' | 'take_away';
  tableNumber: string;
  customerName?: string;
  customerPhone?: string;

  // 🔥 KUNCI SPLIT BILL: Kita terima array, bukan single value
  payments: PaymentDetail[];
};

export async function processCheckout(
  items: CheckoutItem[],
  customer: CustomerData
): Promise<CheckoutResult> {
  // 1. Validasi Input Dasar
  if (!items.length) {
    return { success: false, message: 'Keranjang belanja kosong.' };
  }

  if (!customer.payments || customer.payments.length === 0) {
    return { success: false, message: 'Data pembayaran tidak valid.' };
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

      // B. Hitung Total Tagihan (Total Amount)
      const totalAmount = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // 🔥 UPDATE LOGIC: Hitung Total yang Dibayar (Sum of Array)
      const totalPaid = customer.payments.reduce((sum, p) => sum + p.amount, 0);

      // Cek apakah uang pembayaran kurang
      if (totalPaid < totalAmount) {
        throw new Error(
          `Pembayaran kurang! Total Tagihan: ${totalAmount}, Total Dibayar: ${totalPaid}`
        );
      }

      // Hitung Kembalian
      const change = totalPaid - totalAmount;

      // 🔥 UPDATE LOGIC: Tentukan Payment Method Utama
      // Jika pembayaran lebih dari 1 jenis, tandai sebagai 'split'
      // Jika cuma 1, tandai sesuai metodenya (agar backward compatible)
      const mainPaymentMethod =
        customer.payments.length > 1 ? 'split' : customer.payments[0].method;

      // C. Insert Order Header
      const [insertedOrder] = await tx
        .insert(orders)
        .values({
          totalAmount,
          orderType: customer.orderType,
          paymentMethod: mainPaymentMethod, // 'cash', 'debit', 'qris', atau 'split'

          amountPaid: totalPaid,
          change: change,

          customerName: customer.customerName || 'Guest',
          customerPhone: customer.customerPhone || null,
          tableNumber: finalTableNumber,
          queueNumber: nextQueueNumber,
        })
        .returning();

      // 🔥 D. BARU: Insert Detail Pembayaran (Looping Array)
      for (const pay of customer.payments) {
        await tx.insert(orderPayments).values({
          orderId: insertedOrder.id,
          paymentMethod: pay.method,
          amount: pay.amount,
          referenceId: pay.referenceId || null,
        });
      }

      // E. Insert Items & Update Stock (Tidak berubah)
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

    const errorMessage =
      error instanceof Error ? error.message : 'Gagal memproses transaksi.';

    return {
      success: false,
      message: errorMessage,
    };
  }
}
