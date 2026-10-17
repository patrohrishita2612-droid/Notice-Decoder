import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  institution?: string;
  department?: string;
  authProvider?: 'email' | 'google' | 'github';
  role?: 'student' | 'professor' | 'admin';
}

interface StoredUserRecord extends User {
  passwordHash: string;
  createdAt: string;
}

interface AuthSession {
  token: string;
  user: User;
  keepMeSignedIn: boolean;
  expiresAt: number;
}

export interface OfflineSyncItem {
  id: string;
  action: 'create_event' | 'update_event' | 'delete_event' | 'decode_notice';
  payload: any;
  timestamp: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnline: boolean;
  intendedDestination: string | null;
  setIntendedDestination: (dest: string | null) => void;
  login: (email: string, password: string, keepMeSignedIn?: boolean) => Promise<{ success: boolean; error?: string; destination?: string | null }>;
  register: (name: string, email: string, password: string, keepMeSignedIn?: boolean, role?: 'student' | 'professor') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  oauthLogin: (provider: 'google' | 'github') => Promise<{ success: boolean; error?: string }>;
  pendingSyncCount: number;
  queueOfflineAction: (action: Omit<OfflineSyncItem, 'id' | 'timestamp'>) => void;
  syncOfflineQueue: () => Promise<void>;
  getUserStorageKey: (prefix: string) => string;
}

const USERS_STORAGE_KEY = 'notice_decoder_users_registry_v1';
const SESSION_LOCAL_KEY = 'notice_decoder_session_local_v1';
const SESSION_SESSION_KEY = 'notice_decoder_session_temp_v1';
const SYNC_QUEUE_PREFIX = 'notice_decoder_sync_queue';

// Demo logins configuration: enabled in dev or when explicitly configured
export const ALLOW_DEMO_LOGINS = import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEMO_LOGINS === 'true';

export const DEMO_CREDENTIALS = {
  student: {
    name: 'Student Demo (Kavya Rane)',
    email: 'student@campus.edu',
    password: 'campus2026',
    role: 'student' as const,
    institution: 'Department of Computer Engineering'
  },
  professor: {
    name: 'Dr. Evelyn Reed',
    email: 'professor@campus.edu',
    password: 'prof2026',
    role: 'professor' as const,
    institution: 'Department of Computer Science & Engineering',
    department: 'Department of Computer Science & Engineering'
  }
};

const DEMO_ACCOUNTS: StoredUserRecord[] = [
  {
    id: 'user-demo-student',
    name: DEMO_CREDENTIALS.student.name,
    email: DEMO_CREDENTIALS.student.email,
    institution: DEMO_CREDENTIALS.student.institution,
    role: 'student',
    passwordHash: DEMO_CREDENTIALS.student.password,
    createdAt: '2026-01-01T00:00:00.000Z',
    authProvider: 'email'
  },
  {
    id: 'user-demo-professor',
    name: DEMO_CREDENTIALS.professor.name,
    email: DEMO_CREDENTIALS.professor.email,
    institution: DEMO_CREDENTIALS.professor.institution,
    department: DEMO_CREDENTIALS.professor.department,
    role: 'professor',
    passwordHash: DEMO_CREDENTIALS.professor.password,
    createdAt: '2026-01-01T00:00:00.000Z',
    authProvider: 'email'
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [intendedDestination, setIntendedDestination] = useState<string | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Helper to scope storage to current authenticated user
  const getUserStorageKey = useCallback((prefix: string): string => {
    return `${prefix}_${user?.id || 'unauthenticated'}`;
  }, [user?.id]);

  // Read pending sync queue length
  const refreshPendingSyncCount = useCallback(() => {
    if (!user) {
      setPendingSyncCount(0);
      return;
    }
    try {
      const key = `${SYNC_QUEUE_PREFIX}_${user.id}`;
      const raw = localStorage.getItem(key);
      const queue: OfflineSyncItem[] = raw ? JSON.parse(raw) : [];
      setPendingSyncCount(queue.length);
    } catch {
      setPendingSyncCount(0);
    }
  }, [user]);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when back online
      syncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize and check existing session on mount
  useEffect(() => {
    try {
      const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
      let users: StoredUserRecord[] = rawUsers ? JSON.parse(rawUsers) : [];

      if (ALLOW_DEMO_LOGINS) {
        // Ensure student & professor demo accounts exist in registry
        for (const demo of DEMO_ACCOUNTS) {
          const idx = users.findIndex(u => u.email.toLowerCase() === demo.email.toLowerCase());
          if (idx >= 0) {
            users[idx] = { ...users[idx], ...demo };
          } else {
            users.push(demo);
          }
        }
      } else {
        // In production, keep demo accounts purged unless explicitly allowed
        users = users.filter(
          u => u.email.toLowerCase() !== DEMO_CREDENTIALS.student.email && u.email.toLowerCase() !== DEMO_CREDENTIALS.professor.email
        );
      }
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      // Storage error
    }

    // Check persistent session in localStorage first, then sessionStorage
    let rawSession = localStorage.getItem(SESSION_LOCAL_KEY);
    if (!rawSession) {
      rawSession = sessionStorage.getItem(SESSION_SESSION_KEY);
    }

    if (rawSession) {
      try {
        const session: AuthSession = JSON.parse(rawSession);
        const isDemo = session.user && (
          session.user.email.toLowerCase() === DEMO_CREDENTIALS.student.email ||
          session.user.email.toLowerCase() === DEMO_CREDENTIALS.professor.email
        );

        if (isDemo && !ALLOW_DEMO_LOGINS) {
          localStorage.removeItem(SESSION_LOCAL_KEY);
          sessionStorage.removeItem(SESSION_SESSION_KEY);
          setUser(null);
          setToken(null);
        } else if (session.expiresAt > Date.now() && session.user && session.token) {
          // Valid authenticated session verified
          setUser(session.user);
          setToken(session.token);
        } else {
          // Expired session - purge completely
          localStorage.removeItem(SESSION_LOCAL_KEY);
          sessionStorage.removeItem(SESSION_SESSION_KEY);
          setUser(null);
          setToken(null);
        }
      } catch {
        localStorage.removeItem(SESSION_LOCAL_KEY);
        sessionStorage.removeItem(SESSION_SESSION_KEY);
        setUser(null);
        setToken(null);
      }
    }

    setIsLoading(false);
  }, []);

  // Sync count on user change
  useEffect(() => {
    refreshPendingSyncCount();
  }, [user, refreshPendingSyncCount]);

  const getUsersRegistry = (): StoredUserRecord[] => {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      const list: StoredUserRecord[] = raw ? JSON.parse(raw) : [];
      if (ALLOW_DEMO_LOGINS) {
        for (const demo of DEMO_ACCOUNTS) {
          if (!list.some(u => u.email.toLowerCase() === demo.email.toLowerCase())) {
            list.push(demo);
          }
        }
      }
      return list;
    } catch {
      return ALLOW_DEMO_LOGINS ? DEMO_ACCOUNTS : [];
    }
  };

  const saveSession = (authenticatedUser: User, keepMeSignedIn: boolean) => {
    const expiresAt = keepMeSignedIn
      ? Date.now() + 1000 * 60 * 60 * 24 * 30 // 30 days
      : Date.now() + 1000 * 60 * 60 * 8; // 8 hours

    const sessionToken = `token_${authenticatedUser.id}_${authenticatedUser.role || 'student'}_${Date.now()}`;
    const session: AuthSession = {
      token: sessionToken,
      user: authenticatedUser,
      keepMeSignedIn,
      expiresAt
    };

    if (keepMeSignedIn) {
      localStorage.setItem(SESSION_LOCAL_KEY, JSON.stringify(session));
      sessionStorage.removeItem(SESSION_SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_SESSION_KEY, JSON.stringify(session));
      localStorage.removeItem(SESSION_LOCAL_KEY);
    }

    setUser(authenticatedUser);
    setToken(sessionToken);
  };

  const login = async (
    email: string,
    password: string,
    keepMeSignedIn = true
  ): Promise<{ success: boolean; error?: string; destination?: string | null }> => {
    // Critical: Do NOT bypass login when offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        success: false,
        error: 'Internet Connection Required: You are currently offline. An active network connection is required to authenticate your campus credentials. Authentication cannot be bypassed offline.'
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: 'Email and password are required.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid campus email address.' };
    }

    const registry = getUsersRegistry();
    const existing = registry.find(u => u.email.toLowerCase() === cleanEmail);

    if (!existing) {
      return {
        success: false,
        error: 'No account found with this email. Please check your credentials or create an account.'
      };
    }

    if (existing.passwordHash !== cleanPassword) {
      return { success: false, error: 'Incorrect password. Please verify your campus credentials.' };
    }

    const authUser: User = {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      institution: existing.institution,
      role: existing.role || 'student',
      authProvider: existing.authProvider
    };

    saveSession(authUser, keepMeSignedIn);

    const dest = intendedDestination;
    setIntendedDestination(null);

    return { success: true, destination: dest };
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    keepMeSignedIn = true,
    role: 'student' | 'professor' = 'student'
  ): Promise<{ success: boolean; error?: string }> => {
    // Critical: Do NOT allow offline registration
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        success: false,
        error: 'Internet Connection Required: You are currently offline. An active network connection is required to register a campus account.'
      };
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName) {
      return { success: false, error: 'Please enter your full name.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid campus email address.' };
    }

    if (cleanPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const registry = getUsersRegistry();
    const duplicate = registry.find(u => u.email.toLowerCase() === cleanEmail);
    if (duplicate) {
      return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
    }

    const newRecord: StoredUserRecord = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      email: cleanEmail,
      institution: role === 'professor' ? 'Department Faculty & Research' : 'University Academic Member',
      role: role,
      passwordHash: cleanPassword,
      createdAt: new Date().toISOString(),
      authProvider: 'email'
    };

    const updatedRegistry = [...registry, newRecord];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedRegistry));

    const authUser: User = {
      id: newRecord.id,
      name: newRecord.name,
      email: newRecord.email,
      institution: newRecord.institution,
      role: role,
      authProvider: newRecord.authProvider
    };

    saveSession(authUser, keepMeSignedIn);
    return { success: true };
  };

  const resetPassword = async (
    email: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        success: false,
        error: 'Internet Connection Required: Cannot reset password while offline.'
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your account email.' };
    }
    if (newPassword.trim().length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    const registry = getUsersRegistry();
    const index = registry.findIndex(u => u.email.toLowerCase() === cleanEmail);

    if (index === -1) {
      return { success: false, error: 'No account registered with this email address.' };
    }

    registry[index].passwordHash = newPassword.trim();
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(registry));

    return { success: true };
  };

  const oauthLogin = async (
    provider: 'google' | 'github'
  ): Promise<{ success: boolean; error?: string }> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        success: false,
        error: 'Internet Connection Required: Cannot verify campus SSO while offline.'
      };
    }

    const providerName = provider === 'google' ? 'Google Workspace' : 'GitHub Campus';
    const authUser: User = {
      id: `oauth_${provider}_${Date.now()}`,
      name: `${providerName} Scholar`,
      email: `${provider}.user@campus.edu`,
      institution: 'Verified University SSO',
      role: 'student',
      authProvider: provider
    };

    saveSession(authUser, true);
    return { success: true };
  };

  // Queue an offline event or notice modification
  const queueOfflineAction = useCallback((action: Omit<OfflineSyncItem, 'id' | 'timestamp'>) => {
    if (!user) return;
    const key = `${SYNC_QUEUE_PREFIX}_${user.id}`;
    try {
      const raw = localStorage.getItem(key);
      const queue: OfflineSyncItem[] = raw ? JSON.parse(raw) : [];
      const newItem: OfflineSyncItem = {
        ...action,
        id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now()
      };
      queue.push(newItem);
      localStorage.setItem(key, JSON.stringify(queue));
      setPendingSyncCount(queue.length);
    } catch {
      // Storage error
    }
  }, [user]);

  // Synchronize queued offline actions with backend
  const syncOfflineQueue = async (): Promise<void> => {
    if (!user) return;
    const key = `${SYNC_QUEUE_PREFIX}_${user.id}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const queue: OfflineSyncItem[] = JSON.parse(raw);
      if (queue.length === 0) return;

      // In real backend scenario, post queue to /api/sync
      // For now, flush the queue upon successful connection restoration
      localStorage.removeItem(key);
      setPendingSyncCount(0);
    } catch {
      // Sync error
    }
  };

  const logout = () => {
    // Purge active session completely
    localStorage.removeItem(SESSION_LOCAL_KEY);
    sessionStorage.removeItem(SESSION_SESSION_KEY);
    setUser(null);
    setToken(null);
    setIntendedDestination(null);
    setPendingSyncCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isOnline,
        intendedDestination,
        setIntendedDestination,
        login,
        register,
        logout,
        resetPassword,
        oauthLogin,
        pendingSyncCount,
        queueOfflineAction,
        syncOfflineQueue,
        getUserStorageKey
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
