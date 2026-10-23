import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signToken } from '@/lib/auth';
import {
  BCRYPT_ROUNDS,
  EMAIL_RE,
  MIN_PASSWORD_LENGTH,
  USERNAME_RE,
  normalizeIdentity,
  optionalStr,
  str,
} from '@/lib/validators';

const fail = (message: string, status: number) =>
  NextResponse.json({ success: false, message }, { status });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return fail('Invalid request body', 400);
    }

    // Only these fields are ever read. `role`, `active`, permissions etc.
    // sent by a client are ignored, so public sign-up can never create an admin.
    const name = str(body.name);
    const username = normalizeIdentity(body.username);
    const email = normalizeIdentity(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    const phone = optionalStr(body.phone);
    const city = optionalStr(body.city);

    // ---- Validation ----
    if (!name || !username || !email || !password) {
      return fail('Name, username, email and password are required', 400);
    }
    if (!USERNAME_RE.test(username)) {
      return fail(
        'Username must be 3-30 characters: letters, numbers, dot or underscore',
        400
      );
    }
    if (!EMAIL_RE.test(email)) {
      return fail('Enter a valid email address', 400);
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return fail(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
    }

    // ---- Uniqueness ----
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { username: true },
    });
    if (existing) {
      const field = existing.username === username ? 'Username' : 'Email';
      return fail(`${field} is already taken`, 409);
    }

    // ---- Create user (role is hard-coded to USER) ----
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

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
      },
      include: { customPermissions: { select: { isCustom: true } } },
    });

    // Audit failure must not turn a successful sign-up into an error.
    try {
      await prisma.auditLog.create({
        data: {
          action: 'User Registered',
          details: `New account created: ${user.username} (${user.email})`,
          actorId: user.id,
          actorName: user.name,
        },
      });
    } catch (auditErr) {
      console.error('Register audit log failed:', auditErr);
    }

    // ---- Sign in immediately (cookie only, same as login) ----
    const token = signToken(user);

    const res = NextResponse.json(
      {
        success: true,
        message: 'Account created successfully.',
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          city: user.city,
          phone: user.phone,
          avatarColor: user.avatarColor,
          active: user.active,
          permissions: null,
          customPermissions: null,
        },
      },
      { status: 201 }
    );

    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return res;
  } catch (err: any) {
    // Race: unique constraint hit between the check and the insert
    if (err?.code === 'P2002') {
      return fail('Username or email is already taken', 409);
    }
    console.error('Register API error:', err);
    return fail('Registration failed due to a server error.', 500);
  }
}