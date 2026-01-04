'use server';

import { db } from '@/db';
import { products } from '@/db/schema';
import { revalidatePath } from 'next/cache';

export async function seedDummyProducts() {
  try {
    // Data dummy untuk cafe/resto
    const dummyData = [
      {
        name: 'Kopi Susu Gula Aren',
        description: 'Espresso dengan susu segar dan gula aren asli.',
        price: 18000,
        stock: 50,
        sku: 'KOPI-001',
        isActive: true,
      },
      {
        name: 'Croissant Butter',
        description: 'Roti sabit khas Perancis dengan butter premium.',
        price: 25000,
        stock: 20,
        sku: 'FOOD-001',
        isActive: true,
      },
      {
        name: 'Ice Matcha Latte',
        description: 'Matcha import Jepang dengan susu creamy.',
        price: 24000,
        stock: 35,
        sku: 'TEA-001',
        isActive: true,
      },
    ];

    // Insert ke database
    await db.insert(products).values(dummyData);

    // Refresh halaman dashboard agar data baru langsung muncul
    revalidatePath('/projects/smart-pos');

    return { success: true, message: 'Berhasil menambahkan 3 produk dummy!' };
  } catch (error: unknown) {
    console.error('Seed Error:', error);
    // Cek duplikasi (jika tombol ditekan 2x)
    let msg = 'Gagal seed data.';
    if (error instanceof Error && error.message.includes('unique constraint')) {
      msg = 'Data sudah ada (SKU duplikat).';
    }

    return { success: false, message: msg };
  }
}
