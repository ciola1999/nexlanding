import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
// Nanti kita buat file schema.ts, sementara biarkan kosong atau comment dulu
import * as smartPosSchema from '../features/smart-pos/db/schema';

const schema = {
  ...smartPosSchema,
  // Nanti kalau ada project ke-2, tinggal tambah:
  // ...projectDuaSchema,
};

const connectionString = process.env.DATABASE_URL!;

/**
 * Cache koneksi database di global object supaya
 * tidak membuat koneksi baru setiap kali Next.js melakukan hot-reload
 */
const globalQueryClient = global as unknown as { queryClient: postgres.Sql };

const client = globalQueryClient.queryClient || postgres(connectionString);

if (process.env.NODE_ENV !== 'production') {
  globalQueryClient.queryClient = client;
}

// Masukkan schema ke sini agar autocomplete drizzle bekerja
export const db = drizzle(client, {
  schema,
});
