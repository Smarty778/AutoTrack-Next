import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(process.cwd(), 'database.json');

export interface DBData {
  users: any[];
  records: any[];
  auditLogs: any[];
}

const ADMIN_EMAIL = 'autotrack321@gmail.com';

function seed(db: DBData): boolean {
  let changed = false;

  if (!db.users.some(u => u.email === ADMIN_EMAIL)) {
    db.users.push({
      id: 'usr-admin-1',
      name: 'System Administrator',
      username: 'admin',
      email: ADMIN_EMAIL,
      passwordHash: 'admin123',
      role: 'ADMIN',
      city: 'Headquarters',
      phone: '+92 300 0000000',
      avatarColor: 'bg-purple-600',
      active: true,
      createdAt: new Date().toISOString(),
    });
    changed = true;
  }

  if (!db.records || db.records.length === 0) {
    const now = new Date().toISOString();
    db.records = [
      {
        id: 'rec-101',
        regNo: 'LEA-21-9921',
        customerName: 'Muhammad Tariq',
        make: 'Toyota',
        model: 'Corolla Altis 1.6',
        year: '2021',
        color: 'Super White',
        contact1: '0300-1234567',
        contactPerson: 'Tariq Bhai',
        engine: '1ZR-FE-883920',
        chassis: 'NKE165-908182',
        insurance: 'IGI General Insurance',
        date: '2021-03-15',
        salesPerson: 'Ali Raza',
        assignedToUserId: 'usr-admin-1',
        technicianName: 'Usman Ghani',
        orderNo: 'ORD-88192',
        instCity: 'Lahore',
        showroom: 'Toyota Central',
        cnicNo: '35202-9988112-1',
        insStatus: 'Active',
        dateOfInstallation: '2021-03-18',
        dueDate: '2026-03-18',
        status: 'Continued',
        coordinatedBy: 'Zainab Bibi',
        remarks: 'Annual subscription renewed successfully. GPS signal excellent.',
        unit: 'Teltonika FMB920',
        trackerStatus: 'ACTIVE',
        statusChangedAt: now,
        statusChangedBy: 'admin',
        statusChangedByUserId: 'usr-admin-1',
        updatedAt: now,
      },
    ];
    changed = true;
  }

  if (!db.auditLogs) {
    db.auditLogs = [];
    changed = true;
  }

  return changed;
}

/** Loads the JSON database, seeding the default admin + sample record on first use. */
export function loadDB(): DBData {
  let db: DBData = { users: [], records: [], auditLogs: [] };
  try {
    if (fs.existsSync(DB_FILE)) {
      db = { ...db, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) };
    }
  } catch (e) {
    console.error('Error loading DB:', e);
  }
  if (seed(db)) saveDB(db);
  return db;
}

export function saveDB(data: DBData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving DB:', e);
  }
}
