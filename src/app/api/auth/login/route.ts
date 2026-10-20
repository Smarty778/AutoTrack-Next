
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const username =
      typeof body?.username === 'string'
        ? body.username.trim().toLowerCase()
        : '';

    const password =
      typeof body?.password === 'string'
        ? body.password
        : '';

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Username/email and password are required.',
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
        ],
        active: true,
      },
      include: {
        customPermissions: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid username/email or password.',
        },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid username/email or password.',
        },
        { status: 401 }
      );
    }

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
      active: user.active,
      permissions: user.customPermissions,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Login successful.',
      user: safeUser,
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

    return NextResponse.json(
      {
        success: false,
        message: 'Login failed due to a server error.',
      },
      { status: 500 }
    );
  }
}