# AutoTrack Manager - Prisma ORM Setup

This directory contains the production Prisma schema, relationships, and seed scripts matching the AutoTrack 26-column vehicle GPS tracker spreadsheet & Sales CRM.

## Files
- `schema.prisma`: Complete PostgreSQL schema modeling:
  - **`User`**: Admin & Sales team accounts with authentication, active status, and cities.
  - **`AgentPermissions`**: Granular RBAC permissions for sales agents (status, specs, dates, delete, reassign).
  - **`TrackerRecord`**: All exact 26 spreadsheet columns (Reg No, Customer Name, Make, Model, Year, Color, Contact #1, Contact Person, Engine, Chassis, Insurance, Date, Sales Person, Technician Name, Order No, Inst City, Showroom, CNIC No, Ins Status, Date of Installation, Due Date, Status, Coordinated By, Remarks, UNIT, Tracker Status).
  - **`StatusChangeLog`**: Complete audit trail of every status transition with timestamp, actor user ID, previous status, and new status.
  - **`AuditLog`**: Global system activity log.
  - **`JobCard`**: Technician job card printouts and records.
- `seed.ts`: Seed script populating initial admin & sales users, permissions, and sample fleet records across all 5 statuses.

## Quick Start Commands

```bash
# 1. Install Prisma CLI and Client
npm install -D prisma
npm install @prisma/client

# 2. Configure DATABASE_URL in your .env file
# DATABASE_URL="postgresql://user:password@localhost:5432/autotrack_db?schema=public"

# 3. Push schema to database
npx prisma db push

# 4. Generate Prisma Client
npx prisma generate

# 5. Run the seed script
npx tsx prisma/seed.ts

# 6. Open Prisma Studio UI to inspect data
npx prisma studio
```
