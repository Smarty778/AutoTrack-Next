import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { loadDB } from '@/lib/db';
import { JWT_SECRET, getTokenFromRequest, userWithPermissions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = loadDB().users.find(u => u.id === decoded.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, user: userWithPermissions(user) });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 401 });
  }
}
