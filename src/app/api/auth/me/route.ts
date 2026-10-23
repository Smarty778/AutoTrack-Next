import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        id: auth.id,
        active: true,
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
        customPermissions: {
          select: {
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
            isCustom: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found or inactive' }, { status: 404 });
    }

    const { customPermissions, ...safeUser } = user;
    const permissions = customPermissions?.isCustom
      ? Object.fromEntries(Object.entries(customPermissions).filter(([key]) => key !== 'isCustom' && key !== 'id' && key !== 'userId' && key !== 'createdAt' && key !== 'updatedAt'))
      : null;
    return NextResponse.json({
      success: true,
      user: { ...safeUser, role: safeUser.role.toLowerCase(), customPermissions: permissions, permissions },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}