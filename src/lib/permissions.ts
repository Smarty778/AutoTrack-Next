import { prisma } from '@/lib/db';
import type { AgentPermissions } from '@/types';

const PERMISSION_KEYS = [
  'canEditStatus', 'canEditTrackerStatus', 'canEditRemarks', 'canEditDueDate',
  'canEditContactInfo', 'canEditInsurance', 'canEditVehicleSpecs',
  'canEditEngineChassis', 'canEditHardwareUnit', 'canEditTechnicianCity',
  'canEditOrderNoDate', 'canCreateNewRecords', 'canDeleteRecords',
  'canReassignSalesPerson',
] as const;

export const DEFAULT_AGENT_POLICY: AgentPermissions = {
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

function sanitizePermissions(value: unknown): Partial<AgentPermissions> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const clean: Partial<AgentPermissions> = {};
  for (const key of PERMISSION_KEYS) {
    if (typeof input[key] === 'boolean') {
      (clean as Record<string, boolean>)[key] = input[key] as boolean;
    }
  }
  return clean;
}

/** Server-side effective policy; custom agent settings override the global policy. */
export async function getEffectiveAgentPermissions(userId: string): Promise<AgentPermissions> {
  const [user, setting] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { customPermissions: { select: {
        isCustom: true,
        canEditStatus: true, canEditTrackerStatus: true, canEditRemarks: true,
        canEditDueDate: true, canEditContactInfo: true, canEditInsurance: true,
        canEditVehicleSpecs: true, canEditEngineChassis: true, canEditHardwareUnit: true,
        canEditTechnicianCity: true, canEditOrderNoDate: true, canCreateNewRecords: true,
        canDeleteRecords: true, canReassignSalesPerson: true,
      } } },
    }),
    prisma.appSetting.findUnique({ where: { key: 'global_agent_permissions' } }),
  ]);
  const globalPolicy = { ...DEFAULT_AGENT_POLICY, ...sanitizePermissions(setting?.value) };
  const individual = user?.customPermissions?.isCustom
    ? sanitizePermissions(user.customPermissions)
    : {};
  return { ...globalPolicy, ...individual };
}

export function isFieldChangeAllowed(
  field: string,
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
  permissions: AgentPermissions,
): boolean {
  if (!(field in incoming)) return true;
  const oldValue = existing[field];
  const newValue = incoming[field];
  const normalize = (value: unknown) => value == null ? '' : String(value).trim();
  if (normalize(oldValue) === normalize(newValue)) return true;

  const permissionByField: Record<string, keyof AgentPermissions> = {
    status: 'canEditStatus',
    trackerStatus: 'canEditTrackerStatus',
    remarks: 'canEditRemarks',
    dueDate: 'canEditDueDate',
    customerName: 'canEditContactInfo',
    contact1: 'canEditContactInfo',
    contactPerson: 'canEditContactInfo',
    cnicNo: 'canEditContactInfo',
    insurance: 'canEditInsurance',
    insStatus: 'canEditInsurance',
    regNo: 'canEditVehicleSpecs',
    make: 'canEditVehicleSpecs',
    model: 'canEditVehicleSpecs',
    year: 'canEditVehicleSpecs',
    color: 'canEditVehicleSpecs',
    engine: 'canEditEngineChassis',
    chassis: 'canEditEngineChassis',
    unit: 'canEditHardwareUnit',
    technicianName: 'canEditTechnicianCity',
    instCity: 'canEditTechnicianCity',
    showroom: 'canEditTechnicianCity',
    orderNo: 'canEditOrderNoDate',
    date: 'canEditOrderNoDate',
    dateOfInstallation: 'canEditOrderNoDate',
    coordinatedBy: 'canEditOrderNoDate',
    salesPerson: 'canReassignSalesPerson',
    assignedToUserId: 'canReassignSalesPerson',
  };
  const required = permissionByField[field];
  return required ? permissions[required] : true;
}
