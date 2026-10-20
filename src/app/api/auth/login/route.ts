import { NextRequest, NextResponse } from 'next/server';
import { loadDB } from '@/lib/db';
import { signToken, userWithPermissions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const db = loadDB();
    const user = db.users.find(
      u => (u.username === username || u.email === username) && u.passwordHash === password && u.active
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials or inactive account' },
        { status: 401 }
      );
    }

    const token = signToken(user);
    const res = NextResponse.json({ success: true, token, user: userWithPermissions(user) });
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
