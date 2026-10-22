import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get('recordId');
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200);
    const page = Math.max(Number(searchParams.get('page') || 1), 1);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (recordId) {
      where.recordId = recordId;
    }

    // Non-admin users can only see logs of records assigned to them
    if (auth.role !== 'ADMIN') {
      const assignedRecords = await prisma.trackerRecord.findMany({
        where: { assignedToUserId: auth.id },
        select: { id: true },
      });
      const allowedIds = assignedRecords.map((r) => r.id);

      if (recordId && !allowedIds.includes(recordId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      where.recordId = recordId
        ? recordId
        : { in: allowedIds };
    }

    const [logs, total] = await Promise.all([
      prisma.statusChangeLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          record: {
            select: {
              id: true,
              regNo: true,
              customerName: true,
            },
          },
          changedByUser: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      }),
      prisma.statusChangeLog.count({ where }),
    ]);

    return NextResponse.json({
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error('GET /api/status-logs error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}