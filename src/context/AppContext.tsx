'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { TrackerRecord, UserProfile, FilterState, AuditLogEntry, AgentPermissions, DEFAULT_AGENT_PERMISSIONS, PermissionPreset, LastStatusChange } from '../types';
import { INITIAL_RECORDS, INITIAL_USERS } from '../data/mockData';

interface AppContextType {
  currentUser: UserProfile;
  users: UserProfile[];
  records: TrackerRecord[];
  visibleRecords: TrackerRecord[];
  selectedRecordIds: string[];
  filters: FilterState;
  auditLogs: AuditLogEntry[];
  isAuthenticated: boolean;
  isHydrated: boolean;
  agentPermissions: AgentPermissions;
  globalAgentPermissions: AgentPermissions;
  lastStatusChange: LastStatusChange | null;
  
  // Selection
  toggleSelectRecord: (id: string) => void;
  selectAllRecords: (select: boolean) => void;
  clearSelection: () => void;
  
  // Filter actions
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  activeFilterCount: number;

  // Assignment & Record Mutations
  assignRecords: (recordIds: string[], targetUserId: string, targetUserName: string) => void;
  updateRecord: (id: string, updates: Partial<TrackerRecord>) => void;
  addRecord: (record: Omit<TrackerRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteRecords: (recordIds: string[]) => void;
  batchUpdateStatus: (recordIds: string[], status: TrackerRecord['status']) => void;
  batchUpdateTrackerStatus: (recordIds: string[], trackerStatus: TrackerRecord['trackerStatus']) => void;

  // Agent Permissions Management (Admin control)
  updateAgentPermissions: (updates: Partial<AgentPermissions>, targetUserId?: string) => void;
  resetAgentPermissionsToPreset: (preset: PermissionPreset, targetUserId?: string) => void;
  getUserEffectivePermissions: (userId: string) => AgentPermissions;
  clearUserCustomPermissions: (userId: string) => void;

  // User management & Authentication
  login: (usernameOrEmail: string, password?: string) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  addUser: (user: Omit<UserProfile, 'id'>) => void;
  updateUserPassword: (userId: string, newPass: string) => void;
  toggleUserActive: (userId: string) => void;
  deleteUser: (userId: string) => void;
  
  // Data management
  importRecords: (newRecords: TrackerRecord[], mode: 'append' | 'replace') => void;
  factoryResetPortal: () => void;
}

const STORAGE_KEYS = {
  RECORDS: 'autotrack_records_v4',
  USERS: 'autotrack_users_v4',
  LOGS: 'autotrack_audit_logs_v4',
  CURRENT_USER_ID: 'autotrack_current_user_id_v4',
  AUTH_STATE: 'autotrack_auth_state_v4',
  PERMISSIONS: 'autotrack_agent_permissions_v4',
  LAST_STATUS_CHANGE: 'autotrack_last_status_change_v4',
};

const initialFilterState: FilterState = {
  search: '',
  salesPerson: 'all',
  status: 'all',
  trackerStatus: 'all',
  insStatus: 'all',
  instCity: 'all',
  dueDatePreset: 'all',
  instDatePreset: 'all',
  showroom: 'all',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // NOTE (Next.js): state starts from server-safe defaults. localStorage is only
  // read inside a mount effect below, so SSR never touches browser APIs and the
  // first client render matches the server HTML (no hydration mismatch).
  const [isHydrated, setIsHydrated] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Default true so demo is visible, same as before
  const [currentUserId, setCurrentUserId] = useState<string>('user-admin');
  const [records, setRecords] = useState<TrackerRecord[]>(INITIAL_RECORDS);
  const [lastStatusChange, setLastStatusChange] = useState<LastStatusChange | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'log-1',
      timestamp: new Date().toISOString(),
      actorName: 'System',
      action: 'System Initialized',
      details: 'Initialized AutoTrack master fleet tracking database.',
    },
  ]);

  // Selections & Filters
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  // Agent Field-Level Edit Permissions (Admin Configured)
  const [agentPermissions, setAgentPermissions] = useState<AgentPermissions>(DEFAULT_AGENT_PERMISSIONS);

  // Load persisted state from localStorage once, after mount (client only)
  useEffect(() => {
    const read = <T,>(key: string): T | null => {
      try {
        const raw = localStorage.getItem(key);
        return raw !== null ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    };

    // Older saved accounts may carry the legacy 'sales' role; the app's role type is 'admin' | 'user'.
    const savedUsers = read<UserProfile[]>(STORAGE_KEYS.USERS)?.map(u =>
      (u.role as string) === 'sales' ? { ...u, role: 'user' as const } : u
    ) ?? null;
    const savedRecords = read<TrackerRecord[]>(STORAGE_KEYS.RECORDS);
    const savedLogs = read<AuditLogEntry[]>(STORAGE_KEYS.LOGS);
    const savedPerms = read<AgentPermissions>(STORAGE_KEYS.PERMISSIONS);
    const savedAuth = read<boolean>(STORAGE_KEYS.AUTH_STATE);
    const savedLast = read<LastStatusChange>(STORAGE_KEYS.LAST_STATUS_CHANGE);

    const effectiveUsers = savedUsers ?? INITIAL_USERS;
    const effectiveRecords = savedRecords ?? INITIAL_RECORDS;

    let savedUserId: string | null = null;
    try {
      savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    } catch {
      // ignore
    }

    if (savedUsers) setUsers(savedUsers);
    if (savedRecords) setRecords(savedRecords);
    if (savedLogs) setAuditLogs(savedLogs);
    if (savedPerms) setAgentPermissions(savedPerms);
    if (savedAuth !== null) setIsAuthenticated(savedAuth);
    if (savedUserId && effectiveUsers.some(u => u.id === savedUserId)) {
      setCurrentUserId(savedUserId);
    }

    if (savedLast) {
      setLastStatusChange(savedLast);
    } else {
      // Fallback from the most recent status change among records
      const latest = [...effectiveRecords]
        .filter(r => r.statusChangedAt)
        .sort((a, b) => new Date(b.statusChangedAt!).getTime() - new Date(a.statusChangedAt!).getTime())[0];
      if (latest) {
        setLastStatusChange({
          recordId: latest.id,
          regNo: latest.regNo,
          customerName: latest.customerName,
          newStatus: latest.status,
          changedByUserId: latest.statusChangedByUserId || 'user-admin',
          changedByUsername: latest.statusChangedBy || 'admin',
          changedByName: latest.statusChangedBy || 'admin',
          timestamp: latest.statusChangedAt!,
        });
      }
    }

    setIsHydrated(true);
  }, []);

  // Persist to localStorage (only after hydration, so defaults never overwrite saved data)
  useEffect(() => {
    if (isHydrated && lastStatusChange) {
      localStorage.setItem(STORAGE_KEYS.LAST_STATUS_CHANGE, JSON.stringify(lastStatusChange));
    }
  }, [isHydrated, lastStatusChange]);

  useEffect(() => {
    if (isHydrated) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [isHydrated, users]);

  useEffect(() => {
    if (isHydrated) localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [isHydrated, currentUserId]);

  useEffect(() => {
    if (isHydrated) localStorage.setItem(STORAGE_KEYS.AUTH_STATE, JSON.stringify(isAuthenticated));
  }, [isHydrated, isAuthenticated]);

  useEffect(() => {
    if (isHydrated) localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }, [isHydrated, records]);

  useEffect(() => {
    if (isHydrated) localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
  }, [isHydrated, auditLogs]);

  useEffect(() => {
    if (isHydrated) localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(agentPermissions));
  }, [isHydrated, agentPermissions]);

  const currentUser = useMemo(() => {
    const user = users.find(u => u.id === currentUserId);
    return user || users[0] || INITIAL_USERS[0];
  }, [users, currentUserId]);

  const addAuditLog = (action: string, details: string, regNo?: string) => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorName: currentUser.name,
      action,
      details,
      recordRegNo: regNo,
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 99)]);
  };

  // Login handler with ID and Password validation
  const login = (usernameOrEmail: string, password?: string) => {
    const cleanIdentifier = usernameOrEmail.trim().toLowerCase();
    const user = users.find(
      u => u.username.toLowerCase() === cleanIdentifier || u.email.toLowerCase() === cleanIdentifier
    );

    if (!user) {
      return { success: false, message: 'User ID / Username not found in system.' };
    }

    if (!user.active) {
      return { success: false, message: 'This user account is currently deactivated.' };
    }

    // Strict password verification
    if (user.password) {
      if (!password || user.password !== password) {
        return { success: false, message: 'Incorrect password. Please verify and try again.' };
      }
    }

    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    setSelectedRecordIds([]);
    setFilters(prev => ({ ...prev, salesPerson: 'all' }));
    addAuditLog('User Login', `Logged in successfully as ${user.name} (${user.role.toUpperCase()})`);
    return { success: true };
  };

  // Logout
  const logout = () => {
    setIsAuthenticated(false);
    setSelectedRecordIds([]);
  };

  // Switch User
  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUserId(userId);
      setIsAuthenticated(true);
      setSelectedRecordIds([]);
      setFilters(prev => ({ ...prev, salesPerson: 'all' }));
      addAuditLog('User Switched', `Active session switched to ${user.name} (${user.role.toUpperCase()})`);
    }
  };

  // Add new User
  const addUser = (userData: Omit<UserProfile, 'id'>) => {
    const id = `user-${Date.now().toString(36)}`;
    const newUser: UserProfile = { 
      ...userData, 
      id,
      password: userData.password || '123'
    };
    setUsers(prev => [...prev, newUser]);
    addAuditLog('User Created', `Created user account for ${newUser.name} (@${newUser.username})`);
  };

  const updateUserPassword = (userId: string, newPass: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPass } : u));
    addAuditLog('Password Changed', `Updated password for user ID ${userId}`);
  };

  const toggleUserActive = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !u.active } : u));
  };

  const deleteUser = (userId: string) => {
    if (userId === 'user-admin') {
      return;
    }
    const targetUser = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    setRecords(prev =>
      prev.map(r =>
        r.assignedToUserId === userId
          ? { ...r, assignedToUserId: undefined, coordinatedBy: 'Unassigned', updatedAt: new Date().toISOString() }
          : r
      )
    );
    addAuditLog('User Deleted', `Deleted user account for ${targetUser?.name || userId}`);
    if (currentUserId === userId) {
      setCurrentUserId('user-admin');
      setIsAuthenticated(true);
    }
  };

  // Checkbox selection
  const toggleSelectRecord = (id: string) => {
    setSelectedRecordIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllRecords = (select: boolean) => {
    if (select) {
      setSelectedRecordIds(visibleRecords.map(r => r.id));
    } else {
      setSelectedRecordIds([]);
    }
  };

  const clearSelection = () => {
    setSelectedRecordIds([]);
  };

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(initialFilterState);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.salesPerson !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.trackerStatus !== 'all') count++;
    if (filters.insStatus !== 'all') count++;
    if (filters.instCity !== 'all') count++;
    if (filters.dueDatePreset !== 'all') count++;
    if (filters.instDatePreset !== 'all') count++;
    if (filters.showroom !== 'all') count++;
    return count;
  }, [filters]);

  // CRITICAL: Strict Role-Based Access Isolation
  // - Admin: sees entire master fleet, can filter across any salesperson
  // - Sales: ONLY sees records assigned to their ID
  const visibleRecords = useMemo(() => {
    let list = records;

    // 1. Role-based isolation
    if (currentUser.role === 'user') {
      list = list.filter(r => 
        r.assignedToUserId === currentUser.id ||
        r.salesPerson.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
      );
    } else {
      // Admin filter by Sales Person if selected
      if (filters.salesPerson !== 'all') {
        if (filters.salesPerson === 'unassigned') {
          list = list.filter(r => !r.assignedToUserId || r.salesPerson.toLowerCase() === 'unassigned');
        } else {
          list = list.filter(r => 
            r.assignedToUserId === filters.salesPerson ||
            r.salesPerson.toLowerCase() === filters.salesPerson.toLowerCase()
          );
        }
      }
    }

    // 2. Search query
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(r =>
        r.regNo.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.contact1.toLowerCase().includes(q) ||
        r.engine.toLowerCase().includes(q) ||
        r.chassis.toLowerCase().includes(q) ||
        r.orderNo.toLowerCase().includes(q) ||
        r.make.toLowerCase().includes(q) ||
        r.model.toLowerCase().includes(q) ||
        r.cnicNo.toLowerCase().includes(q) ||
        r.salesPerson.toLowerCase().includes(q) ||
        r.remarks.toLowerCase().includes(q) ||
        r.unit.toLowerCase().includes(q)
      );
    }

    // 3. Status filter (Continued, Pending, Removal, Suspended, Follow-up, Cancelled)
    if (filters.status !== 'all') {
      list = list.filter(r => r.status === filters.status);
    }

    // 4. Tracker status filter (Active, NR, Testing, Standby, Removed, Decommissioned)
    if (filters.trackerStatus !== 'all') {
      list = list.filter(r => r.trackerStatus === filters.trackerStatus);
    }

    // 5. Insurance status filter
    if (filters.insStatus !== 'all') {
      list = list.filter(r => r.insStatus.toLowerCase() === filters.insStatus.toLowerCase());
    }

    // 6. City filter
    if (filters.instCity !== 'all') {
      list = list.filter(r => r.instCity.toLowerCase() === filters.instCity.toLowerCase());
    }

    // 7. Showroom filter
    if (filters.showroom !== 'all') {
      list = list.filter(r => r.showroom.toLowerCase() === filters.showroom.toLowerCase());
    }

    // 8. Due date filter & Overdue logic
    const today = new Date().toISOString().split('T')[0];
    if (filters.dueDatePreset === 'overdue') {
      list = list.filter(r => r.dueDate && r.dueDate < today && r.status !== 'Continued' && r.status !== 'Removed' && r.status !== 'Removal');
    } else if (filters.dueDatePreset === 'today') {
      list = list.filter(r => r.dueDate === today);
    } else if (filters.dueDatePreset === 'next_7_days') {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      list = list.filter(r => r.dueDate && r.dueDate >= today && r.dueDate <= nextWeekStr);
    } else if (filters.dueDatePreset === 'has_due_date') {
      list = list.filter(r => !!r.dueDate);
    } else if (filters.dueDatePreset === 'no_due_date') {
      list = list.filter(r => !r.dueDate);
    }

    // 9. Installation date preset
    if (filters.instDatePreset === 'today') {
      list = list.filter(r => r.dateOfInstallation === today);
    } else if (filters.instDatePreset === 'this_week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
      list = list.filter(r => r.dateOfInstallation && r.dateOfInstallation >= oneWeekAgoStr);
    } else if (filters.instDatePreset === 'this_month') {
      const currentMonth = today.substring(0, 7);
      list = list.filter(r => r.dateOfInstallation && r.dateOfInstallation.startsWith(currentMonth));
    }

    return list;
  }, [records, currentUser, filters]);

  // Batch Assignment: Assigns selected records to a specific sales person
  const assignRecords = (recordIds: string[], targetUserId: string, targetUserName: string) => {
    if (recordIds.length === 0) return;

    const isUnassign = targetUserId === 'unassigned';
    const assignedName = isUnassign ? 'Unassigned' : targetUserName;
    const assignedId = isUnassign ? undefined : targetUserId;

    setRecords(prev =>
      prev.map(r => {
        if (recordIds.includes(r.id)) {
          return {
            ...r,
            assignedToUserId: assignedId,
            salesPerson: assignedName,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );

    addAuditLog(
      isUnassign ? 'Batch Unassigned' : 'Batch Assigned',
      `Assigned ${recordIds.length} vehicle record(s) to ${assignedName}.`
    );

    clearSelection();
  };

  // Update single record
  const updateRecord = (id: string, updates: Partial<TrackerRecord>) => {
    const existingRec = records.find(r => r.id === id);
    const enrichedUpdates: Partial<TrackerRecord> = { ...updates };

    // Automatically stamp timestamp, record ID and actor user ID when status changes
    if (updates.status && (!existingRec || updates.status !== existingRec.status)) {
      const now = new Date().toISOString();
      const actorUsername = currentUser.username || currentUser.name;
      const actorUserId = currentUser.id;

      if (!enrichedUpdates.statusChangedAt) {
        enrichedUpdates.statusChangedAt = now;
      }
      if (!enrichedUpdates.statusChangedBy) {
        enrichedUpdates.statusChangedBy = actorUsername;
      }
      enrichedUpdates.statusChangedByUserId = actorUserId;
      enrichedUpdates.statusChangedRecordId = id;

      setLastStatusChange({
        recordId: id,
        regNo: existingRec?.regNo || id,
        customerName: existingRec?.customerName || '',
        previousStatus: existingRec?.status,
        newStatus: updates.status,
        changedByUserId: actorUserId,
        changedByUsername: actorUsername,
        changedByName: currentUser.name,
        timestamp: enrichedUpdates.statusChangedAt,
      });

      addAuditLog(
        'Status Changed',
        `Status changed to "${updates.status}" for Record ID: ${id} (${existingRec?.regNo || ''}) by User ID: ${actorUserId} (@${actorUsername})`,
        existingRec?.regNo
      );
    }

    setRecords(prev =>
      prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            ...enrichedUpdates,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );

    const rec = records.find(r => r.id === id);
    if (!updates.status || (existingRec && updates.status === existingRec.status)) {
      addAuditLog('Record Updated', `Updated fields on ${rec?.regNo || id}`, rec?.regNo);
    }
  };

  // Add new record
  const addRecord = (recordData: Omit<TrackerRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `rec-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const actorUsername = currentUser.username || currentUser.name;
    const actorUserId = currentUser.id;

    const salesPerson = currentUser.role === 'user' ? currentUser.name : recordData.salesPerson;
    const assignedToUserId = currentUser.role === 'user' ? currentUser.id : recordData.assignedToUserId;

    const newRecord: TrackerRecord = {
      ...recordData,
      id: newId,
      salesPerson: salesPerson || 'Unassigned',
      assignedToUserId,
      statusChangedAt: recordData.statusChangedAt || timestamp,
      statusChangedBy: recordData.statusChangedBy || actorUsername,
      statusChangedByUserId: actorUserId,
      statusChangedRecordId: newId,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: currentUser.name,
    };

    setRecords(prev => [newRecord, ...prev]);

    if (newRecord.status) {
      setLastStatusChange({
        recordId: newId,
        regNo: newRecord.regNo,
        customerName: newRecord.customerName,
        newStatus: newRecord.status,
        changedByUserId: actorUserId,
        changedByUsername: actorUsername,
        changedByName: currentUser.name,
        timestamp: newRecord.statusChangedAt || timestamp,
      });
    }

    addAuditLog('New Record Added', `Added vehicle ${newRecord.regNo} (${newRecord.customerName}) with status "${newRecord.status}"`, newRecord.regNo);
  };

  // Delete records
  const deleteRecords = (recordIds: string[]) => {
    if (recordIds.length === 0) return;
    setRecords(prev => prev.filter(r => !recordIds.includes(r.id)));
    setSelectedRecordIds(prev => prev.filter(id => !recordIds.includes(id)));
    addAuditLog('Records Deleted', `Deleted ${recordIds.length} record(s)`);
  };

  // Batch update status
  const batchUpdateStatus = (recordIds: string[], status: TrackerRecord['status']) => {
    if (recordIds.length === 0) return;
    const now = new Date().toISOString();
    const actorUsername = currentUser.username || currentUser.name;
    const actorUserId = currentUser.id;
    setRecords(prev =>
      prev.map(r => (recordIds.includes(r.id) ? { 
        ...r, 
        status, 
        statusChangedAt: now,
        statusChangedBy: actorUsername,
        statusChangedByUserId: actorUserId,
        statusChangedRecordId: r.id,
        updatedAt: now 
      } : r))
    );
    const affectedRecs = records.filter(r => recordIds.includes(r.id));
    const firstRec = affectedRecs[0];
    setLastStatusChange({
      recordId: recordIds.join(', '),
      regNo: firstRec ? `${firstRec.regNo}${recordIds.length > 1 ? ` (+${recordIds.length - 1} more)` : ''}` : recordIds.join(', '),
      customerName: firstRec?.customerName || '',
      newStatus: status,
      changedByUserId: actorUserId,
      changedByUsername: actorUsername,
      changedByName: currentUser.name,
      timestamp: now,
    });
    addAuditLog('Batch Status Updated', `Updated status to "${status}" for ${recordIds.length} record ID(s): [${recordIds.join(', ')}] by User ID: ${actorUserId} (@${actorUsername})`);
  };

  // Batch update tracker status
  const batchUpdateTrackerStatus = (recordIds: string[], trackerStatus: TrackerRecord['trackerStatus']) => {
    if (recordIds.length === 0) return;
    setRecords(prev =>
      prev.map(r => (recordIds.includes(r.id) ? { ...r, trackerStatus, updatedAt: new Date().toISOString() } : r))
    );
    addAuditLog('Batch Tracker Status Updated', `Updated tracker status to "${trackerStatus}" for ${recordIds.length} record(s)`);
  };

  // Import records
  const importRecords = (newRecords: TrackerRecord[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setRecords(newRecords);
    } else {
      setRecords(prev => [...newRecords, ...prev]);
    }
    addAuditLog('Records Imported', `Imported ${newRecords.length} records (${mode} mode)`);
    clearSelection();
  };

  // Helper to compute effective permissions for any user
  const getUserEffectivePermissions = (userId: string): AgentPermissions => {
    const target = users.find(u => u.id === userId);
    if (!target) return agentPermissions;
    if (target.role === 'admin') {
      return {
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
    }
    if (target.customPermissions) {
      return { ...agentPermissions, ...target.customPermissions };
    }
    return agentPermissions;
  };

  // Effective permissions for currently logged-in user
  const effectivePermissions = useMemo<AgentPermissions>(() => {
    return getUserEffectivePermissions(currentUser.id);
  }, [currentUser, users, agentPermissions]);

  // Agent Permissions Handlers
  const updateAgentPermissions = (updates: Partial<AgentPermissions>, targetUserId?: string) => {
    if (targetUserId) {
      setUsers(prev =>
        prev.map(u => {
          if (u.id === targetUserId) {
            const currentCustom = u.customPermissions || {};
            return {
              ...u,
              customPermissions: { ...currentCustom, ...updates },
            };
          }
          return u;
        })
      );
      const targetUser = users.find(u => u.id === targetUserId);
      addAuditLog(
        'Agent Permissions Updated',
        `Admin modified custom edit permissions for agent ${targetUser?.name || targetUserId}.`
      );
    } else {
      setAgentPermissions(prev => ({ ...prev, ...updates }));
      addAuditLog('Global Permissions Updated', `Admin modified global edit permissions for all sales agents.`);
    }
  };

  const clearUserCustomPermissions = (userId: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const { customPermissions: _, ...rest } = u;
          return rest;
        }
        return u;
      })
    );
    const targetUser = users.find(u => u.id === userId);
    addAuditLog('Agent Permissions Reset', `Reverted agent ${targetUser?.name || userId} to global policy.`);
  };

  const getPresetPermissions = (preset: PermissionPreset): AgentPermissions => {
    switch (preset) {
      case 'readonly':
        return {
          canEditStatus: false,
          canEditTrackerStatus: false,
          canEditRemarks: false,
          canEditDueDate: false,
          canEditContactInfo: false,
          canEditInsurance: false,
          canEditVehicleSpecs: false,
          canEditEngineChassis: false,
          canEditHardwareUnit: false,
          canEditTechnicianCity: false,
          canEditOrderNoDate: false,
          canCreateNewRecords: false,
          canDeleteRecords: false,
          canReassignSalesPerson: false,
        };
      case 'strict':
        return {
          canEditStatus: true,
          canEditTrackerStatus: false,
          canEditRemarks: true,
          canEditDueDate: true,
          canEditContactInfo: false,
          canEditInsurance: false,
          canEditVehicleSpecs: false,
          canEditEngineChassis: false,
          canEditHardwareUnit: false,
          canEditTechnicianCity: false,
          canEditOrderNoDate: false,
          canCreateNewRecords: false,
          canDeleteRecords: false,
          canReassignSalesPerson: false,
        };
      case 'standard':
        return {
          canEditStatus: true,
          canEditTrackerStatus: true,
          canEditRemarks: true,
          canEditDueDate: true,
          canEditContactInfo: true,
          canEditInsurance: true,
          canEditVehicleSpecs: false,
          canEditEngineChassis: false,
          canEditHardwareUnit: false,
          canEditTechnicianCity: false,
          canEditOrderNoDate: false,
          canCreateNewRecords: true,
          canDeleteRecords: false,
          canReassignSalesPerson: false,
        };
      case 'full':
        return {
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
          canDeleteRecords: false,
          canReassignSalesPerson: false,
        };
    }
  };

  const resetAgentPermissionsToPreset = (preset: PermissionPreset, targetUserId?: string) => {
    const newPerms = getPresetPermissions(preset);
    if (targetUserId) {
      setUsers(prev =>
        prev.map(u => {
          if (u.id === targetUserId) {
            return {
              ...u,
              customPermissions: newPerms,
            };
          }
          return u;
        })
      );
      const targetUser = users.find(u => u.id === targetUserId);
      addAuditLog(
        'Agent Preset Applied',
        `Admin applied "${preset.toUpperCase()}" preset to agent ${targetUser?.name || targetUserId}.`
      );
    } else {
      setAgentPermissions(newPerms);
      addAuditLog('Global Permissions Preset Applied', `Admin set global agent permissions to "${preset.toUpperCase()}" preset.`);
    }
  };

  // Factory Reset / Wipe Portal
  const factoryResetPortal = () => {
    try {
      localStorage.clear();
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify([]));
    } catch {
      // ignore
    }
    setRecords([]);
    setUsers(INITIAL_USERS);
    setAgentPermissions(DEFAULT_AGENT_PERMISSIONS);
    setCurrentUserId('user-admin');
    setIsAuthenticated(true);
    setSelectedRecordIds([]);
    setFilters(initialFilterState);
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        records,
        visibleRecords,
        selectedRecordIds,
        filters,
        auditLogs,
        isAuthenticated,
        isHydrated,
        agentPermissions: effectivePermissions,
        globalAgentPermissions: agentPermissions,
        lastStatusChange,
        toggleSelectRecord,
        selectAllRecords,
        clearSelection,
        setFilter,
        resetFilters,
        activeFilterCount,
        assignRecords,
        updateRecord,
        addRecord,
        deleteRecords,
        batchUpdateStatus,
        batchUpdateTrackerStatus,
        updateAgentPermissions,
        resetAgentPermissionsToPreset,
        getUserEffectivePermissions,
        clearUserCustomPermissions,
        login,
        logout,
        switchUser,
        addUser,
        updateUserPassword,
        toggleUserActive,
        deleteUser,
        importRecords,
        factoryResetPortal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
