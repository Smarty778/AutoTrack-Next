import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth, hashPassword } from '@/lib/auth';
import { UserRole } from '@prisma/client';

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
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
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
    const { name, username, email, password, role, city, phone, avatarColor } = await req.json();

    if (!username || !email) {
      return NextResponse.json(
        { success: false, message: 'Username and email are required' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Username or email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password || 'user123');
    const assignedRole = role?.toUpperCase() === 'ADMIN' ? UserRole.ADMIN : UserRole.USER;

    const newUser = await prisma.user.create({
      data: {
        name: name || username,
        username,
        email,
        passwordHash: hashedPassword,
        role: assignedRole,
        city: city || 'Lahore',
        phone: phone || '',
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
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}