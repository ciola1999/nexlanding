'use server';

import { db } from '@/db';
import { orders } from '@/features/smart-pos/db/schema'; // Import dari schema.ts kamu
import { sql, gte, count } from 'drizzle-orm';

export async function getDashboardMetrics() {
  // 1. Setup Tanggal (Hari ini & 7 Hari lalu)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset ke jam 00:00

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    // --- QUERY A: Statistik Hari Ini ---
    // Mengambil Total Penjualan & Jumlah Order hari ini dari tabel 'orders'
    const todayStats = await db
      .select({
        totalRevenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`, // Pakai coalesce biar kalau null jadi 0
        totalOrders: count(orders.id),
      })
      .from(orders)
      .where(gte(orders.createdAt, today));

    // --- QUERY B: Tren Penjualan 7 Hari Terakhir (Untuk Grafik) ---
    const salesTrend = await db
      .select({
        // Format tanggal untuk Label Grafik (contoh: "06 Jan")
        dateLabel: sql<string>`to_char(${orders.createdAt}, 'DD Mon')`,
        // Tanggal mentah untuk sorting yang benar
        rawDate: sql<string>`date_trunc('day', ${orders.createdAt})`,
        // Total penjualan per hari
        revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, sevenDaysAgo))
      .groupBy(
        sql`date_trunc('day', ${orders.createdAt})`,
        sql`to_char(${orders.createdAt}, 'DD Mon')`
      )
      .orderBy(sql`date_trunc('day', ${orders.createdAt})`);

    return {
      success: true,
      data: {
        revenueToday: Number(todayStats[0]?.totalRevenue || 0),
        ordersToday: Number(todayStats[0]?.totalOrders || 0),
        // Mapping data untuk Recharts
        chartData: salesTrend.map((item) => ({
          name: item.dateLabel,
          value: Number(item.revenue),
        })),
      },
    };
  } catch (error) {
    console.error('Dashboard Error:', error);
    return { success: false, error: 'Gagal mengambil data dashboard' };
  }
}
