// types/index.ts
import { products } from '@/features/smart-pos/db/schema';
import { InferSelectModel } from 'drizzle-orm';

export type Product = InferSelectModel<typeof products>;

export type CartItem = Product & {
  quantity: number;
};
