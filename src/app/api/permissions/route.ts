import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import type { AgentPermissions } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PERMISSION_KEYS = [
  'canEditStatus', 'canEditTrackerStatus', 'canEditRemarks', 'canEditDueDate',
  'canEditContactInfo', 'canEditInsurance', 'canEditVehicleSpecs',
  'canEditEngineChassis', 'canEditHardwareUnit', 'canEditTechnicianCity',
  'canEditOrderNoDate', 'canCreateNewRecords', 'canDeleteRecords',
  'canReassignSalesPerson',
] as const;

const DEFAULT_PERMISSIONS: AgentPermissions = {
  canEditStatus: true,
  canEditTrackerStatus: true,
  canEditRemarks: true,
  canEditDueDate: true,
  canEditContactInfo: true,
  canEditInsurance: false,
  canEditVehicleSpecs: false,
  canEditEngineChassis: false,
  canEditHardwareUnit: false,
  canEditTechnicianCity: false,
  canEditOrderNoDate: false,
  canCreateNewRecords: true,
  canDeleteRecords: false,
  canReassignSalesPerson: false,
};
const SETTING_KEY = 'global_agent_permissions';

function sanitizePermissions(input: unknown): Partial<AgentPermissions> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const source = input as Record<string, unknown>;
  const output: Partial<AgentPermissions> = {};
  for (const key of PERMISSION_KEYS) {
    if (typeof source[key] === 'boolean') output[key] = source[key] as never;
  }
  return output;
}

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } });
    const stored = sanitizePermissions(setting?.value);
    return NextResponse.json({ success: true, permissions: { ...DEFAULT_PERMISSIONS, ...stored } });
  } catch (error) {
    console.error('GET /api/permissions failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to load permission policy' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const updates = sanitizePermissions(body?.permissions ?? body);
    if (!Object.keys(updates).length) {
      return NextResponse.json({ success: false, message: 'No valid permission fields provided' }, { status: 400 });
    }

    const existing = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } });
    const permissions = { ...DEFAULT_PERMISSIONS, ...sanitizePermissions(existing?.value), ...updates };
    await prisma.$transaction([
      prisma.appSetting.upsert({
        where: { key: SETTING_KEY },
        create: { key: SETTING_KEY, value: permissions as any },
        update: { value: permissions as any },
      }),
      prisma.agentPermissions.updateMany({ where: { isCustom: false }, data: permissions }),
    ]);

    return NextResponse.json({ success: true, permissions });
  } catch (error) {
    console.error('PUT /api/permissions failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to save permission policy' }, { status: 500 });
  }
}
