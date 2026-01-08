'use server';

import { db } from '@/db'; // Pastikan path import db benar
import { orders, orderItems, products } from '@/features/smart-pos/db/schema';
import { revalidatePath } from 'next/cache';
import { eq, sql, and, gte, desc } from 'drizzle-orm';

type CheckoutItem = {
  id: number; // Product ID
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
) {
  if (!items.length) {
    return { success: false, message: 'Keranjang kosong' };
  }

  // Validasi Meja (Wajib)
  if (!customer.tableNumber) {
    return { success: false, message: 'Nomor Meja/Kursi wajib diisi!' };
  }

  try {
    // KITA PAKAI TRANSACTION BIAR DATA KONSISTEN
    await db.transaction(async (tx) => {
      // --- LOGIC 1: HITUNG QUEUE NUMBER (DAILY RESET) ---

      // 1. Set jam 00:00:00 hari ini
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // 2. Cari order terakhir yang dibuat HARI INI
      const lastOrderToday = await tx.query.orders.findFirst({
        where: gte(orders.createdAt, startOfDay),
        orderBy: [desc(orders.queueNumber)], // Urutkan dari nomor antrian terbesar
        columns: { queueNumber: true }, // Kita cuma butuh nomornya
      });

      // 3. Jika belum ada order hari ini, mulai dari 1. Jika ada, tambah 1.
      const nextQueueNumber = (lastOrderToday?.queueNumber ?? 0) + 1;

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

          // Masukkan Data Baru
          tableNumber: customer.tableNumber,
          customerName: customer.customerName || 'Guest', // Default Guest jika kosong
          customerPhone: customer.customerPhone || null,
          queueNumber: nextQueueNumber,

          // Todo: Nanti ambil dari session auth
          // cashierId: session.user.id
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
