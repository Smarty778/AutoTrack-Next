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
    const status = searchParams.get('status');
    const technician = searchParams.get('technician');
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200);
    const page = Math.max(Number(searchParams.get('page') || 1), 1);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (recordId) where.recordId = recordId;
    if (status) where.status = status;
    if (technician) {
      where.technicianName = {
        contains: technician,
        mode: 'insensitive',
      };
    }

    // Non-admin: only job cards of records assigned to them
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

    const [jobCards, total] = await Promise.all([
      prisma.jobCard.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          record: {
            select: {
              id: true,
              regNo: true,
              customerName: true,
              make: true,
              model: true,
              contact1: true,
            },
          },
        },
      }),
      prisma.jobCard.count({ where }),
    ]);

    return NextResponse.json({
      data: jobCards,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error('GET /api/job-cards error:', err);
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

    // Basic validation
    if (!body.recordId) {
      return NextResponse.json(
        { error: 'recordId is required' },
        { status: 400 }
      );
    }

    // Check if record exists
    const record = await prisma.trackerRecord.findUnique({
      where: { id: body.recordId },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Tracker record not found' },
        { status: 404 }
      );
    }

    // Non-admin can only create job cards for their assigned records
    if (
      auth.role !== 'ADMIN' &&
      record.assignedToUserId !== auth.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate unique jobCardNo (e.g. JC-20261022-001)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = await prisma.jobCard.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });
    const jobCardNo = `JC-${today}-${String(countToday + 1).padStart(3, '0')}`;

    const jobCard = await prisma.$transaction(async (tx) => {
      const created = await tx.jobCard.create({
        data: {
          jobCardNo,
          recordId: body.recordId,
          jobType: body.jobType || 'Installation',
          technicianName: body.technicianName || record.technicianName || '',
          installationCity: body.installationCity || record.instCity || '',
          scheduledDate: body.scheduledDate
            ? new Date(body.scheduledDate)
            : null,
          completedDate: body.completedDate
            ? new Date(body.completedDate)
            : null,
          status: body.status || 'Pending',
          odometerReading: body.odometerReading || null,
          imeiNumber: body.imeiNumber || null,
          simNumber: body.simNumber || null,
          notes: body.notes || null,
        },
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
          action: 'CREATE_JOB_CARD',
          details: `Created job card ${created.jobCardNo} for regNo: ${record.regNo}`,
          actorId: auth.id,
          actorName: auth.username,
          recordId: record.id,
          recordRegNo: record.regNo,
        },
      });

      return created;
    });

    return NextResponse.json(jobCard, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/job-cards error:', err);

    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Job card number already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}