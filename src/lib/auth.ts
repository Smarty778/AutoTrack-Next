import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { NextRequest } from 'next/server';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: { id: string; username: string; email: string; role: string }): string {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export function getTokenFromRequest(req: NextRequest): string | undefined {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return req.cookies.get('token')?.value;
}

export function verifyAuth(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret()) as {
      id: string;
      username: string;
      email: string;
      role: 'ADMIN' | 'USER';
    };
  } catch {
    return null;
  }
}