import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const jobCard = await prisma.jobCard.findUnique({
      where: { id },
      include: {
        record: {
          select: {
            id: true,
            regNo: true,
            customerName: true,
            make: true,
            model: true,
            year: true,
            color: true,
            contact1: true,
            contactPerson: true,
            engine: true,
            chassis: true,
            technicianName: true,
            instCity: true,
            unit: true,
          },
        },
      },
    });

    if (!jobCard) {
      return NextResponse.json({ error: 'Job card not found' }, { status: 404 });
    }

    // Non-admin access check
    if (auth.role !== 'ADMIN') {
      const record = await prisma.trackerRecord.findUnique({
        where: { id: jobCard.recordId },
        select: { assignedToUserId: true, salesPerson: true },
      });
      const actor = await prisma.user.findUnique({ where: { id: auth.id }, select: { name: true } });
      const ownerNames = [actor?.name, auth.username].filter(Boolean).map((value) => String(value).trim().toLowerCase());
      if (record?.assignedToUserId !== auth.id && !ownerNames.includes(String(record?.salesPerson || '').trim().toLowerCase())) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(jobCard);
  } catch (err: any) {
    console.error('GET /api/job-cards/[id] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.jobCard.findUnique({
      where: { id },
      include: { record: { select: { assignedToUserId: true, salesPerson: true, regNo: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Job card not found' }, { status: 404 });
    }

    // Non-admin access check. The salesperson-name fallback supports legacy rows that predate user-ID assignment.
    if (auth.role !== 'ADMIN' && existing.record.assignedToUserId !== auth.id) {
      const actor = await prisma.user.findUnique({ where: { id: auth.id }, select: { name: true } });
      const ownerNames = [actor?.name, auth.username].filter(Boolean).map((value) => String(value).trim().toLowerCase());
      if (!ownerNames.includes(String(existing.record.salesPerson || '').trim().toLowerCase())) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Sanitize updatable fields
    const data: any = {};
    if (body.jobType !== undefined) data.jobType = body.jobType;
    if (body.technicianName !== undefined) data.technicianName = body.technicianName;
    if (body.installationCity !== undefined) data.installationCity = body.installationCity;
    if (body.scheduledDate !== undefined) {
      data.scheduledDate = body.scheduledDate ? new Date(body.scheduledDate) : null;
    }
    if (body.completedDate !== undefined) {
      data.completedDate = body.completedDate ? new Date(body.completedDate) : null;
    }
    if (body.status !== undefined) data.status = body.status;
    if (body.odometerReading !== undefined) data.odometerReading = body.odometerReading;
    if (body.imeiNumber !== undefined) data.imeiNumber = body.imeiNumber;
    if (body.simNumber !== undefined) data.simNumber = body.simNumber;
    if (body.notes !== undefined) data.notes = body.notes;

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.jobCard.update({
        where: { id },
        data,
        include: {
          record: {
            select: {
              id: true,
              regNo: true,
              customerName: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE_JOB_CARD',
          details: `Updated job card ${existing.jobCardNo} (${existing.record.regNo})`,
          actorId: auth.id,
          actorName: auth.username,
          recordId: existing.recordId,
          recordRegNo: existing.record.regNo,
        },
      });

      return res;
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('PUT /api/job-cards/[id] error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = verifyAuth(req);
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;

    const jobCard = await prisma.jobCard.findUnique({
      where: { id },
      include: { record: { select: { regNo: true } } },
    });

    if (!jobCard) {
      return NextResponse.json({ error: 'Job card not found' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.auditLog.create({
        data: {
          action: 'DELETE_JOB_CARD',
          details: `Deleted job card ${jobCard.jobCardNo} for regNo: ${jobCard.record.regNo}`,
          actorId: auth.id,
          actorName: auth.username,
          recordRegNo: jobCard.record.regNo,
        },
      }),
      prisma.jobCard.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/job-cards/[id] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}