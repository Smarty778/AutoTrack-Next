import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; // if your lib/auth uses 'bcrypt', change this import to match
import { prisma } from '@/lib/db';
import { signToken } from '@/lib/auth';

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = String(body.name ?? '').trim();
    const username = String(body.username ?? '').trim().toLowerCase();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const phone = body.phone ? String(body.phone).trim() : null;
    const city = body.city ? String(body.city).trim() : null;

    // ---- Validation ----
    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, username, email and password are required' },
        { status: 400 }
      );
    }
    if (!USERNAME_RE.test(username)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Username must be 3-30 characters: letters, numbers, dot or underscore',
        },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Enter a valid email address' },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // ---- Uniqueness ----
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { username: true, email: true },
    });
    if (existing) {
      const field = existing.username === username ? 'Username' : 'Email';
      return NextResponse.json(
        { success: false, message: `${field} is already taken` },
        { status: 409 }
      );
    }

    // ---- Create user ----
    // Role is always USER here. Public sign-up must never be able to create admins;
    // promote users to ADMIN from an admin-only endpoint or directly in the DB.
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        passwordHash,
        phone,
        city,
        role: 'USER',
        active: true,
        customPermissions: {
          create: {}, // uses schema defaults (STANDARD-like permissions)
        },
      },
      include: { customPermissions: true },
    });

    await prisma.auditLog.create({
      data: {
        action: 'User Registered',
        details: `New account created: ${user.username} (${user.email})`,
        actorId: user.id,
        actorName: user.name,
      },
    });

    // ---- Sign in immediately ----
    const token = signToken(user);

    const safeUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      city: user.city,
      phone: user.phone,
      avatarColor: user.avatarColor,
      permissions: user.customPermissions,
    };

    const res = NextResponse.json({ success: true, token, user: safeUser }, { status: 201 });
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return res;
  } catch (err: any) {
    // Race condition: unique constraint hit between the check and the insert
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Username or email is already taken' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: err?.message || 'Registration failed' },
      { status: 500 }
    );
  }
}