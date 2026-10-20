import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { name, username, email, password, city, phone } = await req.json();
    const db = loadDB();

    if (db.users.some(u => u.email === email || u.username === username)) {
      return NextResponse.json(
        { success: false, message: 'User with this email or username already exists' },
        { status: 400 }
      );
    }

    const newAdmin = {
      id: 'usr-admin-' + Math.random().toString(36).substring(2, 9),
      name: name || 'System Admin',
      username: username || 'admin2',
      email: email || 'admin2@autotrack.com',
      passwordHash: password || 'admin123',
      role: 'ADMIN',
      city: city || 'Headquarters',
      phone: phone || '+92 300 1111111',
      avatarColor: 'bg-purple-700',
      active: true,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newAdmin);
    saveDB(db);

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        username: newAdmin.username,
        email: newAdmin.email,
        role: 'admin',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
