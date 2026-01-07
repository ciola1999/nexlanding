// scripts/seed-user.ts
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from '../features/smart-pos/db/schema';
import argon2 from 'argon2';

// 1. Definisikan Tipe Error Postgres minimal (supaya tidak pakai any)
interface PgError {
  code?: string;
  message: string;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL tidak ditemukan di .env');
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  console.log('🌱 Sedang menghubungkan ke database...');

  try {
    const passwordPlain = 'admin123';
    const hashedPassword = await argon2.hash(passwordPlain);

    console.log('🔐 Password berhasil di-hash...');

    const result = await db
      .insert(users)
      .values({
        name: 'Super Admin',
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        avatarUrl:
          'https://ui-avatars.com/api/?name=Super+Admin&background=dfff4f&color=000',
      })
      .returning();

    console.log('✅ Berhasil membuat user baru:');
    console.log({
      id: result[0].id,
      username: result[0].username,
      role: result[0].role,
    });
  } catch (err: unknown) {
    // 👇 CARA BENAR: Casting error ke tipe unknown dulu, lalu assert
    const error = err as PgError;

    // Kode error '23505' adalah Unique Violation di Postgres
    if (error.code === '23505') {
      console.log(
        '⚠️  User dengan username tersebut sudah ada. Tidak perlu seed ulang.'
      );
    } else {
      console.error('❌ Gagal seeding user:', error);
    }
  } finally {
    await pool.end();
    console.log('👋 Koneksi ditutup.');
  }
}

main();
