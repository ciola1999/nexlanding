'use server';

import { db } from '@/db';
import { products, orderItems, orders } from '@/features/smart-pos/db/schema';
import { desc, asc, inArray, SQL, sql } from 'drizzle-orm';
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

// --- 1. TYPE GUARD (Penjaga Tipe untuk Error) ---
// Interface ini mendefinisikan bentuk Error dari Database/Drizzle
interface DatabaseError {
  code?: string;
  cause?: {
    code?: string;
  };
}

// Fungsi pengecek apakah error ini valid Object error
function isDatabaseError(error: unknown): error is DatabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('code' in error || 'cause' in error)
  );
}

export type ActionState = {
  success?: boolean;
  message?: string;
  errors?: {
    [key: string]: string[];
  };
};

export async function getProducts(
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  try {
    let orderBy: SQL | undefined;

    // Logic Sorting: Memilih kolom berdasarkan input user
    switch (sortBy) {
      case 'stock':
        orderBy =
          sortOrder === 'asc' ? asc(products.stock) : desc(products.stock);
        break;
      case 'price': // Harga Jual
        orderBy =
          sortOrder === 'asc' ? asc(products.price) : desc(products.price);
        break;
      case 'costPrice': // Harga Pokok (Decimal)
        // Kita gunakan SQL Cast agar decimal string diurutkan secara numeric, bukan abjad
        // (Misal: tanpa cast, "100" dianggap lebih kecil dari "2")
        orderBy =
          sortOrder === 'asc'
            ? sql`${products.costPrice}::numeric ASC`
            : sql`${products.costPrice}::numeric DESC`;
        break;
      case 'name':
        orderBy =
          sortOrder === 'asc' ? asc(products.name) : desc(products.name);
        break;
      case 'createdAt':
      default:
        // Default: Urutkan tanggal pembuatan (Terbaru diatas)
        orderBy =
          sortOrder === 'asc'
            ? asc(products.createdAt)
            : desc(products.createdAt);
        break;
    }

    const data = await db.select().from(products).orderBy(orderBy);

    return { success: true, data };
  } catch (error) {
    console.error('Get Products Error:', error);
    return { success: false, data: [] };
  }
}

// --- 3. ACTION: Delete Products (SMART DELETE & TYPE SAFE) ---
export async function deleteProductsAction(ids: number[]) {
  try {
    if (ids.length === 0) {
      return { success: false, message: 'Tidak ada produk dipilih' };
    }

    // A. COBA HAPUS PERMANEN (HARD DELETE)
    await db.delete(products).where(inArray(products.id, ids));

    revalidatePath('/projects/smart-pos');

    return {
      success: true,
      message: `Berhasil menghapus permanen ${ids.length} produk.`,
    };
  } catch (error: unknown) {
    // Gunakan 'unknown' agar aman

    // B. PENANGANAN ERROR TYPE-SAFE
    if (isDatabaseError(error)) {
      // Ambil kode error, baik dari level atas maupun dari wrapper Drizzle (.cause)
      const errorCode = error.code || error.cause?.code;

      // Code '23503' = Foreign Key Violation (Data dipakai di tabel lain)
      if (errorCode === '23503') {
        console.log(
          'Produk terkunci relasi transaksi. Beralih ke Soft Delete...'
        );

        try {
          // C. FALLBACK: SOFT DELETE (ARCHIVE)
          await db
            .update(products)
            .set({ isActive: false })
            .where(inArray(products.id, ids));

          revalidatePath('/projects/smart-pos');

          return {
            success: true,
            message:
              'Produk memiliki riwayat transaksi. Produk telah DIARSIPKAN (Non-Aktif) agar data aman.',
          };
        } catch (updateError) {
          console.error('Soft Delete Gagal:', updateError);
          return { success: false, message: 'Gagal mengarsipkan produk.' };
        }
      }
    }

    // Log error lain yang tidak terduga
    console.error('Delete error (Unknown):', error);
    return {
      success: false,
      message: 'Terjadi kesalahan sistem saat menghapus.',
    };
  }
}

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
