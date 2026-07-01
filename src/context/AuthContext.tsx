// Auth Context - Provide authentication state to React components

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../lib/security-types';
import { getCurrentUser, login as authLogin, logout as authLogout, initializeSecurity } from '../lib/auth';
import { clearAllPermissionCache } from '../lib/permissions';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        setError(null);
        // Initialize security data (roles, permissions, admin user)
        await initializeSecurity();

        // Get current session
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('[v0] Auth init error:', errorMsg);
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  const login = async (username: string, password: string) => {
    const result = await authLogin(username, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return { success: result.success, error: result.error };
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
    clearAllPermissionCache();
  };

  const refreshUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  // Always return a context object - never throw
  return context || {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
    login: async () => ({ success: false, error: 'Auth context not ready' }),
    logout: async () => {},
    refreshUser: async () => {},
  };
}

// Permission Guard component
interface PermissionGuardProps {
  permission: string | string[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ permission, requireAll = false, children, fallback = null }: PermissionGuardProps) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    async function checkPermission() {
      if (!user) {
        setHasPermission(false);
        return;
      }

      const { hasPermission: checkSingle, hasAnyPermission, hasAllPermissions } = await import('../lib/permissions');

      const permissions = Array.isArray(permission) ? permission : [permission];

      if (requireAll) {
        const result = await hasAllPermissions(user.id, permissions);
        setHasPermission(result);
      } else {
        const result = await hasAnyPermission(user.id, permissions);
        setHasPermission(result);
      }
    }

    checkPermission();
  }, [user, permission, requireAll]);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Role Guard component
interface RoleGuardProps {
  allowedRoles: Array<'admin' | 'manager' | 'cashier'>;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role_code)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
