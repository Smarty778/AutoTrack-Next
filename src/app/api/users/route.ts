import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/db';
import { publicUser } from '@/lib/auth';

export async function GET() {
  return NextResponse.json(loadDB().users.map(publicUser));
}

export async function POST(req: NextRequest) {
  try {
    const { name, username, email, password, role, city, phone, avatarColor } = await req.json();
    const db = loadDB();

    if (db.users.some(u => u.username === username || u.email === email)) {
      return NextResponse.json(
        { success: false, message: 'Username or email already exists' },
        { status: 400 }
      );
    }

    const newUser = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      name,
      username,
      email,
      passwordHash: password || 'user123',
      role: role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER',
      city: city || 'Lahore',
      phone: phone || '',
      avatarColor: avatarColor || 'bg-blue-600',
      active: true,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDB(db);

    return NextResponse.json({ success: true, user: publicUser(newUser) });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
