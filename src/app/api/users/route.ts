import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, hashPassword } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { normalizeIdentity, MIN_PASSWORD_LENGTH, USERNAME_RE, EMAIL_RE } from '@/lib/validators';

const permissionSelect = {
  isCustom: true,
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
};
const PERMISSION_KEYS = Object.keys(permissionSelect).filter((key) => key !== 'isCustom');
const publicUserSelect = {
  id: true, name: true, username: true, email: true, role: true,
  city: true, phone: true, avatarColor: true, active: true, createdAt: true,
  customPermissions: { select: permissionSelect },
};

function cleanPermissions(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const permissions: Record<string, boolean> = {};
  for (const key of PERMISSION_KEYS) {
    if (typeof source[key] === 'boolean') permissions[key] = source[key] as boolean;
  }
  return permissions;
}
function toPublicUser(user: any) {
  const { customPermissions, ...details } = user;
  const permissions = customPermissions?.isCustom
    ? Object.fromEntries(PERMISSION_KEYS.map((key) => [key, customPermissions[key]]))
    : null;
  return { ...details, role: String(details.role).toLowerCase(), customPermissions: permissions };
}
function adminOnly(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return { auth: null, response: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }) };
  if (auth.role !== 'ADMIN') return { auth, response: NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 }) };
  return { auth, response: null };
}

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const users = auth.role === 'ADMIN'
      ? await prisma.user.findMany({ select: publicUserSelect, orderBy: { createdAt: 'desc' } })
      : await prisma.user.findMany({ where: { id: auth.id }, select: publicUserSelect });
    return NextResponse.json(users.map(toPublicUser));
  } catch (error) {
    console.error('GET /api/users failed:', error);
    return NextResponse.json({ success: false, message: 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { response } = adminOnly(req);
  if (response) return response;
  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const username = normalizeIdentity(body.username);
    const email = normalizeIdentity(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const avatarColor = typeof body.avatarColor === 'string' ? body.avatarColor : 'bg-blue-600';

    if (!name || !username || !email || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ success: false, message: `Name, username, email and a password of at least ${MIN_PASSWORD_LENGTH} characters are required` }, { status: 400 });
    }
    if (!USERNAME_RE.test(username)) return NextResponse.json({ success: false, message: 'Username must be 3-30 characters: letters, numbers, dot or underscore' }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ success: false, message: 'Enter a valid email address' }, { status: 400 });

    const existing = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] }, select: { username: true, email: true } });
    if (existing) return NextResponse.json({ success: false, message: 'Username or email already exists' }, { status: 409 });

    const role = String(body.role).toUpperCase() === 'ADMIN' ? UserRole.ADMIN : UserRole.USER;
    const user = await prisma.user.create({
      data: { name, username, email, passwordHash: await hashPassword(password), role, city: city || null, phone: phone || null, avatarColor, active: true },
      select: publicUserSelect,
    });
    return NextResponse.json({ success: true, user: toPublicUser(user) }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') return NextResponse.json({ success: false, message: 'Username or email already exists' }, { status: 409 });
    console.error('POST /api/users failed:', error);
    return NextResponse.json({ success: false, message: 'Failed to create user' }, { status: 500 });
  }
}

// Admin-only account management: reset a password, change active state, or set/clear per-user permissions.
export async function PATCH(req: NextRequest) {
  const { auth, response } = adminOnly(req);
  if (response) return response;
  try {
    const body = await req.json();
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    if (!userId) return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, name: true, active: true, role: true } });
    if (!existing) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    if (typeof body.newPassword === 'string') {
      if (body.newPassword.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json({ success: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }, { status: 400 });
      }
      await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(body.newPassword) } });
      return NextResponse.json({ success: true, message: 'Password reset successfully. The current password cannot be retrieved.' });
    }

    if (body.clearCustomPermissions === true) {
      await prisma.agentPermissions.deleteMany({ where: { userId } });
      return NextResponse.json({ success: true, message: 'User now inherits the global permission policy' });
    }

    if (body.customPermissions !== undefined) {
      const permissions = cleanPermissions(body.customPermissions);
      if (!Object.keys(permissions).length) return NextResponse.json({ success: false, message: 'No valid permission values provided' }, { status: 400 });
      const data = { ...permissions, isCustom: true };
      const updated = await prisma.agentPermissions.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
        select: permissionSelect,
      });
      return NextResponse.json({ success: true, customPermissions: Object.fromEntries(PERMISSION_KEYS.map((key) => [key, updated[key as keyof typeof updated]])) });
    }

    if (typeof body.active === 'boolean') {
      if (userId === auth?.id && body.active === false) return NextResponse.json({ success: false, message: 'You cannot deactivate your own account while signed in' }, { status: 400 });
      if (existing.role === UserRole.ADMIN && body.active === false) {
        const activeAdmins = await prisma.user.count({ where: { role: UserRole.ADMIN, active: true } });
        if (activeAdmins <= 1) return NextResponse.json({ success: false, message: 'The last active admin cannot be deactivated' }, { status: 400 });
      }
      const user = await prisma.user.update({ where: { id: userId }, data: { active: body.active }, select: publicUserSelect });
      return NextResponse.json({ success: true, user: toPublicUser(user) });
    }

    return NextResponse.json({ success: false, message: 'No supported user change was provided' }, { status: 400 });
  } catch (error) {
    console.error('PATCH /api/users failed:', error);
    return NextResponse.json({ success: false, message: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { auth, response } = adminOnly(req);
  if (response) return response;
  try {
    const body = await req.json();
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    if (!userId) return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    if (userId === auth?.id) return NextResponse.json({ success: false, message: 'You cannot delete your own signed-in account' }, { status: 400 });
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, username: true } });
    if (!target) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    if (target.role === UserRole.ADMIN) {
      const adminCount = await prisma.user.count({ where: { role: UserRole.ADMIN } });
      if (adminCount <= 1) return NextResponse.json({ success: false, message: 'The last admin account cannot be deleted' }, { status: 400 });
    }
    await prisma.$transaction(async (tx) => {
      await tx.trackerRecord.updateMany({
        where: { assignedToUserId: userId },
        data: { assignedToUserId: null, salesPerson: 'Unassigned', coordinatedBy: 'Unassigned' },
      });
      await tx.user.delete({ where: { id: userId } });
      await tx.auditLog.create({
        data: {
          action: 'DELETE_USER',
          details: `Admin deleted account ${target.name} (@${target.username}). Assigned records were unassigned.`,
          actorId: auth?.id,
          actorName: auth?.username || 'Admin',
        },
      });
    });
    return NextResponse.json({ success: true, deletedUserId: userId });
  } catch (error) {
    console.error('DELETE /api/users failed:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete user' }, { status: 500 });
  }
}
