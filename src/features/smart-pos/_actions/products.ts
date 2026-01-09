'use server';

import { db } from '@/db';
import { products, orderItems, orders } from '@/features/smart-pos/db/schema';
import { desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// Helper: Bikin angka acak
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Helper: Pilih item acak dari array
const randomChoice = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

export type ActionState = {
  success?: boolean;
  message?: string;
  errors?: {
    [key: string]: string[];
  };
};

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
// ACTION: Hapus Semua Data (Reset Total)
export async function deleteAllProducts() {
  try {
    // LANGKAH 1: Hapus detail item transaksi dulu (Anak)
    // Karena tabel ini yang "mengikat" produk
    await db.delete(orderItems);

    // LANGKAH 2: (Opsional) Hapus riwayat ordernya juga biar bersih total
    await db.delete(orders);

    // LANGKAH 3: Sekarang aman untuk menghapus Produk (Induk)
    await db.delete(products);

    revalidatePath('/projects/smart-pos');
    return { success: true, message: 'Database berhasil di-reset total!' };
  } catch (error) {
    console.error('Delete Error:', error);
    // Kita return pesan error aslinya agar bisa dilihat di toast
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Gagal menghapus data karena relasi database.',
    };
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

// React 19 Signature: (prevState, formData)
export async function createProduct(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Simulasi delay biar loading kelihatan (hapus di production)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const imageFile = formData.get('image') as File; // Ambil filenya
  let finalImageUrl = '';

  if (imageFile && imageFile.size > 0) {
    // 1. Buat nama file unik (biar gak bentrok)
    // Contoh: 170882233-kopi-susu.jpg
    const uniqueFileName = `${Date.now()}-${imageFile.name.replaceAll(
      ' ',
      '-'
    )}`;

    // 2. Upload ke Bucket 'products'
    const { data, error: uploadError } = await supabase.storage
      .from('products') // Nama bucket yang kamu buat tadi
      .upload(uniqueFileName, imageFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload Gagal:', uploadError);
      throw new Error('Gagal upload gambar ke Supabase');
    }

    // 3. Ambil Public URL-nya (Link yang bisa dibuka browser)
    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(uniqueFileName);

    finalImageUrl = urlData.publicUrl;
  }
  // --- LOGIKA UPLOAD SUPABASE SELESAI ---

  try {
    const rawData = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      costPrice: formData.get('costPrice') as string,
      price: formData.get('price') as string, // Ambil string dulu
      stock: formData.get('stock') as string,
      description: formData.get('description') as string,
    };

    // Validasi Manual (Bagusnya pakai Zod, tapi ini basic validation)
    if (!rawData.name || !rawData.costPrice || !rawData.price) {
      return {
        success: false,
        message: 'Gagal: Nama, HPP, dan Harga Jual wajib diisi.',
      };
    }

    await db.insert(products).values({
      name: rawData.name,
      sku: rawData.sku,
      costPrice: rawData.costPrice, // Decimal string
      price: parseInt(rawData.price), // Integer (karena schema lama pakai Int)
      stock: parseInt(rawData.stock || '0'),
      description: rawData.description,
      imageUrl: finalImageUrl,
      isActive: true,
    });

    revalidatePath('/projects/smart-pos');

    // Return success state
    return { success: true, message: 'Produk berhasil disimpan ke Database!' };
  } catch (error) {
    console.error('Create Product Error:', error);
    return { success: false, message: 'Terjadi kesalahan server.' };
  }
}
