import { PrismaClient, UserRole, RecordStatus, TrackerStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting AutoTrack database seeding...');

  // 1. Seed Users (Master Admin + Sales Reps)
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: 'user-admin',
      name: 'Master Admin (AutoTrack Head)',
      username: 'admin',
      email: 'autotrack321@gmail.com',
      passwordHash: '$2b$10$YourHashedPasswordHereOrPlainTextForDev',
      role: UserRole.ADMIN,
      phone: '+92 300 8291000',
      city: 'Head Office - Lahore',
      avatarColor: 'bg-slate-900',
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
  });

  const bilalUser = await prisma.user.upsert({
    where: { username: 'bilal' },
    update: {},
    create: {
      id: 'user-bilal',
      name: 'Bilal Ahmed',
      username: 'bilal',
      email: 'bilal@autotrack.com',
      passwordHash: '$2b$10$YourHashedPasswordHereOrPlainTextForDev',
      role: UserRole.USER,
      phone: '+92 301 5544123',
      city: 'Karachi',
      avatarColor: 'bg-blue-600',
      active: true,
      customPermissions: {
        create: {
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
        },
      },
    },
  });

  const tariqUser = await prisma.user.upsert({
    where: { username: 'tariq' },
    update: {},
    create: {
      id: 'user-tariq',
      name: 'Tariq Khan',
      username: 'tariq',
      email: 'tariq@autotrack.com',
      passwordHash: '$2b$10$YourHashedPasswordHereOrPlainTextForDev',
      role: UserRole.USER,
      phone: '+92 333 4419821',
      city: 'Lahore',
      avatarColor: 'bg-emerald-600',
      active: true,
    },
  });

  // 2. Seed Master Vehicle Tracker Records (Covering all 5 Statuses)
  const sampleRecords = [
    {
      id: 'rec-101',
      regNo: 'LEA-21-9921',
      customerName: 'Muhammad Tariq',
      make: 'Toyota',
      model: 'Corolla Altis 1.6',
      year: '2021',
      color: 'Super White',
      contact1: '+92 300 1234567',
      contactPerson: 'Muhammad Tariq (Self)',
      engine: '1ZR-891024',
      chassis: 'NZE140-5029182',
      insurance: 'EFU General Insurance',
      date: '2026-01-15',
      salesPerson: 'Bilal Ahmed',
      assignedToUserId: bilalUser.id,
      technicianName: 'Sajid Tech',
      orderNo: 'ORD-9901',
      instCity: 'Lahore',
      showroom: 'Toyota Defence Motors',
      cnicNo: '35201-1234567-1',
      insStatus: 'Comprehensive Active',
      dateOfInstallation: '2026-01-15',
      dueDate: '2026-11-20',
      status: RecordStatus.CONTINUED,
      statusChangedAt: new Date(Date.now() - 3600000 * 2),
      statusChangedBy: 'bilal',
      statusChangedByUserId: bilalUser.id,
      coordinatedBy: 'Bilal Ahmed',
      remarks: 'Customer renewed annual subscription. GPS ping verified active.',
      unit: 'Concox GT06N Pro',
      trackerStatus: TrackerStatus.ACTIVE,
    },
    {
      id: 'rec-102',
      regNo: 'KHI-22-4012',
      customerName: 'Farhan Akhtar',
      make: 'Honda',
      model: 'Civic Oriel 1.5 Turbo',
      year: '2022',
      color: 'Crystal Black',
      contact1: '+92 321 9876543',
      contactPerson: 'Farhan Akhtar',
      engine: 'L15B-441029',
      chassis: 'FC1-2039481',
      insurance: 'Adamjee Insurance',
      date: '2026-02-10',
      salesPerson: 'Tariq Khan',
      assignedToUserId: tariqUser.id,
      technicianName: 'Kamran Tech',
      orderNo: 'ORD-9902',
      instCity: 'Karachi',
      showroom: 'Honda South Karachi',
      cnicNo: '42101-9876543-3',
      insStatus: 'Policy In Process',
      dateOfInstallation: '2026-02-10',
      dueDate: '2026-10-25',
      status: RecordStatus.PENDING,
      statusChangedAt: new Date(Date.now() - 3600000 * 5),
      statusChangedBy: 'admin',
      statusChangedByUserId: adminUser.id,
      coordinatedBy: 'Tariq Khan',
      remarks: 'Follow-up pending for annual payment renewal cheque.',
      unit: 'Teltonika FMB920',
      trackerStatus: TrackerStatus.ACTIVE,
    },
    {
      id: 'rec-104',
      regNo: 'LHR-19-5532',
      customerName: 'Chaudhry Imran Ali',
      make: 'Toyota',
      model: 'Hilux Revo Rocco',
      year: '2019',
      color: 'Attitude Black',
      contact1: '+92 301 8877665',
      contactPerson: 'Manager Asif',
      engine: '1GD-993214',
      chassis: 'GUN126-7782190',
      insurance: 'Jubilee General',
      date: '2025-11-12',
      salesPerson: 'Master Admin',
      assignedToUserId: adminUser.id,
      technicianName: 'Sajid Tech',
      orderNo: 'ORD-9904',
      instCity: 'Faisalabad',
      showroom: 'Direct Customer Fleet',
      cnicNo: '33100-8877665-7',
      insStatus: 'Decommissioned',
      dateOfInstallation: '2025-11-12',
      dueDate: '2026-09-15',
      status: RecordStatus.REMOVED,
      statusChangedAt: new Date(Date.now() - 3600000 * 24),
      statusChangedBy: 'admin',
      statusChangedByUserId: adminUser.id,
      coordinatedBy: 'Master Admin',
      remarks: 'Device retrieved and returned to stock warehouse by technician.',
      unit: 'Teltonika FMC130',
      trackerStatus: TrackerStatus.REMOVED,
    },
  ];

  for (const rec of sampleRecords) {
    await prisma.trackerRecord.upsert({
      where: { regNo: rec.regNo },
      update: {},
      create: rec,
    });
  }

  // 3. Seed Audit Log
  await prisma.auditLog.create({
    data: {
      action: 'System Initialized',
      details: 'Initialized AutoTrack master database with initial schema and roles.',
      actorName: 'System',
      actorId: adminUser.id,
    },
  });

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
