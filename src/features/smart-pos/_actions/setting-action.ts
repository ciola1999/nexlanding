'use server';

import { db } from '@/db'; // Import dari src/db/index.ts
import { storeSettings } from '@/features/smart-pos/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// --- SCHEMA VALIDASI (ZOD) ---
// Kita buat agak longgar biar user tidak frustasi, tapi tetap type-safe
const settingsFormSchema = z.object({
  name: z.string().min(1, 'Nama toko wajib diisi'),
  description: z.string().optional(),
  address: z.string().min(1, 'Alamat wajib untuk keperluan struk'),
  phone: z.string().optional(),
  email: z
    .string()
    .email('Format email tidak valid')
    .optional()
    .or(z.literal('')),
  receiptFooter: z.string().optional(),
  taxRate: z.string().optional(), // Input number dari HTML biasanya string
});

export type SettingsState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  errors?: Record<string, string[]>;
  timestamp?: number; // Trigger untuk useEffect di client
};

// --- GET SETTINGS ---
export async function getStoreSettings() {
  try {
    // Selalu ambil ID 1
    const settings = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.id, 1))
      .limit(1);

    if (settings.length === 0) return null;
    return settings[0];
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return null;
  }
}

// --- UPDATE SETTINGS ---
export async function updateStoreSettingsAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  // 1. Validasi Input
  const rawData = {
    name: formData.get('name'),
    description: formData.get('description'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    receiptFooter: formData.get('receiptFooter'),
    taxRate: formData.get('taxRate'),
  };

  const validated = settingsFormSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      status: 'error',
      message: 'Mohon periksa kembali input Anda.',
      errors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const data = validated.data;

    // Konversi taxRate ke string decimal yang valid (handle empty)
    const finalTaxRate = data.taxRate ? data.taxRate : '0';

    // 2. Lakukan Upsert (Insert ID 1, kalau konflik ID 1 -> Update)
    await db
      .insert(storeSettings)
      .values({
        id: 1, // FORCE SINGLETON: Selalu pakai ID 1
        name: data.name,
        description: data.description || '',
        address: data.address,
        phone: data.phone || '',
        email: data.email || '',
        receiptFooter: data.receiptFooter || '',
        taxRate: finalTaxRate,
      })
      .onConflictDoUpdate({
        target: storeSettings.id,
        set: {
          name: data.name,
          description: data.description || '',
          address: data.address,
          phone: data.phone || '',
          email: data.email || '',
          receiptFooter: data.receiptFooter || '',
          taxRate: finalTaxRate,
          updatedAt: new Date(),
        },
      });

    revalidatePath('/settings'); // Sesuaikan dengan route halaman kamu nanti

    return {
      status: 'success',
      message: 'Pengaturan toko berhasil diperbarui!',
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Update Error:', error);
    return {
      status: 'error',
      message: 'Terjadi kesalahan sistem saat menyimpan data.',
    };
  }
}
