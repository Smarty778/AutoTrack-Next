import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import {
  sanitizeRecordInput,
  toPrismaStatus,
  toPrismaTrackerStatus,
} from '@/lib/record-mappers';
import { getEffectiveAgentPermissions, isFieldChangeAllowed } from '@/lib/permissions';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'A valid JSON object is required' }, { status: 400 });
    }

    // Strip UI-only / non-schema fields
    delete body.id;
    delete body.createdAt;
    delete body.updatedAt;
    delete body.statusChangedRecordId;
    delete body.createdBy;
    delete body.assignedToUser; // relation object, not a scalar

    const existingRecord = await prisma.trackerRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    if (auth.role !== 'ADMIN') {
      const actor = await prisma.user.findUnique({ where: { id: auth.id }, select: { name: true } });
      const allowedNames = [actor?.name, auth.username].filter(Boolean).map((value) => String(value).trim().toLowerCase());
      const assignedToAgent = existingRecord.assignedToUserId === auth.id
        || allowedNames.includes(String(existingRecord.salesPerson || '').trim().toLowerCase());
      if (!assignedToAgent) {
        return NextResponse.json({ error: 'You can only edit records assigned to your account' }, { status: 403 });
      }
    }

    // Enforce field-level permissions at the API boundary too; UI locks alone are not security.
    if (auth.role !== 'ADMIN') {
      const permissions = await getEffectiveAgentPermissions(auth.id);
      const fieldsToCheck = [
        'status', 'trackerStatus', 'remarks', 'dueDate', 'customerName', 'contact1',
        'contactPerson', 'cnicNo', 'insurance', 'insStatus', 'regNo', 'make', 'model',
        'year', 'color', 'engine', 'chassis', 'unit', 'technicianName', 'instCity',
        'showroom', 'orderNo', 'date', 'dateOfInstallation', 'coordinatedBy',
        'salesPerson', 'assignedToUserId',
      ];
      const before = existingRecord as unknown as Record<string, unknown>;
      const after = { ...(body as Record<string, unknown>) };
      if (after.status !== undefined) after.status = toPrismaStatus(String(after.status));
      if (after.trackerStatus !== undefined) after.trackerStatus = toPrismaTrackerStatus(String(after.trackerStatus));
      const denied = fieldsToCheck.find((field) => !isFieldChangeAllowed(field, before, after, permissions));
      if (denied) {
        return NextResponse.json({ error: `You do not have permission to edit ${denied}` }, { status: 403 });
      }
      // Server owns status-change metadata; never trust client-supplied audit values.
      delete body.statusChangedAt;
      delete body.statusChangedBy;
      delete body.statusChangedByUserId;
    }

    // Detect real status change (UI string → Prisma enum)
    const incomingStatus = body.status
      ? toPrismaStatus(body.status)
      : existingRecord.status;

    const isStatusChanged = incomingStatus !== existingRecord.status;

    // Status-change audit metadata is always generated server-side.
    delete body.statusChangedAt;
    delete body.statusChangedBy;
    delete body.statusChangedByUserId;

    // Build a clean Prisma-compatible update object
    const prismaUpdates = sanitizeRecordInput({
      ...existingRecord,
      ...body,
    });

    // Never allow overwriting the primary key or createdBy
    delete (prismaUpdates as any).id;
    delete (prismaUpdates as any).createdById;

    // Force correct enums
    prismaUpdates.status = incomingStatus;
    if (body.trackerStatus !== undefined) {
      prismaUpdates.trackerStatus = toPrismaTrackerStatus(body.trackerStatus);
    }

    // Handle status-change side effects
    if (isStatusChanged) {
      prismaUpdates.statusChangedAt = new Date();
      prismaUpdates.statusChangedBy = auth.username;
      prismaUpdates.statusChangedByUserId = auth.id;
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isStatusChanged) {
        await tx.statusChangeLog.create({
          data: {
            recordId: id,
            previousStatus: existingRecord.status,
            newStatus: incomingStatus,
            changedByUserId: auth.id,
            changedByName: auth.username,
            changedByUsername: auth.username,
            remarks: body.remarks || 'Status modified',
          },
        });
      }

      const res = await tx.trackerRecord.update({
        where: { id },
        data: prismaUpdates,
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE_RECORD',
          details: `Updated record ID: ${id}${
            isStatusChanged ? ` (status → ${incomingStatus})` : ''
          }`,
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
    console.error('PUT /api/records/[id] error:', err);

    // Unique constraint violation on regNo
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Registration number already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: err.message || 'Update failed' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const record = await prisma.trackerRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    if (auth.role !== 'ADMIN') {
      const permissions = await getEffectiveAgentPermissions(auth.id);
      if (!permissions.canDeleteRecords) {
        return NextResponse.json({ error: 'Your account is not allowed to delete vehicle records' }, { status: 403 });
      }
      if (record.assignedToUserId !== auth.id) {
        return NextResponse.json({ error: 'You can delete only records assigned to your account' }, { status: 403 });
      }
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
    console.error('DELETE /api/records/[id] error:', err);
    return NextResponse.json(
      { error: err.message || 'Delete failed' },
      { status: 500 }
    );
  }
}