import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

// Definisi Tabel Products
export const products = pgTable('products', {
  id: serial('id').primaryKey(),

  // Informasi Dasar
  name: text('name').notNull(),
  description: text('description'),

  // Harga disimpan dalam integer (Rupiah penuh) untuk menghindari masalah floating point
  // Contoh: Rp 15.000 disimpan sebagai 15000
  price: integer('price').notNull().default(0),

  // Manajemen Stok
  stock: integer('stock').notNull().default(0),
  sku: text('sku').unique(), // Kode unik untuk barcode scanner nanti

  // Metadata
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tipe data untuk TypeScript (Inferensi otomatis)
// Ini akan sangat berguna saat kita memakai data ini di Component UI
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
