import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, hashPassword } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { normalizeIdentity, MIN_PASSWORD_LENGTH } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (err: any) {
    console.error('GET /api/users error:', err);
    return NextResponse.json({ success: false, message: 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, message: 'Admin access required to create users' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const username = normalizeIdentity(body.username);
    const email = normalizeIdentity(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    const role = body.role;
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const avatarColor = typeof body.avatarColor === 'string' ? body.avatarColor : undefined;

    if (!username || !email || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { success: false, message: `Username, email, and a password of at least ${MIN_PASSWORD_LENGTH} characters are required` },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Username or email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const assignedRole = role?.toUpperCase() === 'ADMIN' ? UserRole.ADMIN : UserRole.USER;

    const newUser = await prisma.user.create({
      data: {
        name: name || username,
        username,
        email,
        passwordHash: hashedPassword,
        role: assignedRole,
        city: city || null,
        phone: phone || null,
        avatarColor: avatarColor || 'bg-blue-600',
        active: true,
        customPermissions: {
          create: {
            canEditStatus: true,
            canEditTrackerStatus: assignedRole === UserRole.ADMIN,
            canEditRemarks: true,
            canEditDueDate: assignedRole === UserRole.ADMIN,
            canEditContactInfo: true,
            canEditInsurance: false,
            canEditVehicleSpecs: false,
            canEditEngineChassis: false,
            canEditHardwareUnit: false,
            canEditTechnicianCity: false,
            canEditOrderNoDate: false,
            canCreateNewRecords: true,
            canDeleteRecords: assignedRole === UserRole.ADMIN,
            canReassignSalesPerson: assignedRole === UserRole.ADMIN,
          },
        },
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
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/users error:', err);
    return NextResponse.json({ success: false, message: 'Failed to create user' }, { status: 500 });
  }
}