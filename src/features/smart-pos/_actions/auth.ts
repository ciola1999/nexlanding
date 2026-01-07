// src/features/smart-pos/_actions/auth.ts
'use server';

import { db } from '@/db'; // Sesuaikan path DB instance kamu (biasanya di src/db/index.ts)
import { users } from '@/features/smart-pos/db/schema'; // Path ke schema yang baru kita update
import { eq } from 'drizzle-orm';
import { verifyPassword, createSession, deleteSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export type AuthState = {
  success: boolean;
  message?: string;
  errors?: {
    username?: string[];
    password?: string[];
  };
};

export async function loginAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  // 1. Validasi Sederhana
  if (!username || !password) {
    return {
      success: false,
      message: 'Mohon isi username dan password.',
    };
  }

  try {
    // 2. Cari User di DB
    // Pastikan kamu sudah setup variable 'db' (drizzle instance)
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    const user = foundUsers[0];

    if (!user) {
      return { success: false, message: 'Username tidak ditemukan.' };
    }

    if (!user.isActive) {
      return { success: false, message: 'Akun ini sedang non-aktif.' };
    }

    // 3. Cek Password
    const isValid = await verifyPassword(user.password, password);

    if (!isValid) {
      return { success: false, message: 'Password salah.' };
    }

    // 4. Buat Session
    await createSession({
      userId: user.id,
      role: user.role,
      name: user.name,
    });
  } catch (error) {
    console.error('Login Error:', error);
    return { success: false, message: 'Terjadi kesalahan sistem.' };
  }

  // 5. Redirect (Harus di luar try-catch di Next.js)
  redirect('/projects/smart-pos');
}

export async function logoutAction() {
  await deleteSession();
  redirect('/projects/smart-pos/login');
}
