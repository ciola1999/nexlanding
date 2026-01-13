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

// --- ENUMS ---
export const roleEnum = pgEnum('role', ['admin', 'cashier']);
export const orderTypeEnum = pgEnum('order_type', ['dine_in', 'take_away']);

// UPDATE 1: Tambahkan 'split' ke dalam Enum
export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'debit',
  'qris',
  'split', // 👈 BARU: Penanda jika pembayaran dipecah
]);

// --- USERS & PRODUCTS (Sama seperti sebelumnya) ---
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  role: roleEnum('role').default('cashier').notNull(),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  price: integer('price').notNull().default(0),
  costPrice: decimal('cost_price', { precision: 15, scale: 2 })
    .notNull()
    .default('0'),
  stock: integer('stock').notNull().default(0),
  sku: text('sku').unique(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// --- BAGIAN UTAMA ---

// 1. Tabel Order Payments (Tetap dibuat untuk menampung detail)
export const orderPayments = pgTable('order_payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),

  // Di sini hanya boleh cash/debit/qris, tidak boleh 'split' lagi
  // Kita pakai text biasa atau buat enum khusus payment_type jika mau strict
  paymentMethod: text('payment_method').notNull(), // 'cash' | 'debit' | 'qris'

  amount: integer('amount').notNull(),
  referenceId: text('reference_id'), // No Kartu / Ref QRIS
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Tabel Orders (TIDAK MENGHAPUS KOLOM)
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  totalAmount: integer('total_amount').notNull(),
  orderType: orderTypeEnum('order_type').default('dine_in').notNull(),

  // ✅ TETAP ADA (Safe & Efficient)
  // Jika single payment: isinya 'cash'/'debit'/'qris'
  // Jika split payment: isinya 'split'
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('cash'),

  amountPaid: integer('amount_paid').notNull(),
  change: integer('change').notNull().default(0),
  tableNumber: text('table_number'),
  customerName: text('customer_name'),
  customerPhone: varchar('customer_phone', { length: 20 }),
  queueNumber: integer('queue_number').notNull().default(1),
  cashierId: integer('cashier_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- ITEMS (Sama) ---
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id').references(() => products.id, {
    onDelete: 'set null',
  }),
  productNameSnapshot: text('product_name_snapshot').notNull(),
  skuSnapshot: text('sku_snapshot'),
  quantity: integer('quantity').notNull(),
  priceAtTime: integer('price_at_time').notNull(),
  costPriceAtTime: decimal('cost_price_at_time', {
    precision: 15,
    scale: 2,
  }).default('0'),
});

// --- RELATIONS ---
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  payments: many(orderPayments), // Relasi ke tabel detail pembayaran
  cashier: one(users, {
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

export const orderPaymentsRelations = relations(orderPayments, ({ one }) => ({
  order: one(orders, {
    fields: [orderPayments.orderId],
    references: [orders.id],
  }),
}));

// --- TYPES ---
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderPayment = typeof orderPayments.$inferSelect;
export type User = typeof users.$inferSelect;
