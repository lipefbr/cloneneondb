import { db } from './db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE = 'neondb_session';
const SESSION_EXPIRY_DAYS = 7;

// Simple JWT-like token using HMAC (no external dep needed)
function signToken(payload: object): string {
  const secret = process.env.NEXTAUTH_SECRET || 'neondb-dev-secret-change-me';
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const secret = process.env.NEXTAUTH_SECRET || 'neondb-dev-secret-change-me';
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, email: string) {
  const expires = Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const token = signToken({ userId, email, exp: expires });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    if (!payload) return null;
    if (payload.exp && payload.exp < Date.now()) return null;
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, plan: true, avatarUrl: true, company: true, createdAt: true },
    });
    return user;
  } catch {
    return null;
  }
}

export function generateApiKey(): string {
  return `neon_${crypto.randomBytes(24).toString('hex')}`;
}

export function generateDbPassword(): string {
  return crypto.randomBytes(16).toString('base64url').slice(0, 22);
}

export function generateProjectSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || `proj-${Math.random().toString(36).slice(2, 8)}`;
}
