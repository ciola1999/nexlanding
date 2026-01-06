import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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

// 1. TABEL TRANSAKSI (HEAD)
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  totalAmount: integer('total_amount').notNull(), // Total belanja
  paymentMethod: text('payment_method').default('CASH').notNull(), // CASH / QRIS
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. TABEL ITEM TRANSAKSI (DETAIL)
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id)
    .notNull(), // Link ke tabel orders
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(), // Link ke tabel products
  quantity: integer('quantity').notNull(),
  priceAtTime: integer('price_at_time').notNull(), // Harga saat dibeli (penting jika harga produk berubah nanti)
});

// 3. RELASI (Untuk memudahkan query nanti)
export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
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

// 1. Tipe Data Order (Head)
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

// 2. Tipe Data Order Item (Detail)
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
