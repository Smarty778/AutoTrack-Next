import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const { name, username, email, password, city, phone } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email or username already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const newAdmin = await prisma.user.create({
      data: {
        name: name || 'System Admin',
        username,
        email,
        passwordHash: hashedPassword,
        role: 'ADMIN',
        city: city || 'Headquarters',
        phone: phone || '+92 300 1111111',
        avatarColor: 'bg-purple-700',
        active: true,
        customPermissions: {
          create: {
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
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      admin: newAdmin,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}