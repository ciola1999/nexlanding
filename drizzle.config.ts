// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load .env manual karena drizzle-kit berjalan di luar Next.js context
dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: ['./src/features/smart-pos/db/schema.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
