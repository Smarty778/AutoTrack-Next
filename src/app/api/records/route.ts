import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { sanitizeRecordInput } from '@/lib/record-mappers';
import { getEffectiveAgentPermissions } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const actor = auth.role === 'ADMIN'
      ? null
      : await prisma.user.findUnique({ where: { id: auth.id }, select: { name: true } });
    const where = auth.role === 'ADMIN'
      ? {}
      : {
          OR: [
            { assignedToUserId: auth.id },
            ...(actor?.name ? [{ salesPerson: { equals: actor.name, mode: 'insensitive' as const } }] : []),
            { salesPerson: { equals: auth.username, mode: 'insensitive' as const } },
          ],
        };
    const records = await prisma.trackerRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedToUser: { select: { id: true, name: true, username: true } },
      },
    });
    return NextResponse.json(records);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'A valid JSON object is required' }, { status: 400 });
    }
    const data = sanitizeRecordInput(body);

    if (auth.role !== 'ADMIN') {
      const policy = await getEffectiveAgentPermissions(auth.id);
      if (!policy.canCreateNewRecords) {
        return NextResponse.json({ error: 'Your account is not allowed to create vehicle records' }, { status: 403 });
      }
      const actor = await prisma.user.findUnique({ where: { id: auth.id }, select: { name: true } });
      data.assignedToUserId = auth.id;
      data.salesPerson = actor?.name || auth.username;
      data.coordinatedBy = actor?.name || auth.username;
    }

    // required fields check (optional but useful)
    if (!data.regNo || !data.customerName) {
      return NextResponse.json({ error: 'regNo and customerName are required' }, { status: 400 });
    }

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.trackerRecord.create({
        data: {
          ...data,
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
    console.error('POST /api/records error:', err);
    // Unique constraint on regNo is the most common failure after enums
    if (err.code === 'P2002') {
      return NextResponse.json({ error: `Registration number already exists` }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}