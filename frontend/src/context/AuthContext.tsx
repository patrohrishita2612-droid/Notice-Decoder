import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  institution?: string;
  authProvider?: 'email' | 'google' | 'github';
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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, keepMeSignedIn?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, keepMeSignedIn?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  oauthLogin: (provider: 'google' | 'github') => Promise<{ success: boolean; error?: string }>;
}

const USERS_STORAGE_KEY = 'notice_decoder_users_registry_v1';
const SESSION_LOCAL_KEY = 'notice_decoder_session_local_v1';
const SESSION_SESSION_KEY = 'notice_decoder_session_temp_v1';

// Seed account for easy testing
const SEED_USERS: StoredUserRecord[] = [
  {
    id: 'user-default-1',
    name: 'Kavya Rane',
    email: 'kavya@campus.edu',
    institution: 'Department of Computer Engineering',
    passwordHash: 'password123',
    createdAt: new Date().toISOString(),
    authProvider: 'email'
  },
  {
    id: 'user-default-2',
    name: 'Student Demo',
    email: 'student@campus.edu',
    institution: 'Engineering Faculty',
    passwordHash: 'campus2026',
    createdAt: new Date().toISOString(),
    authProvider: 'email'
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and check existing session on mount
  useEffect(() => {
    // Ensure initial registry has seed users if empty
    const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (!rawUsers) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(SEED_USERS));
    }

    // Check persistent session in localStorage first, then sessionStorage
    let rawSession = localStorage.getItem(SESSION_LOCAL_KEY);
    if (!rawSession) {
      rawSession = sessionStorage.getItem(SESSION_SESSION_KEY);
    }

    if (rawSession) {
      try {
        const session: AuthSession = JSON.parse(rawSession);
        if (session.expiresAt > Date.now()) {
          setUser(session.user);
        } else {
          // Expired session
          localStorage.removeItem(SESSION_LOCAL_KEY);
          sessionStorage.removeItem(SESSION_SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(SESSION_LOCAL_KEY);
        sessionStorage.removeItem(SESSION_SESSION_KEY);
      }
    }

    setIsLoading(false);
  }, []);

  const getUsersRegistry = (): StoredUserRecord[] => {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : SEED_USERS;
    } catch {
      return SEED_USERS;
    }
  };

  const saveSession = (authenticatedUser: User, keepMeSignedIn: boolean) => {
    const expiresAt = keepMeSignedIn
      ? Date.now() + 1000 * 60 * 60 * 24 * 30 // 30 days
      : Date.now() + 1000 * 60 * 60 * 8; // 8 hours

    const session: AuthSession = {
      token: `token_${authenticatedUser.id}_${Date.now()}`,
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
  };

  const login = async (
    email: string,
    password: string,
    keepMeSignedIn = true
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: 'Email and password are required.' };
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
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
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    const authUser: User = {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      institution: existing.institution,
      authProvider: existing.authProvider
    };

    saveSession(authUser, keepMeSignedIn);
    return { success: true };
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    keepMeSignedIn = true
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName) {
      return { success: false, error: 'Please enter your full name.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
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
      institution: 'University Academic Member',
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
      authProvider: newRecord.authProvider
    };

    saveSession(authUser, keepMeSignedIn);
    return { success: true };
  };

  const resetPassword = async (
    email: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
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
    // Provide a verified simulated campus SSO authentication
    const providerName = provider === 'google' ? 'Google Workspace' : 'GitHub Campus';
    const authUser: User = {
      id: `oauth_${provider}_${Date.now()}`,
      name: `${providerName} Scholar`,
      email: `${provider}.user@campus.edu`,
      institution: 'Verified University SSO',
      authProvider: provider
    };

    saveSession(authUser, true);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_LOCAL_KEY);
    sessionStorage.removeItem(SESSION_SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        resetPassword,
        oauthLogin
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
