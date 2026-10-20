import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const records = await prisma.trackerRecord.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignedToUser: {
          select: { id: true, name: true, username: true },
        },
      },
    });
    return NextResponse.json(records);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.trackerRecord.create({
        data: {
          ...body,
          createdById: auth.id,
          statusChangedBy: auth.username,
          statusChangedByUserId: auth.id,
          statusChangedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE_RECORD',
          details: `Created vehicle record for regNo: ${created.regNo}`,
          actorId: auth.id,
          actorName: auth.username,
          recordId: created.id,
          recordRegNo: created.regNo,
        },
      });

      return created;
    });

    return NextResponse.json(record, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}