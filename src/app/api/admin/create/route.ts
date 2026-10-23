import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  BCRYPT_ROUNDS,
  EMAIL_RE,
  MIN_PASSWORD_LENGTH,
  USERNAME_RE,
  normalizeIdentity,
  optionalStr,
  str,
} from '@/lib/validators';

// Only these permission keys are accepted from the request body.
const PERMISSION_KEYS = [
  'canEditStatus',
  'canEditTrackerStatus',
  'canEditRemarks',
  'canEditDueDate',
  'canEditContactInfo',
  'canEditInsurance',
  'canEditVehicleSpecs',
  'canEditEngineChassis',
  'canEditHardwareUnit',
  'canEditTechnicianCity',
  'canEditOrderNoDate',
  'canCreateNewRecords',
  'canDeleteRecords',
  'canReassignSalesPerson',
] as const;

const ROLES = ['ADMIN', 'USER'] as const;
type Role = (typeof ROLES)[number];

const DEFAULT_AVATAR_COLOR = 'bg-purple-700';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fail = (message: string, status: number) =>
  NextResponse.json({ success: false, message }, { status });

// Open http://localhost:3000/api/admin/create in the browser to check the route is live.
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Route is live. Send a POST request to create an account.',
  });
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  const isAdmin = !!auth && auth.role === 'ADMIN';

  try {
    // Body is read once, up front, so the bootstrap secret can come from it.
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return fail('Invalid request body', 400);
    }

    // ---- Bootstrap: first admin only ----
    // Secret may be sent in the x-bootstrap-secret header OR as
    // "bootstrapSecret" in the JSON body. Works only while zero admins exist.
    let isBootstrap = false;
    if (!isAdmin) {
      const secret = process.env.BOOTSTRAP_SECRET?.trim();
      const supplied = (
        req.headers.get('x-bootstrap-secret') ??
        (typeof body.bootstrapSecret === 'string' ? body.bootstrapSecret : '')
      ).trim();

      if (!secret) {
        return fail('Admin bootstrap is not available. Check server configuration.', 403);
      }
      if (!supplied) {
        return fail('A valid bootstrap credential is required.', 403);
      }
      if (supplied !== secret) {
        return fail('A valid bootstrap credential is required.', 403);
      }

      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount > 0) {
        return fail('Admin bootstrap is no longer available.', 403);
      }
      isBootstrap = true;
    }

    // ---- Basic fields (stored lowercase so login can always find them) ----
    const username = normalizeIdentity(body.username);
    const email = normalizeIdentity(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    const name = str(body.name) || username;
    const city = optionalStr(body.city);
    const phone = optionalStr(body.phone);

    // ---- Dynamic fields ----
    const roleInput = str(body.role).toUpperCase() || 'ADMIN';
    if (!ROLES.includes(roleInput as Role)) {
      return fail(`Role must be one of: ${ROLES.join(', ')}`, 400);
    }
    const role = roleInput as Role;
    if (isBootstrap && role !== 'ADMIN') {
      return fail('The first account must have role ADMIN', 400);
    }

    const avatarColor = optionalStr(body.avatarColor) ?? DEFAULT_AVATAR_COLOR;
    const active = typeof body.active === 'boolean' ? body.active : true;

    // Admins default to every permission true; any boolean key in
    // body.permissions overrides the default.
    const permissions: Record<string, boolean> = {};
    if (role === 'ADMIN') {
      for (const key of PERMISSION_KEYS) permissions[key] = true;
    }
    if (body.permissions && typeof body.permissions === 'object') {
      for (const key of PERMISSION_KEYS) {
        const value = (body.permissions as Record<string, unknown>)[key];
        if (typeof value === 'boolean') permissions[key] = value;
      }
    }

    // ---- Validation ----
    if (!username || !email || !password) {
      return fail('Username, email, and password are required', 400);
    }
    if (!USERNAME_RE.test(username)) {
      return fail(
        'Username must be 3-30 characters: letters, numbers, dot or underscore',
        400
      );
    }
    if (!EMAIL_RE.test(email)) {
      return fail('Enter a valid email address', 400);
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return fail(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { username: true },
    });
    if (existing) {
      const field = existing.username === username ? 'Username' : 'Email';
      return fail(`${field} is already taken`, 409);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const created = await prisma.user.create({
      data: {
        name,
        username,
        email,
        passwordHash,
        role,
        city,
        phone,
        avatarColor,
        active,
        customPermissions: { create: { ...permissions, isCustom: role === 'USER' && Boolean(body.permissions) } },
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        city: true,
        phone: true,
        avatarColor: true,
        active: true,
        createdAt: true,
        customPermissions: { select: { isCustom: true, canEditStatus: true, canEditTrackerStatus: true, canEditRemarks: true, canEditDueDate: true, canEditContactInfo: true, canEditInsurance: true, canEditVehicleSpecs: true, canEditEngineChassis: true, canEditHardwareUnit: true, canEditTechnicianCity: true, canEditOrderNoDate: true, canCreateNewRecords: true, canDeleteRecords: true, canReassignSalesPerson: true } },
      },
    });

    // Audit failure must not turn a successful create into an error.
    try {
      await prisma.auditLog.create({
        data: {
          action: `${role === 'ADMIN' ? 'Admin' : 'User'} Created`,
          details: `${role} account created: ${created.username} (${created.email})`,
          actorId: auth?.id ?? created.id,
          actorName: auth?.username ?? created.name,
        },
      });
    } catch (auditErr) {
      console.error('Create account audit log failed:', auditErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: `${role === 'ADMIN' ? 'Admin' : 'User'} account created successfully`,
        user: {
          ...created,
          customPermissions: created.customPermissions?.isCustom
            ? Object.fromEntries(Object.entries(created.customPermissions).filter(([key]) => key !== 'isCustom'))
            : null,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return fail('Username or email is already taken', 409);
    }
    console.error('Create account API error:', err);
    return fail('Failed to create account.', 500);
  }
}