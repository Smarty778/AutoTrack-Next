import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { normalizeIdentity } from '@/lib/validators';

const INVALID = 'Invalid username/email or password.';

// Compared against when no user is found, so "unknown user" and
// "wrong password" take about the same time (avoids user enumeration).
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', 10);

const fail = (message: string, status: number) =>
  NextResponse.json({ success: false, message }, { status });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const identifier = normalizeIdentity(body?.username);
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!identifier || !password) {
      return fail('Username/email and password are required.', 400);
    }

    // No role filter on purpose: ADMIN and USER accounts both sign in here.
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
        active: true,
      },
      include: { customPermissions: true },
    });

    const passwordMatches = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_HASH
    );

    if (!user || !passwordMatches) {
      return fail(INVALID, 401);
    }

    const token = signToken(user);

    const response = NextResponse.json({
      success: true,
      message: 'Login successful.',
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
        permissions: user.customPermissions,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login API error:', error);
    return fail('Login failed due to a server error.', 500);
  }
}