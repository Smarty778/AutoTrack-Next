'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
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

// --------------------------------------------------
// Extra types for Status Logs & Job Cards
// --------------------------------------------------
export interface StatusChangeLog {
  id: string;
  recordId: string;
  previousStatus?: string | null;
  newStatus: string;
  changedByUserId?: string | null;
  changedByName: string;
  changedByUsername: string;
  remarks?: string | null;
  timestamp: string;
  record?: {
    id: string;
    regNo: string;
    customerName: string;
  };
  changedByUser?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface JobCard {
  id: string;
  jobCardNo: string;
  recordId: string;
  jobType: string;
  technicianName: string;
  installationCity: string;
  scheduledDate?: string | null;
  completedDate?: string | null;
  status: string;
  odometerReading?: string | null;
  imeiNumber?: string | null;
  simNumber?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  record?: {
    id: string;
    regNo: string;
    customerName: string;
    make?: string;
    model?: string;
    contact1?: string;
  };
}

export interface RegisterAccountInput {
  name: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
}

export interface AuditLogQuery {
  from?: string;
  to?: string;
  search?: string;
  take?: number;
  signal?: AbortSignal;
}

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

  // Status Logs, Audit Logs & Job Cards
  statusLogs: StatusChangeLog[];
  jobCards: JobCard[];
  fetchAuditLogs: (query?: AuditLogQuery) => Promise<{ logs: AuditLogEntry[]; total: number } | null>;

  // Selection
  toggleSelectRecord: (id: string) => void;
  selectAllRecords: (select: boolean) => void;
  clearSelection: () => void;

  // Filter actions
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  activeFilterCount: number;

  // Assignment & Record Mutations
  assignRecords: (recordIds: string[], targetUserId: string, targetUserName: string) => Promise<boolean>;
  updateRecord: (id: string, updates: Partial<TrackerRecord>) => Promise<boolean>;
  addRecord: (record: Omit<TrackerRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  deleteRecords: (recordIds: string[]) => Promise<boolean>;
  batchUpdateStatus: (recordIds: string[], status: TrackerRecord['status']) => Promise<boolean>;
  batchUpdateTrackerStatus: (
    recordIds: string[],
    trackerStatus: TrackerRecord['trackerStatus']
  ) => Promise<boolean>;

  // Status Logs
  fetchStatusLogs: (recordId?: string) => Promise<void>;

  // Job Cards
  fetchJobCards: (filters?: { recordId?: string; status?: string }) => Promise<void>;
  createJobCard: (data: Partial<JobCard> & { recordId: string }) => Promise<JobCard | null>;
  updateJobCard: (id: string, updates: Partial<JobCard>) => Promise<JobCard | null>;
  deleteJobCard: (id: string) => Promise<boolean>;

  // Agent Permissions Management (Admin control)
  updateAgentPermissions: (updates: Partial<AgentPermissions>, targetUserId?: string) => Promise<boolean>;
  resetAgentPermissionsToPreset: (preset: PermissionPreset, targetUserId?: string) => Promise<boolean>;
  getUserEffectivePermissions: (userId: string) => AgentPermissions;
  clearUserCustomPermissions: (userId: string) => Promise<boolean>;

  // User management & Authentication
  login: (
    usernameOrEmail: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  register: (input: RegisterAccountInput) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  addUser: (user: Omit<UserProfile, 'id'>) => Promise<boolean>;
  updateUserPassword: (userId: string, newPass: string) => Promise<boolean>;
  toggleUserActive: (userId: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;

  // Data management
  importRecords: (newRecords: TrackerRecord[], mode: 'append' | 'replace') => void;
  factoryResetPortal: () => void;
}

// Bumped version so old demo/seed data is ignored
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

// Empty placeholder so currentUser is never null before login
const EMPTY_USER = {
  id: '',
  name: 'Guest',
  username: '',
  email: '',
  role: 'user',
  active: false,
} as UserProfile;

// --------------------------------------------------
// Normalization helpers (Prisma uppercase → UI strings)
// --------------------------------------------------
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

const normalizeTrackerStatusFromApi = (
  ts?: string
): TrackerRecord['trackerStatus'] => {
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
  statusChangedAt: r.statusChangedAt
    ? new Date(r.statusChangedAt).toISOString()
    : undefined,
  createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
  updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined,
});

const normalizeUserFromApi = (u: any): UserProfile => {
  const { password: _legacyPassword, passwordHash: _neverExposeHash, permissions, ...safeUser } = u ?? {};
  return {
    ...safeUser,
    role: String(safeUser.role).toLowerCase() === 'admin' ? 'admin' : 'user',
    active: safeUser.active !== false,
    customPermissions: permissions ?? safeUser.customPermissions ?? undefined,
  } as UserProfile;
};

const normalizeStatusLogFromApi = (log: any): StatusChangeLog => ({
  ...log,
  previousStatus: log.previousStatus
    ? normalizeStatusFromApi(log.previousStatus)
    : null,
  newStatus: normalizeStatusFromApi(log.newStatus),
  timestamp: log.timestamp
    ? new Date(log.timestamp).toISOString()
    : new Date().toISOString(),
});

const normalizeJobCardFromApi = (jc: any): JobCard => ({
  ...jc,
  scheduledDate: jc.scheduledDate
    ? new Date(jc.scheduledDate).toISOString()
    : null,
  completedDate: jc.completedDate
    ? new Date(jc.completedDate).toISOString()
    : null,
  createdAt: jc.createdAt
    ? new Date(jc.createdAt).toISOString()
    : new Date().toISOString(),
  updatedAt: jc.updatedAt
    ? new Date(jc.updatedAt).toISOString()
    : new Date().toISOString(),
});

// --------------------------------------------------
// Context
// --------------------------------------------------
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [records, setRecords] = useState<TrackerRecord[]>([]);
  const [lastStatusChange, setLastStatusChange] =
    useState<LastStatusChange | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // New states
  const [statusLogs, setStatusLogs] = useState<StatusChangeLog[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);

  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [agentPermissions, setAgentPermissions] = useState<AgentPermissions>(
    DEFAULT_AGENT_PERMISSIONS
  );

  // Central API transport for the entire UI. All endpoint calls live behind
  // AppContext so cookies, cache policy and expired-session handling stay uniform.
  const clearClientSession = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUserId('');
    setUsers([]);
    setRecords([]);
    setAuditLogs([]);
    setStatusLogs([]);
    setJobCards([]);
    setSelectedRecordIds([]);
    setAgentPermissions(DEFAULT_AGENT_PERMISSIONS);
  }, []);

  const apiFetch = useCallback(async (
    input: RequestInfo | URL,
    init: RequestInit = {}
  ): Promise<Response> => {
    const response = await fetch(input, {
      credentials: 'include',
      cache: 'no-store',
      ...init,
    });
    if (response.status === 401) clearClientSession();
    return response;
  }, [clearClientSession]);

  // --------------------------------------------------
  // Sync from backend API
  // --------------------------------------------------
  const syncFromApi = useCallback(async () => {
    try {
      const [meRes, usersRes, recordsRes, logsRes, permissionsRes] = await Promise.allSettled([
        apiFetch('/api/auth/me', { credentials: 'include', cache: 'no-store' }),
        apiFetch('/api/users', { credentials: 'include', cache: 'no-store' }),
        apiFetch('/api/records', { credentials: 'include', cache: 'no-store' }),
        apiFetch('/api/audit-logs', { credentials: 'include', cache: 'no-store' }),
        apiFetch('/api/permissions', { credentials: 'include', cache: 'no-store' }),
      ]);

      // Users
      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const apiUsers = await usersRes.value.json();
        if (Array.isArray(apiUsers)) {
          setUsers(apiUsers.map(normalizeUserFromApi));
        }
      }

      // Current session
      if (meRes.status === 'fulfilled') {
        if (meRes.value.ok) {
          const meData = await meRes.value.json();
          if (meData?.success && meData?.user) {
            const me = normalizeUserFromApi(meData.user);
            setUsers((prev) =>
              prev.some((u) => u.id === me.id)
                ? prev.map((u) => (u.id === me.id ? { ...u, ...me } : u))
                : [...prev, me]
            );
            setCurrentUserId(me.id);
            setIsAuthenticated(true);
          }
        } else {
          // Browser storage is only a display cache; it is never proof of a session.
          setIsAuthenticated(false);
          setCurrentUserId('');
          setUsers([]);
          setRecords([]);
          setAuditLogs([]);
          setStatusLogs([]);
          setJobCards([]);
          setSelectedRecordIds([]);
          setAgentPermissions(DEFAULT_AGENT_PERMISSIONS);
        }
      } else {
        // When the session endpoint cannot be reached, fail closed rather than
        // treating a stale localStorage flag as an authenticated session.
        setIsAuthenticated(false);
        setCurrentUserId('');
        setUsers([]);
        setRecords([]);
        setAuditLogs([]);
        setStatusLogs([]);
        setJobCards([]);
        setSelectedRecordIds([]);
        setAgentPermissions(DEFAULT_AGENT_PERMISSIONS);
      }

      // Tracker Records
      if (recordsRes.status === 'fulfilled' && recordsRes.value.ok) {
        const apiRecords = await recordsRes.value.json();
        if (Array.isArray(apiRecords)) {
          setRecords(apiRecords.map(normalizeRecordFromApi));
        }
      }

      // Audit Logs
      if (logsRes.status === 'fulfilled' && logsRes.value.ok) {
        const apiLogs = await logsRes.value.json();
        if (Array.isArray(apiLogs)) setAuditLogs(apiLogs);
      }

      // Global permissions are server-persisted; the browser cache is only a fallback.
      if (permissionsRes.status === 'fulfilled' && permissionsRes.value.ok) {
        const policyData = await permissionsRes.value.json();
        if (policyData?.success && policyData?.permissions) {
          setAgentPermissions(policyData.permissions as AgentPermissions);
        }
      }
    } catch {
      // Keep localStorage state if offline
    }
  }, [apiFetch]);

  // Load from localStorage once, then sync from API
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
      read<UserProfile[]>(STORAGE_KEYS.USERS)?.map((u) => {
        const { password: _legacyPassword, passwordHash: _legacyHash, ...safeUser } = u as UserProfile & { passwordHash?: string };
        return (safeUser.role as string) === 'sales' ? { ...safeUser, role: 'user' as const } : safeUser;
      }) ?? null;
    const savedRecords = read<TrackerRecord[]>(STORAGE_KEYS.RECORDS);
    const savedLogs = read<AuditLogEntry[]>(STORAGE_KEYS.LOGS);
    const savedPerms = read<AgentPermissions>(STORAGE_KEYS.PERMISSIONS);
    const savedLast = read<LastStatusChange>(STORAGE_KEYS.LAST_STATUS_CHANGE);

    const effectiveRecords = savedRecords ?? [];

    if (savedUsers) setUsers(savedUsers);
    if (savedRecords) setRecords(savedRecords);
    if (savedLogs) setAuditLogs(savedLogs);
    if (savedPerms) setAgentPermissions(savedPerms);

    // Never restore the authenticated identity from localStorage. The signed
    // HTTP-only cookie validated by /api/auth/me is the sole session authority.
    setCurrentUserId('');
    setIsAuthenticated(false);

    if (savedLast) {
      setLastStatusChange(savedLast);
    } else {
      const latest = [...effectiveRecords]
        .filter((r) => r.statusChangedAt)
        .sort(
          (a, b) =>
            new Date(b.statusChangedAt!).getTime() -
            new Date(a.statusChangedAt!).getTime()
        )[0];
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

    // Keep auth pages on a loader until /api/auth/me has been checked. This
    // prevents a valid cookie from being redirected because client state starts
    // unauthenticated, and prevents localStorage from masquerading as a session.
    void syncFromApi().finally(() => setIsHydrated(true));
  }, [syncFromApi]);

  // Persist to localStorage after hydration
  useEffect(() => {
    if (isHydrated && lastStatusChange) {
      localStorage.setItem(
        STORAGE_KEYS.LAST_STATUS_CHANGE,
        JSON.stringify(lastStatusChange)
      );
    }
  }, [isHydrated, lastStatusChange]);

  useEffect(() => {
    if (isHydrated) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users.map((item) => { const { password: _legacyPassword, passwordHash: _legacyHash, ...safeUser } = item as UserProfile & { passwordHash?: string }; return safeUser; })));
  }, [isHydrated, users]);

  useEffect(() => {
    if (isHydrated)
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [isHydrated, currentUserId]);

  useEffect(() => {
    if (isHydrated)
      localStorage.setItem(STORAGE_KEYS.AUTH_STATE, JSON.stringify(isAuthenticated));
  }, [isHydrated, isAuthenticated]);

  useEffect(() => {
    if (isHydrated)
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }, [isHydrated, records]);

  useEffect(() => {
    if (isHydrated)
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
  }, [isHydrated, auditLogs]);

  useEffect(() => {
    if (isHydrated)
      localStorage.setItem(
        STORAGE_KEYS.PERMISSIONS,
        JSON.stringify(agentPermissions)
      );
  }, [isHydrated, agentPermissions]);

  const currentUser = useMemo<UserProfile>(() => {
    return users.find((u) => u.id === currentUserId) || EMPTY_USER;
  }, [users, currentUserId]);

  // --------------------------------------------------
  // Audit helper
  // --------------------------------------------------
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
      setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);

      apiFetch('/api/audit-logs', {
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
    [currentUser.name, apiFetch]
  );

  // --------------------------------------------------
  // Centralized API methods used by screens/components
  // --------------------------------------------------
  const fetchAuditLogs = useCallback(async (
    query: AuditLogQuery = {}
  ): Promise<{ logs: AuditLogEntry[]; total: number } | null> => {
    try {
      const params = new URLSearchParams();
      params.set('take', String(Math.min(Math.max(query.take ?? 5000, 1), 5000)));
      if (query.from) params.set('from', query.from);
      if (query.to) params.set('to', query.to);
      if (query.search?.trim()) params.set('search', query.search.trim());

      const response = await apiFetch(`/api/audit-logs?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
        signal: query.signal,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          setCurrentUserId('');
        }
        throw new Error(payload?.error || payload?.message || 'Unable to load audit history');
      }

      const logs: AuditLogEntry[] = Array.isArray(payload?.logs)
        ? payload.logs
        : Array.isArray(payload)
        ? payload
        : [];
      const total = typeof payload?.total === 'number' ? payload.total : logs.length;
      setAuditLogs(logs);
      return { logs, total };
    } catch (error) {
      if ((error as { name?: string })?.name !== 'AbortError') {
        console.error('fetchAuditLogs failed:', error);
      }
      return null;
    }
  }, [apiFetch]);

  // --------------------------------------------------
  // Auth
  // --------------------------------------------------
  const login = async (
    usernameOrEmail: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    const identifier = usernameOrEmail.trim().toLowerCase();

    if (!identifier || !password) {
      return { success: false, message: 'Enter your username/email and password.' };
    }

    try {
      const response = await apiFetch('/api/auth/login', {
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

      setUsers((previousUsers) => {
        const existingIndex = previousUsers.findIndex(
          (u) =>
            u.id === normalizedUser.id ||
            u.username?.toLowerCase() === identifier ||
            u.email?.toLowerCase() === identifier
        );

        if (existingIndex === -1) return [...previousUsers, normalizedUser];

        return previousUsers.map((u, i) =>
          i === existingIndex ? { ...u, ...normalizedUser } : u
        );
      });

      setCurrentUserId(normalizedUser.id);
      setIsAuthenticated(true);
      setSelectedRecordIds([]);
      setFilters((prev) => ({ ...prev, salesPerson: 'all' }));

      void syncFromApi();

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Cannot connect to the server. Please try again.',
      };
    }
  };

  const register = async (
    input: RegisterAccountInput
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          name: input.name.trim(),
          username: input.username.trim().toLowerCase(),
          email: input.email.trim().toLowerCase(),
          phone: input.phone?.trim() || '',
          city: input.city?.trim() || '',
          password: input.password,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success || !data?.user?.id) {
        return { success: false, message: data?.message || 'Registration failed. Please try again.' };
      }

      const registeredUser = normalizeUserFromApi(data.user);
      setUsers((previous) => previous.some((user) => user.id === registeredUser.id)
        ? previous.map((user) => user.id === registeredUser.id ? { ...user, ...registeredUser } : user)
        : [...previous, registeredUser]);
      setCurrentUserId(registeredUser.id);
      setIsAuthenticated(true);
      setSelectedRecordIds([]);
      setFilters(initialFilterState);

      // Re-query the authoritative cookie session and central API data.
      void syncFromApi();
      return { success: true };
    } catch (error) {
      console.error('Registration API failed:', error);
      return { success: false, message: 'Cannot connect to the server. Please try again.' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUserId('');
    setSelectedRecordIds([]);
    apiFetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
  };

  const switchUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUserId(userId);
      setIsAuthenticated(true);
      setSelectedRecordIds([]);
      setFilters((prev) => ({ ...prev, salesPerson: 'all' }));
      addAuditLog(
        'User Switched',
        `Active session switched to ${user.name} (${user.role.toUpperCase()})`
      );

      // The server session is authoritative. Never use cached/local user passwords
      // to switch identities; sign out and authenticate with the selected account.
    }
  };

  // --------------------------------------------------
  // User management
  // --------------------------------------------------
  const addUser = async (userData: Omit<UserProfile, 'id'>): Promise<boolean> => {
    const password = typeof userData.password === 'string' ? userData.password : '';
    if (password.length < 8) return false;
    const { password: _secret, ...publicUserData } = userData;
    const tempId = `user-${Date.now().toString(36)}`;
    const temporaryUser: UserProfile = { ...publicUserData, id: tempId, customPermissions: undefined };
    setUsers((prev) => [...prev, temporaryUser]);

    try {
      const response = await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: temporaryUser.name,
          username: temporaryUser.username,
          email: temporaryUser.email,
          password,
          role: temporaryUser.role,
          city: temporaryUser.city,
          phone: temporaryUser.phone,
          avatarColor: temporaryUser.avatarColor,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !result.user?.id) {
        setUsers((prev) => prev.filter((u) => u.id !== tempId));
        console.error('User creation failed:', result?.message || response.statusText);
        return false;
      }
      const savedUser = normalizeUserFromApi(result.user);
      setUsers((prev) => prev.map((u) => (u.id === tempId ? savedUser : u)));
      addAuditLog('User Created', `Created user account for ${savedUser.name} (@${savedUser.username})`);
      return true;
    } catch (error) {
      setUsers((prev) => prev.filter((u) => u.id !== tempId));
      console.error('User creation request failed:', error);
      return false;
    }
  };

  const updateUserPassword = async (userId: string, newPass: string): Promise<boolean> => {
    if (newPass.length < 8) return false;
    try {
      const response = await apiFetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, newPassword: newPass }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) return false;
      // Do not put password material into application state or localStorage.
      setUsers((prev) => prev.map((u) => {
        if (u.id !== userId) return u;
        const { password: _oldPassword, ...safeUser } = u;
        return safeUser;
      }));
      const target = users.find((u) => u.id === userId);
      addAuditLog('Password Reset', `Admin reset the password for ${target?.username || userId}.`);
      return true;
    } catch (error) {
      console.error('Password reset request failed:', error);
      return false;
    }
  };

  const toggleUserActive = async (userId: string): Promise<boolean> => {
    const target = users.find((u) => u.id === userId);
    if (!target) return false;
    try {
      const response = await apiFetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, active: !target.active }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) return false;
      setUsers((prev) => prev.map((u) => u.id === userId ? normalizeUserFromApi(result.user) : u));
      addAuditLog('User Status Changed', `${target.username} was ${!target.active ? 'activated' : 'deactivated'}.`);
      return true;
    } catch (error) {
      console.error('User status update failed:', error);
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser || (targetUser.role === 'admin' && users.filter((u) => u.role === 'admin').length <= 1)) return false;
    try {
      const response = await apiFetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) return false;
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setRecords((prev) => prev.map((r) => r.assignedToUserId === userId ? {
        ...r,
        assignedToUserId: undefined,
        salesPerson: 'Unassigned',
        coordinatedBy: 'Unassigned',
        updatedAt: new Date().toISOString(),
      } : r));
      addAuditLog('User Deleted', `Deleted user account for ${targetUser.name} (@${targetUser.username})`);
      return true;
    } catch (error) {
      console.error('User deletion failed:', error);
      return false;
    }
  };

  // --------------------------------------------------
  // Selection
  // --------------------------------------------------
  const toggleSelectRecord = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllRecords = (select: boolean) => {
    setSelectedRecordIds(select ? visibleRecords.map((r) => r.id) : []);
  };

  const clearSelection = () => setSelectedRecordIds([]);

  // --------------------------------------------------
  // Filters
  // --------------------------------------------------
  const setFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(initialFilterState);

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

  // --------------------------------------------------
  // Visible records
  // --------------------------------------------------
  const visibleRecords = useMemo(() => {
    let list = records;

    if (currentUser.role === 'user') {
      list = list.filter(
        (r) =>
          r.assignedToUserId === currentUser.id ||
          r.salesPerson.trim().toLowerCase() ===
            currentUser.name.trim().toLowerCase()
      );
    } else if (filters.salesPerson !== 'all') {
      if (filters.salesPerson === 'unassigned') {
        list = list.filter(
          (r) =>
            !r.assignedToUserId ||
            r.salesPerson.toLowerCase() === 'unassigned'
        );
      } else {
        list = list.filter(
          (r) =>
            r.assignedToUserId === filters.salesPerson ||
            r.salesPerson.toLowerCase() === filters.salesPerson.toLowerCase()
        );
      }
    }

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (r) =>
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

    if (filters.status !== 'all') {
      list = list.filter((r) => r.status === filters.status);
    }
    if (filters.trackerStatus !== 'all') {
      list = list.filter((r) => r.trackerStatus === filters.trackerStatus);
    }
    if (filters.insStatus !== 'all') {
      list = list.filter(
        (r) => r.insStatus.toLowerCase() === filters.insStatus.toLowerCase()
      );
    }
    if (filters.instCity !== 'all') {
      const cityQuery = filters.instCity.trim().toLocaleLowerCase();
      list = list.filter((r) => (r.instCity || '').toLocaleLowerCase().includes(cityQuery));
    }
    if (filters.showroom !== 'all') {
      list = list.filter(
        (r) => r.showroom.toLowerCase() === filters.showroom.toLowerCase()
      );
    }

    const today = new Date().toISOString().split('T')[0];
    if (filters.dueDatePreset === 'overdue') {
      list = list.filter(
        (r) =>
          r.dueDate &&
          r.dueDate < today &&
          r.status !== 'Continued' &&
          r.status !== 'Removed' &&
          r.status !== 'Removal'
      );
    } else if (filters.dueDatePreset === 'today') {
      list = list.filter((r) => r.dueDate === today);
    } else if (filters.dueDatePreset === 'next_7_days') {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      list = list.filter(
        (r) => r.dueDate && r.dueDate >= today && r.dueDate <= nextWeekStr
      );
    } else if (filters.dueDatePreset === 'has_due_date') {
      list = list.filter((r) => !!r.dueDate);
    } else if (filters.dueDatePreset === 'no_due_date') {
      list = list.filter((r) => !r.dueDate);
    }

    if (filters.instDatePreset === 'today') {
      list = list.filter((r) => r.dateOfInstallation === today);
    } else if (filters.instDatePreset === 'this_week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
      list = list.filter(
        (r) =>
          r.dateOfInstallation && r.dateOfInstallation >= oneWeekAgoStr
      );
    } else if (filters.instDatePreset === 'this_month') {
      const currentMonth = today.substring(0, 7);
      list = list.filter(
        (r) =>
          r.dateOfInstallation &&
          r.dateOfInstallation.startsWith(currentMonth)
      );
    }

    return list;
  }, [records, currentUser, filters]);

  // --------------------------------------------------
  // Record mutations
  // --------------------------------------------------
  const assignRecords = async (
    recordIds: string[],
    targetUserId: string,
    targetUserName: string
  ): Promise<boolean> => {
    if (recordIds.length === 0) return false;
    const isUnassign = targetUserId === 'unassigned';
    const assignedName = isUnassign ? 'Unassigned' : targetUserName;
    const assignedId = isUnassign ? null : targetUserId;

    const outcomes = await Promise.all(recordIds.map(async (id) => {
      try {
        const response = await apiFetch(`/api/records/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ assignedToUserId: assignedId, salesPerson: assignedName }),
        });
        const body = await response.json().catch(() => null);
        return { id, ok: response.ok && Boolean(body?.id), message: body?.error || body?.message };
      } catch {
        return { id, ok: false, message: 'Network error' };
      }
    }));
    const succeeded = outcomes.filter((outcome) => outcome.ok).map((outcome) => outcome.id);
    if (succeeded.length) {
      setRecords((previous) => previous.map((record) => succeeded.includes(record.id)
        ? { ...record, assignedToUserId: assignedId || undefined, salesPerson: assignedName, updatedAt: new Date().toISOString() }
        : record));
      addAuditLog(
        isUnassign ? 'Batch Unassigned' : 'Batch Assigned',
        `${isUnassign ? 'Unassigned' : 'Assigned'} ${succeeded.length} vehicle record(s) ${isUnassign ? '' : `to ${assignedName}`}.`,
      );
      clearSelection();
    }
    if (succeeded.length !== recordIds.length && typeof window !== 'undefined') {
      window.alert(`${succeeded.length} of ${recordIds.length} records were assigned. The rest were rejected by the API or could not be reached.`);
    }
    return succeeded.length === recordIds.length;
  };

  const updateRecord = async (id: string, updates: Partial<TrackerRecord>): Promise<boolean> => {
    const existingRec = records.find((record) => record.id === id);
    if (!existingRec) return false;

    const enrichedUpdates: Partial<TrackerRecord> = { ...updates };
    const statusChanged = Boolean(updates.status && updates.status !== existingRec.status);
    const timestamp = new Date().toISOString();
    if (statusChanged) {
      enrichedUpdates.statusChangedAt = timestamp;
      enrichedUpdates.statusChangedBy = currentUser.username || currentUser.name;
      enrichedUpdates.statusChangedByUserId = currentUser.id;
    }

    try {
      const response = await apiFetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(enrichedUpdates),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.id) {
        const message = result?.error || result?.message || 'The server did not save this record.';
        console.error('updateRecord failed:', message);
        if (typeof window !== 'undefined') window.alert(message);
        return false;
      }

      const savedRecord = normalizeRecordFromApi(result);
      setRecords((previous) => previous.map((record) => record.id === id ? savedRecord : record));

      if (statusChanged) {
        setLastStatusChange({
          recordId: id,
          regNo: savedRecord.regNo,
          customerName: savedRecord.customerName,
          previousStatus: existingRec.status,
          newStatus: savedRecord.status,
          changedByUserId: currentUser.id,
          changedByUsername: currentUser.username || currentUser.name,
          changedByName: currentUser.name,
          timestamp: savedRecord.statusChangedAt || timestamp,
        });
        addAuditLog(
          'Status Changed',
          `Status changed to "${savedRecord.status}" for ${savedRecord.regNo} by ${currentUser.name}.`,
          savedRecord.regNo,
        );
      } else {
        addAuditLog('Record Updated', `Updated fields on ${savedRecord.regNo}`, savedRecord.regNo);
      }
      return true;
    } catch (error) {
      console.error('updateRecord request failed:', error);
      if (typeof window !== 'undefined') window.alert('Could not reach the server. Your changes were not saved.');
      return false;
    }
  };

  const addRecord = async (
    recordData: Omit<TrackerRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    const timestamp = new Date().toISOString();
    const actorUsername = currentUser.username || currentUser.name;
    const actorUserId = currentUser.id;
    const actorName = currentUser.name;

    const payload: Omit<TrackerRecord, 'id' | 'createdAt' | 'updatedAt'> = {
      ...recordData,
      salesPerson: currentUser.role === 'user' ? currentUser.name : recordData.salesPerson || 'Unassigned',
      assignedToUserId: currentUser.role === 'user' ? currentUser.id : recordData.assignedToUserId,
      statusChangedAt: recordData.statusChangedAt || timestamp,
      statusChangedBy: actorUsername,
      statusChangedByUserId: actorUserId,
    };

    try {
      const response = await apiFetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.id) {
        const message = result?.error || result?.message || 'The vehicle record was not saved.';
        console.error('addRecord failed:', message);
        if (typeof window !== 'undefined') window.alert(message);
        return false;
      }

      const savedRecord = normalizeRecordFromApi(result);
      setRecords((previous) => [savedRecord, ...previous.filter((record) => record.id !== savedRecord.id)]);
      if (savedRecord.status) {
        setLastStatusChange({
          recordId: savedRecord.id,
          regNo: savedRecord.regNo,
          customerName: savedRecord.customerName,
          newStatus: savedRecord.status,
          changedByUserId: actorUserId,
          changedByUsername: actorUsername,
          changedByName: actorName,
          timestamp: savedRecord.statusChangedAt || timestamp,
        });
      }
      addAuditLog(
        'New Record Added',
        `Added vehicle ${savedRecord.regNo} (${savedRecord.customerName}) with status "${savedRecord.status}"`,
        savedRecord.regNo,
      );
      return true;
    } catch (error) {
      console.error('addRecord request failed:', error);
      if (typeof window !== 'undefined') window.alert('Could not reach the server. The new record was not saved.');
      return false;
    }
  };

  const deleteRecords = async (recordIds: string[]): Promise<boolean> => {
    if (recordIds.length === 0) return false;
    const outcomes = await Promise.all(recordIds.map(async (id) => {
      try {
        const response = await apiFetch(`/api/records/${id}`, { method: 'DELETE', credentials: 'include' });
        const body = await response.json().catch(() => null);
        return { id, ok: response.ok && body?.success === true, message: body?.error };
      } catch {
        return { id, ok: false, message: 'Network error' };
      }
    }));
    const succeeded = outcomes.filter((outcome) => outcome.ok).map((outcome) => outcome.id);
    if (succeeded.length) {
      setRecords((previous) => previous.filter((record) => !succeeded.includes(record.id)));
      setSelectedRecordIds((previous) => previous.filter((id) => !succeeded.includes(id)));
      addAuditLog('Records Deleted', `Deleted ${succeeded.length} record(s)`);
    }
    if (succeeded.length !== recordIds.length && typeof window !== 'undefined') {
      window.alert(`${succeeded.length} of ${recordIds.length} records were deleted. Remaining records were not removed.`);
    }
    return succeeded.length === recordIds.length;
  };

  const batchUpdateStatus = async (
    recordIds: string[],
    status: TrackerRecord['status']
  ): Promise<boolean> => {
    if (recordIds.length === 0) return false;
    const outcomes = await Promise.all(recordIds.map(async (id) => {
      try {
        const response = await apiFetch(`/api/records/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ status }),
        });
        const result = await response.json().catch(() => null);
        return { id, ok: response.ok && Boolean(result?.id), result };
      } catch {
        return { id, ok: false, result: null };
      }
    }));
    const succeeded = outcomes.filter((outcome) => outcome.ok);
    if (succeeded.length) {
      const savedById = new Map<string, TrackerRecord>(succeeded.map((item) => [item.id, normalizeRecordFromApi(item.result)] as [string, TrackerRecord]));
      setRecords((previous) => previous.map((record) => savedById.get(record.id) || record));
      const first = savedById.values().next().value as TrackerRecord | undefined;
      if (first) setLastStatusChange({
        recordId: first.id, regNo: first.regNo, customerName: first.customerName,
        previousStatus: records.find((record) => record.id === first.id)?.status,
        newStatus: first.status, changedByUserId: currentUser.id,
        changedByUsername: currentUser.username || currentUser.name,
        changedByName: currentUser.name, timestamp: first.statusChangedAt || new Date().toISOString(),
      });
      addAuditLog('Batch Status Updated', `Updated status to "${status}" for ${succeeded.length} record(s)`);
      clearSelection();
    }
    if (succeeded.length !== recordIds.length && typeof window !== 'undefined') {
      window.alert(`Status updated for ${succeeded.length} of ${recordIds.length} records. Check the selected agent permissions for the others.`);
    }
    return succeeded.length === recordIds.length;
  };

  const batchUpdateTrackerStatus = async (
    recordIds: string[],
    trackerStatus: TrackerRecord['trackerStatus']
  ): Promise<boolean> => {
    if (recordIds.length === 0) return false;
    const outcomes = await Promise.all(recordIds.map(async (id) => {
      try {
        const response = await apiFetch(`/api/records/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ trackerStatus }),
        });
        const result = await response.json().catch(() => null);
        return { id, ok: response.ok && Boolean(result?.id), result };
      } catch {
        return { id, ok: false, result: null };
      }
    }));
    const succeeded = outcomes.filter((outcome) => outcome.ok);
    if (succeeded.length) {
      const savedById = new Map<string, TrackerRecord>(succeeded.map((item) => [item.id, normalizeRecordFromApi(item.result)] as [string, TrackerRecord]));
      setRecords((previous) => previous.map((record) => savedById.get(record.id) || record));
      addAuditLog('Batch Tracker Status Updated', `Updated tracker status to "${trackerStatus}" for ${succeeded.length} record(s)`);
      clearSelection();
    }
    if (succeeded.length !== recordIds.length && typeof window !== 'undefined') {
      window.alert(`Tracker status updated for ${succeeded.length} of ${recordIds.length} records. Check the selected agent permissions for the others.`);
    }
    return succeeded.length === recordIds.length;
  };

  const importRecords = (
    newRecords: TrackerRecord[],
    mode: 'append' | 'replace'
  ) => {
    if (mode === 'replace') {
      setRecords(newRecords);
    } else {
      setRecords((prev) => [...newRecords, ...prev]);
    }

    newRecords.forEach((rec) => {
      apiFetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(rec),
      }).catch(() => {});
    });

    addAuditLog(
      'Records Imported',
      `Imported ${newRecords.length} records (${mode} mode)`
    );
    clearSelection();
  };

  // --------------------------------------------------
  // Status Logs
  // --------------------------------------------------
  const fetchStatusLogs = useCallback(async (recordId?: string) => {
    try {
      const url = recordId
        ? `/api/status-logs?recordId=${recordId}&limit=100`
        : '/api/status-logs?limit=100';

      const res = await apiFetch(url, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) return;

      const json = await res.json();
      const logs = Array.isArray(json.data)
        ? json.data.map(normalizeStatusLogFromApi)
        : Array.isArray(json)
        ? json.map(normalizeStatusLogFromApi)
        : [];

      setStatusLogs(logs);
    } catch (err) {
      console.error('fetchStatusLogs error:', err);
    }
  }, [apiFetch]);

  // --------------------------------------------------
  // Job Cards
  // --------------------------------------------------
  const fetchJobCards = useCallback(
    async (opts?: { recordId?: string; status?: string }) => {
      try {
        const params = new URLSearchParams();
        if (opts?.recordId) params.set('recordId', opts.recordId);
        if (opts?.status) params.set('status', opts.status);
        params.set('limit', '100');

        const res = await apiFetch(`/api/job-cards?${params.toString()}`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!res.ok) return;

        const json = await res.json();
        const cards = Array.isArray(json.data)
          ? json.data.map(normalizeJobCardFromApi)
          : Array.isArray(json)
          ? json.map(normalizeJobCardFromApi)
          : [];

        setJobCards(cards);
      } catch (err) {
        console.error('fetchJobCards error:', err);
      }
    },
    [apiFetch]
  );

  const createJobCard = useCallback(
    async (
      data: Partial<JobCard> & { recordId: string }
    ): Promise<JobCard | null> => {
      try {
        const res = await apiFetch('/api/job-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error('createJobCard failed:', err);
          return null;
        }

        const created = normalizeJobCardFromApi(await res.json());
        setJobCards((prev) => [created, ...prev]);

        addAuditLog(
          'Job Card Created',
          `Created job card ${created.jobCardNo}`,
          created.record?.regNo
        );

        return created;
      } catch (err) {
        console.error('createJobCard error:', err);
        return null;
      }
    },
    [apiFetch, addAuditLog]
  );

  const updateJobCard = useCallback(
    async (id: string, updates: Partial<JobCard>): Promise<JobCard | null> => {
      try {
        const res = await apiFetch(`/api/job-cards/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error('updateJobCard failed:', err);
          return null;
        }

        const updated = normalizeJobCardFromApi(await res.json());
        setJobCards((prev) =>
          prev.map((jc) => (jc.id === id ? updated : jc))
        );

        addAuditLog(
          'Job Card Updated',
          `Updated job card ${updated.jobCardNo}`,
          updated.record?.regNo
        );

        return updated;
      } catch (err) {
        console.error('updateJobCard error:', err);
        return null;
      }
    },
    [apiFetch, addAuditLog]
  );

  const deleteJobCard = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await apiFetch(`/api/job-cards/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!res.ok) return false;

        setJobCards((prev) => prev.filter((jc) => jc.id !== id));
        addAuditLog('Job Card Deleted', `Deleted job card ID: ${id}`);
        return true;
      } catch (err) {
        console.error('deleteJobCard error:', err);
        return false;
      }
    },
    [apiFetch, addAuditLog]
  );

  // --------------------------------------------------
  // Permissions
  // --------------------------------------------------
  const getUserEffectivePermissions = useCallback(
    (userId: string): AgentPermissions => {
      const target = users.find((u) => u.id === userId);
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

  const effectivePermissions = useMemo(
    () => getUserEffectivePermissions(currentUser.id),
    [currentUser.id, getUserEffectivePermissions]
  );

  const updateAgentPermissions = async (
    updates: Partial<AgentPermissions>,
    targetUserId?: string
  ): Promise<boolean> => {
    if (targetUserId && targetUserId !== 'global') {
      const newPermissions = { ...getUserEffectivePermissions(targetUserId), ...updates };
      try {
        const response = await apiFetch('/api/users', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ userId: targetUserId, customPermissions: newPermissions }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) return false;
        const savedPermissions = result.customPermissions || newPermissions;
        setUsers((prev) => prev.map((u) => u.id === targetUserId ? { ...u, customPermissions: savedPermissions } : u));
        const targetUser = users.find((u) => u.id === targetUserId);
        addAuditLog('Agent Permissions Updated', `Admin modified custom edit permissions for agent ${targetUser?.name || targetUserId}.`);
        return true;
      } catch (error) {
        console.error('Saving agent permissions failed:', error);
        return false;
      }
    }

    const nextPermissions = { ...agentPermissions, ...updates };
    try {
      const response = await apiFetch('/api/permissions', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ permissions: nextPermissions }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) return false;
      setAgentPermissions(result.permissions as AgentPermissions);
      addAuditLog('Global Permissions Updated', 'Admin modified global edit permissions for all agents who inherit the global policy.');
      return true;
    } catch (error) {
      console.error('Saving global permissions failed:', error);
      return false;
    }
  };

  const clearUserCustomPermissions = async (userId: string): Promise<boolean> => {
    try {
      const response = await apiFetch('/api/users', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ userId, clearCustomPermissions: true }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) return false;
      setUsers((prev) => prev.map((u) => {
        if (u.id !== userId) return u;
        const { customPermissions: _custom, ...rest } = u;
        return rest;
      }));
      const targetUser = users.find((u) => u.id === userId);
      addAuditLog('Agent Permissions Reset', `Reverted agent ${targetUser?.name || userId} to global policy.`);
      return true;
    } catch (error) {
      console.error('Clearing custom agent permissions failed:', error);
      return false;
    }
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
      default:
        return DEFAULT_AGENT_PERMISSIONS;
    }
  };

  const resetAgentPermissionsToPreset = async (
    preset: PermissionPreset,
    targetUserId?: string
  ): Promise<boolean> => {
    const newPerms = getPresetPermissions(preset);
    try {
      if (targetUserId && targetUserId !== 'global') {
        const response = await apiFetch('/api/users', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ userId: targetUserId, customPermissions: newPerms }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) return false;
        setUsers((prev) => prev.map((u) => u.id === targetUserId
          ? { ...u, customPermissions: result.customPermissions || newPerms }
          : u));
        const targetUser = users.find((u) => u.id === targetUserId);
        addAuditLog('Agent Preset Applied', `Admin applied "${preset.toUpperCase()}" preset to agent ${targetUser?.name || targetUserId}.`);
      } else {
        const response = await apiFetch('/api/permissions', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ permissions: newPerms }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) return false;
        setAgentPermissions(result.permissions as AgentPermissions);
        addAuditLog('Global Permissions Preset Applied', `Admin set global agent permissions to "${preset.toUpperCase()}" preset.`);
      }
      return true;
    } catch (error) {
      console.error('Saving agent permission preset failed:', error);
      return false;
    }
  };

  // --------------------------------------------------
  // Factory reset
  // --------------------------------------------------
  const factoryResetPortal = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    apiFetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});

    setRecords([]);
    setUsers([]);
    setAuditLogs([]);
    setStatusLogs([]);
    setJobCards([]);
    setLastStatusChange(null);
    setAgentPermissions(DEFAULT_AGENT_PERMISSIONS);
    setCurrentUserId('');
    setIsAuthenticated(false);
    setSelectedRecordIds([]);
    setFilters(initialFilterState);
    window.location.reload();
  };

  // --------------------------------------------------
  // Provider
  // --------------------------------------------------
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

        // New
        statusLogs,
        jobCards,
        fetchAuditLogs,

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

        // New methods
        fetchStatusLogs,
        fetchJobCards,
        createJobCard,
        updateJobCard,
        deleteJobCard,

        updateAgentPermissions,
        resetAgentPermissionsToPreset,
        getUserEffectivePermissions,
        clearUserCustomPermissions,
        login,
        register,
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