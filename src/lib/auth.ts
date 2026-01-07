// src/lib/auth.ts
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import argon2 from 'argon2';

// ⚠️ Ganti string acak ini dengan process.env.AUTH_SECRET di production!
const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'rahasia_dapur_nexpos_super_secure'
);
const COOKIE_NAME = 'nexpos_session';

// 1. Password Hashing (Argon2)
export async function hashPassword(password: string) {
  return await argon2.hash(password);
}

export async function verifyPassword(hash: string, plain: string) {
  try {
    return await argon2.verify(hash, plain);
  } catch (e) {
    return false;
  }
}

// 2. Session Management (JWT)
export async function createSession(payload: {
  userId: number;
  role: string;
  name: string;
}) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h') // Shift kerja max 12 jam
    .sign(SECRET_KEY);

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 jam
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as {
      userId: number;
      role: 'admin' | 'cashier';
      name: string;
    };
  } catch (error) {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
