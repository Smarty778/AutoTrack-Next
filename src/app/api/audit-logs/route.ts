import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const params = req.nextUrl.searchParams;
    const hasFilters = ['from', 'to', 'search', 'take', 'skip'].some((key) => params.has(key));
    const requestedTake = Number(params.get('take') || 1000);
    const requestedSkip = Number(params.get('skip') || 0);
    const take = Number.isFinite(requestedTake) ? Math.min(Math.max(requestedTake, 1), 5000) : 1000;
    const skip = Number.isFinite(requestedSkip) ? Math.max(Math.floor(requestedSkip), 0) : 0;
    const fromValue = params.get('from');
    const toValue = params.get('to');
    const search = (params.get('search') || '').trim();
    const where: Prisma.AuditLogWhereInput = {};

    if (fromValue || toValue) {
      where.timestamp = {};
      if (fromValue) {
        const from = new Date(fromValue);
        if (!Number.isNaN(from.getTime())) where.timestamp.gte = from;
      }
      if (toValue) {
        const to = new Date(toValue);
        if (!Number.isNaN(to.getTime())) where.timestamp.lte = to;
      }
    }
    if (search) {
      where.OR = [
        { actorName: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
        { recordRegNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({ where, orderBy: { timestamp: 'desc' }, take, skip }),
      prisma.auditLog.count({ where }),
    ]);
    if (!hasFilters) return NextResponse.json(logs);
    return NextResponse.json({ success: true, logs, total, take, skip });
  } catch (error) {
    console.error('GET /api/audit-logs failed:', error);
    return NextResponse.json({ error: 'Unable to load audit history' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const action = typeof body.action === 'string' ? body.action.trim() : '';
    const details = typeof body.details === 'string' ? body.details.trim() : '';
    if (!action || !details) return NextResponse.json({ error: 'Action and details are required' }, { status: 400 });

    const log = await prisma.auditLog.create({
      data: {
        action: action.slice(0, 120),
        details: details.slice(0, 5000),
        actorId: auth.id,
        actorName: auth.username,
        recordId: typeof body.recordId === 'string' ? body.recordId : null,
        recordRegNo: typeof body.recordRegNo === 'string' ? body.recordRegNo.slice(0, 80) : null,
      },
    });
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('POST /api/audit-logs failed:', error);
    return NextResponse.json({ error: 'Unable to save audit entry' }, { status: 400 });
  }
}
