import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const updates = await req.json();

    delete updates.id;
    delete updates.createdAt;
    delete updates.updatedAt;

    const existingRecord = await prisma.trackerRecord.findUnique({ where: { id } });
    if (!existingRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const isStatusChanged = updates.status && updates.status !== existingRecord.status;

    const updated = await prisma.$transaction(async (tx) => {
      if (isStatusChanged) {
        updates.statusChangedAt = new Date();
        updates.statusChangedBy = auth.username;
        updates.statusChangedByUserId = auth.id;

        await tx.statusChangeLog.create({
          data: {
            recordId: id,
            previousStatus: existingRecord.status,
            newStatus: updates.status,
            changedByUserId: auth.id,
            changedByName: auth.username,
            changedByUsername: auth.username,
            remarks: updates.remarks || 'Status modified',
          },
        });
      }

      const res = await tx.trackerRecord.update({
        where: { id },
        data: updates,
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE_RECORD',
          details: `Updated record ID: ${id}`,
          actorId: auth.id,
          actorName: auth.username,
          recordId: id,
          recordRegNo: existingRecord.regNo,
        },
      });

      return res;
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = verifyAuth(req);
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const { id } = await params;

    const record = await prisma.trackerRecord.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.auditLog.create({
        data: {
          action: 'DELETE_RECORD',
          details: `Deleted record regNo: ${record.regNo}`,
          actorId: auth.id,
          actorName: auth.username,
          recordRegNo: record.regNo,
        },
      }),
      prisma.trackerRecord.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}