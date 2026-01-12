import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  decimal,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- BAGIAN BARU: AUTHENTICATION ---

// 1. Role Enum: Memastikan role hanya bisa diisi 'admin' atau 'cashier'
// Postgres akan menjaga integritas data ini level database.
export const roleEnum = pgEnum('role', ['admin', 'cashier']);

// --- UPDATE 1: Definisi Enum Baru ---
export const orderTypeEnum = pgEnum('order_type', ['dine_in', 'take_away']);
export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'debit',
  'qris',
]);

// 2. Tabel Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  // Username unik, login kasir lebih cepat ketik username dibanding email
  username: text('username').unique().notNull(),
  password: text('password').notNull(), // Akan di-hash (Argon2)
  role: roleEnum('role').default('cashier').notNull(),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').default(true), // Bisa non-aktifkan kasir tanpa hapus data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// --- BAGIAN LAMA (DENGAN SEDIKIT UPDATE) ---

// Definisi Tabel Products
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  // Existing: Harga Jual (Selling Price)
  // Catatan: Anda pakai integer (Rp), itu oke untuk Rupiah.
  price: integer('price').notNull().default(0),

  // BARU: Harga Pokok (Cost Price)
  // Kita pakai DECIMAL agar presisi untuk perhitungan rata-rata (Average Costing)
  // Contoh: Beli 1 lusin 20.000 -> 1 pcs = 1.666,66 (perlu koma)
  costPrice: decimal('cost_price', { precision: 15, scale: 2 })
    .notNull()
    .default('0'),
  stock: integer('stock').notNull().default(0),
  sku: text('sku').unique(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabel Transaksi (Head)
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  totalAmount: integer('total_amount').notNull(),

  orderType: orderTypeEnum('order_type').default('dine_in').notNull(),

  // UPGRADE DISINI:
  // Sebelumnya kamu pakai varchar, sekarang kita kunci pakai ENUM.
  // Ini bikin kode TypeScript kamu 100% Type-Safe (tidak bisa typo 'debit' jadi 'deibt')
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('cash'),
  amountPaid: integer('amount_paid').notNull(), // 👈 Tambahan: Uang dari konsumen
  change: integer('change').notNull().default(0),

  tableNumber: text('table_number'),

  customerName: text('customer_name'),

  // NOTE: Kolom ini SUDAH ADA, jadi aman untuk fitur WhatsApp nanti.
  // varchar(20) cukup untuk menampung format +62
  customerPhone: varchar('customer_phone', { length: 20 }),

  queueNumber: integer('queue_number').notNull().default(1),
  cashierId: integer('cashier_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabel Item Transaksi (Detail)
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),

  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' }) // Jika order dihapus, item ikut terhapus
    .notNull(),

  // 🔥 UPDATE 1: Foreign Key diubah agar mendukung penghapusan produk
  productId: integer('product_id').references(() => products.id, {
    onDelete: 'set null', // KUNCI UTAMA: Jika produk dihapus, kolom ini jadi NULL
  }),
  // Hapus .notNull() di sini agar valid saat nilainya NULL

  // 🔥 UPDATE 2: Snapshot Nama Produk & SKU
  // Wajib ada, karena jika productId NULL, kita ambil nama dari sini untuk UI
  productNameSnapshot: text('product_name_snapshot').notNull(),
  skuSnapshot: text('sku_snapshot'), // Opsional, berguna untuk audit gudang

  quantity: integer('quantity').notNull(),

  // Kamu sudah punya ini (Bagus!)
  priceAtTime: integer('price_at_time').notNull(),

  // Kamu sudah punya ini (Bagus!)
  costPriceAtTime: decimal('cost_price_at_time', {
    precision: 15,
    scale: 2,
  }).default('0'),
});

// --- RELASI (UPDATED) ---

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders), // Satu user (kasir) bisa punya banyak transaksi
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  cashier: one(users, {
    // Relasi balik: Order milik satu kasir
    fields: [orders.cashierId],
    references: [users.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// --- TIPE DATA EXPORT ---

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

// Tipe Data User
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
