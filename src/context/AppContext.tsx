'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrackerRecord,
  UserProfile,
  FilterState,
  AuditLogEntry,
  AgentPermissions,
  DEFAULT_AGENT_PERMISSIONS,
  PermissionPreset,
  LastStatusChange,
} from '../types';

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
  login: (
    usernameOrEmail: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
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

// Bumped to v5 so old demo/seed data cached in browsers is ignored
const STORAGE_KEYS = {
  RECORDS: 'autotrack_records_v5',
  USERS: 'autotrack_users_v5',
  LOGS: 'autotrack_audit_logs_v5',
  CURRENT_USER_ID: 'autotrack_current_user_id_v5',
  AUTH_STATE: 'autotrack_auth_state_v5',
  PERMISSIONS: 'autotrack_agent_permissions_v5',
  LAST_STATUS_CHANGE: 'autotrack_last_status_change_v5',
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

// Empty placeholder (not seed data) so currentUser is never null before login
const EMPTY_USER = {
  id: '',
  name: 'Guest',
  username: '',
  email: '',
  password: '',
  role: 'user',
  active: false,
} as UserProfile;

// Normalizes Prisma uppercase enums ('CONTINUED', 'IN_PROGRESS', 'ACTIVE') to UI strings
const normalizeStatusFromApi = (status?: string): TrackerRecord['status'] => {
  if (!status) return 'Pending';
  const map: Record<string, TrackerRecord['status']> = {
    CONTINUED: 'Continued',
    PENDING: 'Pending',
    REMOVAL: 'Removal',
    REMOVED: 'Removed',
    IN_PROGRESS: 'In Progress',
  };
  return map[status.toUpperCase()] || (status as TrackerRecord['status']);
};

const normalizeTrackerStatusFromApi = (ts?: string): TrackerRecord['trackerStatus'] => {
  if (!ts) return 'Active';
  const map: Record<string, TrackerRecord['trackerStatus']> = {
    ACTIVE: 'Active',
    NR: 'NR',
    TESTING: 'Testing',
    STANDBY: 'Standby',
    REMOVED: 'Removed',
    DECOMMISSIONED: 'Decommissioned',
  };
  return map[ts.toUpperCase()] || (ts as TrackerRecord['trackerStatus']);
};

const normalizeRecordFromApi = (r: any): TrackerRecord => ({
  ...r,
  status: normalizeStatusFromApi(r.status),
  trackerStatus: normalizeTrackerStatusFromApi(r.trackerStatus),
});

const normalizeUserFromApi = (u: any): UserProfile =>
  ({
    ...u,
    role: String(u.role).toLowerCase() === 'admin' ? 'admin' : 'user',
    active: u.active !== false,
    customPermissions: u.permissions ?? u.customPermissions,
  }) as UserProfile;

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [records, setRecords] = useState<TrackerRecord[]>([]);
  const [lastStatusChange, setLastStatusChange] = useState<LastStatusChange | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [agentPermissions, setAgentPermissions] = useState<AgentPermissions>(DEFAULT_AGENT_PERMISSIONS);

  // Sync with backend API routes (database is the source of truth)
  const syncFromApi = useCallback(async () => {
    try {
      const [meRes, usersRes, recordsRes, logsRes] = await Promise.allSettled([
        fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/users', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/records', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/audit-logs', { credentials: 'include', cache: 'no-store' }),
      ]);

      // 1. Users list
      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const apiUsers = await usersRes.value.json();
        if (Array.isArray(apiUsers)) {
          setUsers(apiUsers.map(normalizeUserFromApi));
        }
      }

      // 2. Current authenticated session
      if (meRes.status === 'fulfilled') {
        if (meRes.value.ok) {
          const meData = await meRes.value.json();
          if (meData?.success && meData?.user) {
            const me = normalizeUserFromApi(meData.user);
            setUsers(prev =>
              prev.some(u => u.id === me.id)
                ? prev.map(u => (u.id === me.id ? { ...u, ...me } : u))
                : [...prev, me]
            );
            setCurrentUserId(me.id);
            setIsAuthenticated(true);
          }
        } else if (meRes.value.status === 401) {
          // Server says no valid session
          setIsAuthenticated(false);
          setCurrentUserId('');
        }
      }

      // 3. Tracker Records
      if (recordsRes.status === 'fulfilled' && recordsRes.value.ok) {
        const apiRecords = await recordsRes.value.json();
        if (Array.isArray(apiRecords)) {
          setRecords(apiRecords.map(normalizeRecordFromApi));
        }
      }

      // 4. Audit Logs
      if (logsRes.status === 'fulfilled' && logsRes.value.ok) {
        const apiLogs = await logsRes.value.json();
        if (Array.isArray(apiLogs)) {
          setAuditLogs(apiLogs);
        }
      }
    } catch {
      // Keep cached localStorage state if offline
    }
  }, []);

  // Load cached state from localStorage once after mount, then sync from API
  useEffect(() => {
    const read = <T,>(key: string): T | null => {
      try {
        const raw = localStorage.getItem(key);
        return raw !== null ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    };

    const savedUsers =
      read<UserProfile[]>(STORAGE_KEYS.USERS)?.map(u =>
        (u.role as string) === 'sales' ? { ...u, role: 'user' as const } : u
      ) ?? null;
    const savedRecords = read<TrackerRecord[]>(STORAGE_KEYS.RECORDS);
    const savedLogs = read<AuditLogEntry[]>(STORAGE_KEYS.LOGS);
    const savedPerms = read<AgentPermissions>(STORAGE_KEYS.PERMISSIONS);
    const savedAuth = read<boolean>(STORAGE_KEYS.AUTH_STATE);
    const savedLast = read<LastStatusChange>(STORAGE_KEYS.LAST_STATUS_CHANGE);

    const effectiveRecords = savedRecords ?? [];

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

    if (savedUserId && savedUsers?.some(u => u.id === savedUserId) && savedAuth === true) {
      setCurrentUserId(savedUserId);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }

    if (savedLast) {
      setLastStatusChange(savedLast);
    } else {
      const latest = [...effectiveRecords]
        .filter(r => r.statusChangedAt)
        .sort((a, b) => new Date(b.statusChangedAt!).getTime() - new Date(a.statusChangedAt!).getTime())[0];
      if (latest) {
        setLastStatusChange({
          recordId: latest.id,
          regNo: latest.regNo,
          customerName: latest.customerName,
          newStatus: latest.status,
          changedByUserId: latest.statusChangedByUserId || '',
          changedByUsername: latest.statusChangedBy || 'system',
          changedByName: latest.statusChangedBy || 'system',
          timestamp: latest.statusChangedAt!,
        });
      }
    }

    setIsHydrated(true);
    syncFromApi();
  }, [syncFromApi]);

  // Persist to localStorage after hydration
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

  const currentUser = useMemo<UserProfile>(() => {
    return users.find(u => u.id === currentUserId) || EMPTY_USER;
  }, [users, currentUserId]);

  // Appends audit log to local state AND posts to /api/audit-logs
  const addAuditLog = useCallback(
    (action: string, details: string, regNo?: string) => {
      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        actorName: currentUser.name,
        action,
        details,
        recordRegNo: regNo,
      };
      setAuditLogs(prev => [newLog, ...prev.slice(0, 99)]);

      fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          actorName: currentUser.name,
          action,
          details,
          recordRegNo: regNo,
        }),
      }).catch(() => {});
    },
    [currentUser.name]
  );

  // Login: validated entirely by /api/auth/login (cookie session)
  const login = async (
    usernameOrEmail: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    const identifier = usernameOrEmail.trim().toLowerCase();

    if (!identifier || !password) {
      return { success: false, message: 'Enter your username/email and password.' };
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ username: identifier, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !data?.user) {
        return {
          success: false,
          message: data?.message || 'Login failed. Check your credentials.',
        };
      }

      const normalizedUser = normalizeUserFromApi(data.user);

      setUsers(previousUsers => {
        const existingIndex = previousUsers.findIndex(
          existingUser =>
            existingUser.id === normalizedUser.id ||
            existingUser.username?.toLowerCase() === identifier ||
            existingUser.email?.toLowerCase() === identifier
        );

        if (existingIndex === -1) {
          return [...previousUsers, normalizedUser];
        }

        return previousUsers.map((existingUser, index) =>
          index === existingIndex ? { ...existingUser, ...normalizedUser } : existingUser
        );
      });

      setCurrentUserId(normalizedUser.id);
      setIsAuthenticated(true);
      setSelectedRecordIds([]);
      setFilters(previousFilters => ({ ...previousFilters, salesPerson: 'all' }));

      void syncFromApi();

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Cannot connect to the server. Please try again.' };
    }
  };

  // Logout
  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUserId('');
    setSelectedRecordIds([]);
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
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

      if (user.password) {
        fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: user.username, password: user.password }),
        }).catch(() => {});
      }
    }
  };

  // Add new User (Optimistic update + POST /api/users)
  const addUser = (userData: Omit<UserProfile, 'id'>) => {
    const id = `user-${Date.now().toString(36)}`;
    const newUser: UserProfile = {
      ...userData,
      id,
      password: userData.password || '123',
    };
    setUsers(prev => [...prev, newUser]);
    addAuditLog('User Created', `Created user account for ${newUser.name} (@${newUser.username})`);

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        city: newUser.city,
        phone: newUser.phone,
        avatarColor: newUser.avatarColor,
      }),
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.success && data?.user?.id) {
          setUsers(prev => prev.map(u => (u.id === id ? { ...u, id: data.user.id } : u)));
        }
      })
      .catch(() => {});
  };

  const updateUserPassword = (userId: string, newPass: string) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, password: newPass } : u)));
    addAuditLog('Password Changed', `Updated password for user ID ${userId}`);
  };

  const toggleUserActive = (userId: string) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, active: !u.active } : u)));
  };

  const deleteUser = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    // Never delete the last remaining admin
    if (targetUser?.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) return;

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
      setCurrentUserId('');
      setIsAuthenticated(false);
    }
  };

  // Checkbox selection
  const toggleSelectRecord = (id: string) => {
    setSelectedRecordIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
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

  // Strict Role-Based Access Isolation & Filtering
  const visibleRecords = useMemo(() => {
    let list = records;

    // 1. Role-based isolation
    if (currentUser.role === 'user') {
      list = list.filter(
        r =>
          r.assignedToUserId === currentUser.id ||
          r.salesPerson.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
      );
    } else {
      if (filters.salesPerson !== 'all') {
        if (filters.salesPerson === 'unassigned') {
          list = list.filter(r => !r.assignedToUserId || r.salesPerson.toLowerCase() === 'unassigned');
        } else {
          list = list.filter(
            r =>
              r.assignedToUserId === filters.salesPerson ||
              r.salesPerson.toLowerCase() === filters.salesPerson.toLowerCase()
          );
        }
      }
    }

    // 2. Search query
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        r =>
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

    // 3. Status filter
    if (filters.status !== 'all') {
      list = list.filter(r => r.status === filters.status);
    }

    // 4. Tracker status filter
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
      list = list.filter(
        r =>
          r.dueDate &&
          r.dueDate < today &&
          r.status !== 'Continued' &&
          r.status !== 'Removed' &&
          r.status !== 'Removal'
      );
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

  // Batch Assignment (Optimistic + PUT /api/records/[id])
  const assignRecords = (recordIds: string[], targetUserId: string, targetUserName: string) => {
    if (recordIds.length === 0) return;

    const isUnassign = targetUserId === 'unassigned';
    const assignedName = isUnassign ? 'Unassigned' : targetUserName;
    const assignedId = isUnassign ? undefined : targetUserId;
    const now = new Date().toISOString();

    setRecords(prev =>
      prev.map(r => {
        if (recordIds.includes(r.id)) {
          return {
            ...r,
            assignedToUserId: assignedId,
            salesPerson: assignedName,
            updatedAt: now,
          };
        }
        return r;
      })
    );

    recordIds.forEach(id => {
      fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          assignedToUserId: assignedId || null,
          salesPerson: assignedName,
        }),
      }).catch(() => {});
    });

    addAuditLog(
      isUnassign ? 'Batch Unassigned' : 'Batch Assigned',
      `Assigned ${recordIds.length} vehicle record(s) to ${assignedName}.`
    );

    clearSelection();
  };

  // Update single record (Optimistic + PUT /api/records/[id])
  const updateRecord = (id: string, updates: Partial<TrackerRecord>) => {
    const existingRec = records.find(r => r.id === id);
    const enrichedUpdates: Partial<TrackerRecord> = { ...updates };

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

    fetch(`/api/records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(enrichedUpdates),
    }).catch(() => {});

    const rec = records.find(r => r.id === id);
    if (!updates.status || (existingRec && updates.status === existingRec.status)) {
      addAuditLog('Record Updated', `Updated fields on ${rec?.regNo || id}`, rec?.regNo);
    }
  };

  // Add new record (Optimistic + POST /api/records)
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

    fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newRecord),
    })
      .then(res => (res.ok ? res.json() : null))
      .then(saved => {
        if (saved?.id && saved.id !== newId) {
          setRecords(prev => prev.map(r => (r.id === newId ? normalizeRecordFromApi(saved) : r)));
        }
      })
      .catch(() => {});

    addAuditLog(
      'New Record Added',
      `Added vehicle ${newRecord.regNo} (${newRecord.customerName}) with status "${newRecord.status}"`,
      newRecord.regNo
    );
  };

  // Delete records (Optimistic + DELETE /api/records/[id])
  const deleteRecords = (recordIds: string[]) => {
    if (recordIds.length === 0) return;
    setRecords(prev => prev.filter(r => !recordIds.includes(r.id)));
    setSelectedRecordIds(prev => prev.filter(id => !recordIds.includes(id)));

    recordIds.forEach(id => {
      fetch(`/api/records/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      }).catch(() => {});
    });

    addAuditLog('Records Deleted', `Deleted ${recordIds.length} record(s)`);
  };

  // Batch update status (Optimistic + PUT /api/records/[id])
  const batchUpdateStatus = (recordIds: string[], status: TrackerRecord['status']) => {
    if (recordIds.length === 0) return;
    const now = new Date().toISOString();
    const actorUsername = currentUser.username || currentUser.name;
    const actorUserId = currentUser.id;

    setRecords(prev =>
      prev.map(r =>
        recordIds.includes(r.id)
          ? {
              ...r,
              status,
              statusChangedAt: now,
              statusChangedBy: actorUsername,
              statusChangedByUserId: actorUserId,
              statusChangedRecordId: r.id,
              updatedAt: now,
            }
          : r
      )
    );

    recordIds.forEach(id => {
      fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status,
          statusChangedAt: now,
          statusChangedBy: actorUsername,
          statusChangedByUserId: actorUserId,
        }),
      }).catch(() => {});
    });

    const affectedRecs = records.filter(r => recordIds.includes(r.id));
    const firstRec = affectedRecs[0];
    setLastStatusChange({
      recordId: recordIds.join(', '),
      regNo: firstRec
        ? `${firstRec.regNo}${recordIds.length > 1 ? ` (+${recordIds.length - 1} more)` : ''}`
        : recordIds.join(', '),
      customerName: firstRec?.customerName || '',
      newStatus: status,
      changedByUserId: actorUserId,
      changedByUsername: actorUsername,
      changedByName: currentUser.name,
      timestamp: now,
    });
    addAuditLog(
      'Batch Status Updated',
      `Updated status to "${status}" for ${recordIds.length} record ID(s): [${recordIds.join(', ')}] by User ID: ${actorUserId} (@${actorUsername})`
    );
  };

  // Batch update tracker status (Optimistic + PUT /api/records/[id])
  const batchUpdateTrackerStatus = (recordIds: string[], trackerStatus: TrackerRecord['trackerStatus']) => {
    if (recordIds.length === 0) return;
    const now = new Date().toISOString();
    setRecords(prev =>
      prev.map(r => (recordIds.includes(r.id) ? { ...r, trackerStatus, updatedAt: now } : r))
    );

    recordIds.forEach(id => {
      fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ trackerStatus }),
      }).catch(() => {});
    });

    addAuditLog('Batch Tracker Status Updated', `Updated tracker status to "${trackerStatus}" for ${recordIds.length} record(s)`);
  };

  // Import records
  const importRecords = (newRecords: TrackerRecord[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setRecords(newRecords);
    } else {
      setRecords(prev => [...newRecords, ...prev]);
    }

    newRecords.forEach(rec => {
      fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(rec),
      }).catch(() => {});
    });

    addAuditLog('Records Imported', `Imported ${newRecords.length} records (${mode} mode)`);
    clearSelection();
  };

  // Compute effective permissions for any user
  const getUserEffectivePermissions = useCallback(
    (userId: string): AgentPermissions => {
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
    },
    [users, agentPermissions]
  );

  const effectivePermissions = useMemo<AgentPermissions>(() => {
    return getUserEffectivePermissions(currentUser.id);
  }, [currentUser.id, getUserEffectivePermissions]);

  // Agent Permissions Handlers
  const updateAgentPermissions = (updates: Partial<AgentPermissions>, targetUserId?: string) => {
    if (targetUserId && targetUserId !== 'global') {
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
    if (targetUserId && targetUserId !== 'global') {
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

  // Factory Reset / Wipe Portal (local cache only; database is untouched)
  const factoryResetPortal = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setRecords([]);
    setUsers([]);
    setAuditLogs([]);
    setLastStatusChange(null);
    setAgentPermissions(DEFAULT_AGENT_PERMISSIONS);
    setCurrentUserId('');
    setIsAuthenticated(false);
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