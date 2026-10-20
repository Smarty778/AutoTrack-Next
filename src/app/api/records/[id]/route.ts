import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const updates = await req.json();
    const db = loadDB();
    const index = db.records.findIndex(r => r.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    db.records[index] = { ...db.records[index], ...updates, updatedAt: new Date().toISOString() };
    saveDB(db);
    return NextResponse.json(db.records[index]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const db = loadDB();
  db.records = db.records.filter(r => r.id !== id);
  saveDB(db);
  return NextResponse.json({ success: true });
}
