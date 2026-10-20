import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/db';

export async function GET() {
  return NextResponse.json(loadDB().records || []);
}

export async function POST(req: NextRequest) {
  try {
    const r = await req.json();
    const db = loadDB();
    const newRecord = {
      ...r,
      id: r.id || 'rec-' + Math.random().toString(36).substring(2, 9),
      statusChangedAt: r.statusChangedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.records.unshift(newRecord);
    saveDB(db);
    return NextResponse.json(newRecord);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
