import jwt from 'jsonwebtoken';
import type { NextRequest } from 'next/server';

export const JWT_SECRET = process.env.JWT_SECRET || 'autotrack_secure_jwt_secret_2026';

const ADMIN_PERMISSIONS = {
  canEditStatus: true,
  canEditTrackerStatus: true,
  canEditRemarks: true,
  canEditDueDate: true,
  canEditContactInfo: true,
  canEditInsurance: true,
  canEditVehicleSpecs: true,
  canEditEngineChassis: true,
  canEditHardwareUnit: true,
  canEditTechnicianCity: true,
  canEditOrderNoDate: true,
  canCreateNewRecords: true,
  canDeleteRecords: true,
  canReassignSalesPerson: true,
  canManageUsers: true,
};

const USER_PERMISSIONS = {
  canEditStatus: true,
  canEditTrackerStatus: false,
  canEditRemarks: true,
  canEditDueDate: false,
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
  canManageUsers: false,
};

export function publicUser(u: any) {
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    role: String(u.role).toLowerCase(),
    city: u.city,
    phone: u.phone,
    avatarColor: u.avatarColor,
    active: u.active,
  };
}

export function userWithPermissions(u: any) {
  const isAdmin = String(u.role).toUpperCase() === 'ADMIN';
  return { ...publicUser(u), permissions: isAdmin ? ADMIN_PERMISSIONS : USER_PERMISSIONS };
}

export function signToken(u: any) {
  return jwt.sign(
    { id: u.id, username: u.username, email: u.email, role: u.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function getTokenFromRequest(req: NextRequest): string | undefined {
  return req.cookies.get('token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
}
