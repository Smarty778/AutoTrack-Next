export interface TrackerRecord {
  id: string;
  // Exact 26 fields matching user's spreadsheet
  regNo: string;               // 1. Reg No.
  customerName: string;        // 2. Customer Name
  make: string;                // 3. Make
  model: string;               // 4. Model
  year: string;                // 5. Year
  color: string;               // 6. Color
  contact1: string;            // 7. Contact #1
  contactPerson: string;       // 8. Contact Person / New Owner
  engine: string;              // 9. Engine
  chassis: string;             // 10. Chassis
  insurance: string;           // 11. Insurance
  date: string;                // 12. Date
  salesPerson: string;         // 13. Sales Person (Name)
  assignedToUserId?: string;   // Internal user ID for strict access control
  technicianName: string;      // 14. Technician Name
  orderNo: string;             // 15. Order No.
  instCity: string;            // 16. Inst. City
  showroom: string;            // 17. Showroom
  cnicNo: string;              // 18. CNIC No
  insStatus: string;           // 19. Ins Status
  dateOfInstallation: string;  // 20. Date of installation
  dueDate: string;             // 21. Due date
  status: 'Continued' | 'Pending' | 'Removal' | 'Removed' | 'In Progress'; // 22. Status (Continued / Pending / Removal / Removed / In Progress)
  statusChangedAt?: string;    // Timestamp of last status change
  statusChangedBy?: string;    // User ID / Username who made the last status change
  statusChangedByUserId?: string; // Exact user ID (e.g. user-admin, user-bilal)
  statusChangedRecordId?: string; // Record ID verification
  coordinatedBy: string;       // 23. Coordinated by
  remarks: string;             // 24. Remarks
  unit: string;                // 25. UNIT
  trackerStatus: 'Active' | 'NR' | 'Testing' | 'Standby' | 'Removed' | 'Decommissioned'; // 26. Tracker Status (Active / NR: Not Reporting)

  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface LastStatusChange {
  recordId: string;
  regNo: string;
  customerName: string;
  previousStatus?: TrackerRecord['status'];
  newStatus: TrackerRecord['status'];
  changedByUserId: string;
  changedByUsername: string;
  changedByName: string;
  timestamp: string;
}

export type UserRole = 'admin' | 'user';
export type PermissionPreset = 'strict' | 'standard' | 'full' | 'readonly';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  city?: string;
  avatarColor: string;
  active: boolean;
  customPermissions?: Partial<AgentPermissions>;
}

export interface FilterState {
  search: string;
  salesPerson: string; // 'all' | 'unassigned' | specific name or id
  status: string;      // 'all' | 'Pending' | ...
  trackerStatus: string;
  insStatus: string;
  instCity: string;
  dueDatePreset: 'all' | 'overdue' | 'today' | 'next_7_days' | 'has_due_date' | 'no_due_date';
  instDatePreset: 'all' | 'today' | 'this_week' | 'this_month';
  showroom: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  action: string;
  details: string;
  recordRegNo?: string;
}

export interface AgentPermissions {
  // Follow-up & Operational fields
  canEditStatus: boolean;            // Service Status (Continued, Pending, Removal)
  canEditTrackerStatus: boolean;     // Tracker Status (Active, NR, Testing)
  canEditRemarks: boolean;           // Remarks and customer follow-up notes
  canEditDueDate: boolean;           // Due Date / Renewal deadline
  canEditContactInfo: boolean;       // Contact #1 and Contact Person / New Owner
  canEditInsurance: boolean;         // Insurance company and Ins Status

  // Core Vehicle & Hardware Master Data
  canEditVehicleSpecs: boolean;      // Reg No, Make, Model, Year, Color
  canEditEngineChassis: boolean;     // Engine No and Chassis No
  canEditHardwareUnit: boolean;      // UNIT (GPS device model)
  canEditTechnicianCity: boolean;    // Technician name, Inst. City, Showroom
  canEditOrderNoDate: boolean;       // Order No, Installation Date, Coordinated By

  // Administrative Actions
  canCreateNewRecords: boolean;      // Can agent create new vehicle records
  canDeleteRecords: boolean;         // Can agent delete records
  canReassignSalesPerson: boolean;   // Can agent reassign vehicle to another salesperson
}

export const DEFAULT_AGENT_PERMISSIONS: AgentPermissions = {
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
};