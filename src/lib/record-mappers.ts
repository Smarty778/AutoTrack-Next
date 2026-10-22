// lib/record-mappers.ts
import { RecordStatus, TrackerStatus } from '@prisma/client';

const STATUS_TO_PRISMA: Record<string, RecordStatus> = {
  Continued: 'CONTINUED',
  Pending: 'PENDING',
  Removal: 'REMOVAL',
  Removed: 'REMOVED',
  'In Progress': 'IN_PROGRESS',
  CONTINUED: 'CONTINUED',
  PENDING: 'PENDING',
  REMOVAL: 'REMOVAL',
  REMOVED: 'REMOVED',
  IN_PROGRESS: 'IN_PROGRESS',
};

const TRACKER_STATUS_TO_PRISMA: Record<string, TrackerStatus> = {
  Active: 'ACTIVE',
  NR: 'NR',
  Testing: 'TESTING',
  Standby: 'STANDBY',
  Removed: 'REMOVED',
  Decommissioned: 'DECOMMISSIONED',
  ACTIVE: 'ACTIVE',
  TESTING: 'TESTING',
  STANDBY: 'STANDBY',
  REMOVED: 'REMOVED',
  DECOMMISSIONED: 'DECOMMISSIONED',
};

export function toPrismaStatus(s?: string): RecordStatus {
  if (!s) return 'PENDING';
  return STATUS_TO_PRISMA[s] ?? STATUS_TO_PRISMA[s.toUpperCase()] ?? 'PENDING';
}

export function toPrismaTrackerStatus(s?: string): TrackerStatus {
  if (!s) return 'ACTIVE';
  return (
    TRACKER_STATUS_TO_PRISMA[s] ??
    TRACKER_STATUS_TO_PRISMA[s.toUpperCase()] ??
    'ACTIVE'
  );
}

/** Only the scalar fields that exist on the TrackerRecord model */
export function sanitizeRecordInput(body: any) {
  return {
    regNo: body.regNo,
    customerName: body.customerName,
    make: body.make ?? '',
    model: body.model ?? '',
    year: String(body.year ?? ''),
    color: body.color ?? '',
    contact1: body.contact1 ?? '',
    contactPerson: body.contactPerson ?? '',
    engine: body.engine ?? '',
    chassis: body.chassis ?? '',
    insurance: body.insurance ?? '',
    date: body.date ?? '',
    salesPerson: body.salesPerson ?? 'Unassigned',
    assignedToUserId: body.assignedToUserId || null,
    technicianName: body.technicianName ?? '',
    orderNo: body.orderNo ?? '',
    instCity: body.instCity ?? '',
    showroom: body.showroom ?? '',
    cnicNo: body.cnicNo ?? '',
    insStatus: body.insStatus ?? '',
    dateOfInstallation: body.dateOfInstallation ?? '',
    dueDate: body.dueDate ?? '',
    status: toPrismaStatus(body.status),
    statusChangedAt: body.statusChangedAt
      ? new Date(body.statusChangedAt)
      : new Date(),
    statusChangedBy: body.statusChangedBy ?? null,
    statusChangedByUserId: body.statusChangedByUserId ?? null,
    coordinatedBy: body.coordinatedBy ?? body.salesPerson ?? '',
    remarks: body.remarks ?? '',
    unit: body.unit ?? '',
    trackerStatus: toPrismaTrackerStatus(body.trackerStatus),
  };
}