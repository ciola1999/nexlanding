// E:\Belajar Javascript\.vscode\Project-Freelance\nexlanding\frontend\src\features\smart-pos\db\schema.ts

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
export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'debit',
  'qris',
  'split',
]);
// BARU: Enum untuk tipe diskon
export const discountTypeEnum = pgEnum('discount_type', [
  'PERCENTAGE',
  'FIXED',
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

// --- NEW TABLES (FITUR BARU) ---

// 1. Members (Pelanggan)
export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: varchar('phone', { length: 20 }).unique().notNull(), // Kunci utama identifikasi
  email: text('email'),
  points: integer('points').default(0), // Loyalty points
  tier: text('tier').default('Silver'), // Silver, Gold, Platinum (Optional)
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Discounts (Voucher / Promo)
export const discounts = pgTable('discounts', {
  id: serial('id').primaryKey(),
  code: text('code').unique().notNull(), // Misal: "MEMBER10"
  name: text('name').notNull(),
  type: discountTypeEnum('type').notNull(), // Persen atau Potongan Langsung
  value: decimal('value', { precision: 10, scale: 2 }).notNull(), // 10.00 (10%) atau 5000 (5rb)
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true),
});

// 3. Taxes (Pajak dinamis)
export const taxes = pgTable('taxes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // "PPn", "Service Charge"
  rate: decimal('rate', { precision: 5, scale: 2 }).notNull(), // 11.00 artinya 11%
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- TRANSACTIONS ---

export const orderPayments = pgTable('order_payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  paymentMethod: text('payment_method').notNull(),
  amount: integer('amount').notNull(),
  referenceId: text('reference_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// UPDATE: Tabel Orders dengan Detail Keuangan
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),

  // -- Relasi Baru --
  memberId: integer('member_id').references(() => members.id, {
    onDelete: 'set null',
  }),
  discountId: integer('discount_id').references(() => discounts.id, {
    onDelete: 'set null',
  }),
  cashierId: integer('cashier_id').references(() => users.id),

  // -- Snapshot Keuangan (PENTING untuk Struk & Laporan) --
  // Subtotal = Total harga barang sebelum diskon & pajak
  subtotal: integer('subtotal').notNull().default(0),

  // Nominal Diskon yang didapat (misal: 5000)
  discountAmount: integer('discount_amount').default(0),

  // Nominal Pajak (misal: Subtotal - Diskon * 11%)
  taxAmount: integer('tax_amount').default(0),

  // Grand Total = Subtotal - Diskon + Pajak (Yang harus dibayar)
  totalAmount: integer('total_amount').notNull(),

  // Snapshot nama pajak & rate saat transaksi terjadi (Agar jika PPn naik, history aman)
  taxNameSnapshot: text('tax_name_snapshot'),
  taxRateSnapshot: decimal('tax_rate_snapshot', { precision: 5, scale: 2 }),

  // -- Info Umum --
  orderType: orderTypeEnum('order_type').default('dine_in').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('cash'),
  amountPaid: integer('amount_paid').notNull(),
  change: integer('change').notNull().default(0), // Kembalian

  tableNumber: text('table_number'),
  customerName: text('customer_name'), // Bisa ambil dari member atau input manual
  customerPhone: varchar('customer_phone', { length: 20 }),
  queueNumber: integer('queue_number').notNull().default(1),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- ITEMS (Sama, update dikit) ---
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
  priceAtTime: integer('price_at_time').notNull(), // Harga satuan saat beli
  costPriceAtTime: decimal('cost_price_at_time', {
    precision: 15,
    scale: 2,
  }).default('0'),
});

// --- STORE SETTINGS (Update: Hapus taxRate hardcode, ganti relasi logic di kode) ---
export const storeSettings = pgTable('store_settings', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().default('Toko Saya'),
  description: text('description'),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  email: text('email'),
  website: text('website'),
  logoUrl: text('logo_url'),
  currency: varchar('currency', { length: 3 }).default('IDR'),
  receiptFooter: text('receipt_footer').default(
    'Terima kasih telah berbelanja!'
  ),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// --- RELATIONS ---
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  payments: many(orderPayments),
  cashier: one(users, {
    fields: [orders.cashierId],
    references: [users.id],
  }),
  member: one(members, {
    // Relasi Member
    fields: [orders.memberId],
    references: [members.id],
  }),
  discount: one(discounts, {
    // Relasi Diskon
    fields: [orders.discountId],
    references: [discounts.id],
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
export type StoreSetting = typeof storeSettings.$inferSelect;
export type Member = typeof members.$inferSelect; // Type Baru
export type Discount = typeof discounts.$inferSelect; // Type Baru
export type Tax = typeof taxes.$inferSelect; // Type Baru
