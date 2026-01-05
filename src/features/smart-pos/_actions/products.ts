'use server';

import { db } from '@/db';
import { products } from '@/features/smart-pos/db/schema';
import { desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Helper: Bikin angka acak
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Helper: Pilih item acak dari array
const randomChoice = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

// 1. ACTION: Tambah 1 Product Acak (Dynamic Seeding)
export async function seedDummyProducts() {
  try {
    // Bank kata-kata untuk generate nama acak
    const prefixes = ['Ice', 'Hot', 'Premium', 'Double', 'Royal', 'Spicy'];
    const items = [
      'Latte',
      'Cappuccino',
      'Croissant',
      'Burger',
      'Pasta',
      'Tea',
      'Smoothie',
    ];
    const suffixes = [
      'Special',
      'Deluxe',
      'Hazelnut',
      'Caramel',
      'Cheese',
      'Original',
    ];

    // Generate data unik
    const name = `${randomChoice(prefixes)} ${randomChoice(
      items
    )} ${randomChoice(suffixes)}`;
    const uniqueId = Date.now().toString().slice(-4) + randomInt(10, 99); // ID Unik dari waktu
    const sku = `${items[0].substring(0, 3).toUpperCase()}-${uniqueId}`; // Contoh: LAT-9923

    const newProduct = {
      name: name,
      description: `Deskripsi otomatis untuk ${name}. Dibuat pada ${new Date().toLocaleTimeString()}.`,
      price: randomInt(15, 75) * 1000, // Harga kelipatan 1000 (15rb - 75rb)
      stock: randomInt(0, 100), // Stok 0 - 100
      sku: sku,
      isActive: Math.random() > 0.2, // 80% kemungkinan aktif
    };

    await db.insert(products).values(newProduct);

    revalidatePath('/projects/smart-pos');
    return { success: true, message: `Berhasil menambah: ${name}` };
  } catch (error) {
    console.error('Seed Error:', error);
    return { success: false, message: 'Gagal menambah data.' };
  }
}

// 2. ACTION: Hapus Semua Data (Reset)
export async function deleteAllProducts() {
  try {
    await db.delete(products);

    revalidatePath('/projects/smart-pos');
    return { success: true, message: 'Semua data berhasil dihapus!' };
  } catch (error) {
    console.error('Delete Error:', error);
    return { success: false, message: 'Gagal menghapus data.' };
  }
}

// 3. ACTION: Get Data (Tetap sama)
export async function getProducts() {
  try {
    const data = await db.select().from(products).orderBy(desc(products.id));
    return { success: true, data };
  } catch (error) {
    return { success: false, data: [] };
  }
}
