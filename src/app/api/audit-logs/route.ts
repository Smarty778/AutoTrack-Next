import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/db';

export async function GET() {
  return NextResponse.json(loadDB().auditLogs || []);
}

export async function POST(req: NextRequest) {
  try {
    const l = await req.json();
    const db = loadDB();
    const newLog = {
      ...l,
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };
    db.auditLogs.unshift(newLog);
    saveDB(db);
    return NextResponse.json(newLog);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
