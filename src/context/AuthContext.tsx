import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  AppUser, 
  PermissionKey, 
  ScreenId, 
  StandardAction, 
  SensitiveDataKey 
} from '../types';
import {
  getStoredUsers,
  getActiveSessionUser,
  setActiveSessionUser,
  createStoredUser,
  updateStoredUser,
  deleteStoredUser,
  resetUsersToDefaults,
  hasUserPermission,
  canUserAccessScreen,
  canUserPerformAction,
  canUserViewSensitiveData
} from '../lib/usersStorage';

interface AuthContextType {
  currentUser: AppUser;
  users: AppUser[];
  isAuthenticated: boolean;
  switchUser: (userId: string) => void;
  login: (username: string, password?: string) => { success: boolean; message?: string };
  logout: () => void;
  hasPermission: (permission: PermissionKey) => boolean;
  canAccess: (permission: PermissionKey) => boolean;
  hasScreenAccess: (screenId: ScreenId) => boolean;
  hasAction: (screenId: ScreenId, action: StandardAction) => boolean;
  canViewSensitive: (key: SensitiveDataKey) => boolean;
  refreshUsers: () => void;
  addUser: (data: Omit<AppUser, 'id' | 'createdAt'>) => AppUser;
  editUser: (userId: string, data: Partial<AppUser>) => AppUser;
  removeUser: (userId: string) => void;
  resetDefaults: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser>(() => getActiveSessionUser());
  const [users, setUsers] = useState<AppUser[]>(() => getStoredUsers());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('gfos_auth_active') === 'true';
  });

  const refreshUsers = useCallback(() => {
    const list = getStoredUsers();
    setUsers(list);
    const active = getActiveSessionUser();
    setCurrentUser(active);
  }, []);

  useEffect(() => {
    const handleAuthChanged = () => {
      const active = getActiveSessionUser();
      setCurrentUser(active);
      setIsAuthenticated(localStorage.getItem('gfos_auth_active') === 'true');
    };

    const handleUsersUpdated = () => {
      setUsers(getStoredUsers());
      const active = getActiveSessionUser();
      setCurrentUser(active);
    };

    const handlePermissionUpdated = () => {
      // Live Instant Permission Update without logout
      const active = getActiveSessionUser();
      setCurrentUser(active);
      setUsers(getStoredUsers());
    };

    window.addEventListener('auth_changed', handleAuthChanged);
    window.addEventListener('users_updated', handleUsersUpdated);
    window.addEventListener('permission_updated', handlePermissionUpdated);
    window.addEventListener('storage', handleUsersUpdated);

    return () => {
      window.removeEventListener('auth_changed', handleAuthChanged);
      window.removeEventListener('users_updated', handleUsersUpdated);
      window.removeEventListener('permission_updated', handlePermissionUpdated);
      window.removeEventListener('storage', handleUsersUpdated);
    };
  }, []);

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    if (!target.isActive || target.status === 'suspended') {
      alert('هذا الحساب معطل أو موقوف حالياً');
      return;
    }
    // Update lastLogin
    updateStoredUser(target.id, { lastLogin: new Date().toISOString() });
    setActiveSessionUser(target);
    setCurrentUser(target);
    setIsAuthenticated(true);
    localStorage.setItem('gfos_auth_active', 'true');
  };

  const login = (username: string, password?: string): { success: boolean; message?: string } => {
    const target = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!target) {
      return { success: false, message: 'اسم المستخدم غير موجود بالنظام' };
    }
    if (!target.isActive || target.status === 'suspended') {
      return { success: false, message: 'هذا الحساب معطل أو موقوف، يرجى مراجعة إدارة النظام' };
    }
    const cleanPassword = (password || '').trim();
    const storedPassword = (target.password || '').trim();
    if (storedPassword && storedPassword !== cleanPassword) {
      return { success: false, message: 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى' };
    }

    updateStoredUser(target.id, { lastLogin: new Date().toISOString() });
    setActiveSessionUser(target);
    setCurrentUser(target);
    setIsAuthenticated(true);
    localStorage.setItem('gfos_auth_active', 'true');
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('gfos_auth_active');
    localStorage.removeItem('gfos_current_session');
    window.dispatchEvent(new CustomEvent('auth_changed'));
  };

  const hasPermission = useCallback((permission: PermissionKey): boolean => {
    return hasUserPermission(currentUser, permission);
  }, [currentUser]);

  const canAccess = useCallback((permission: PermissionKey): boolean => {
    return hasPermission(permission);
  }, [hasPermission]);

  const hasScreenAccess = useCallback((screenId: ScreenId): boolean => {
    return canUserAccessScreen(currentUser, screenId);
  }, [currentUser]);

  const hasAction = useCallback((screenId: ScreenId, action: StandardAction): boolean => {
    return canUserPerformAction(currentUser, screenId, action);
  }, [currentUser]);

  const canViewSensitive = useCallback((key: SensitiveDataKey): boolean => {
    return canUserViewSensitiveData(currentUser, key);
  }, [currentUser]);

  const addUser = (data: Omit<AppUser, 'id' | 'createdAt'>): AppUser => {
    const created = createStoredUser(data);
    refreshUsers();
    return created;
  };

  const editUser = (userId: string, data: Partial<AppUser>): AppUser => {
    const updated = updateStoredUser(userId, data);
    refreshUsers();
    return updated;
  };

  const removeUser = (userId: string): void => {
    deleteStoredUser(userId);
    refreshUsers();
  };

  const resetDefaults = (): void => {
    resetUsersToDefaults();
    refreshUsers();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated,
        switchUser,
        login,
        logout,
        hasPermission,
        canAccess,
        hasScreenAccess,
        hasAction,
        canViewSensitive,
        refreshUsers,
        addUser,
        editUser,
        removeUser,
        resetDefaults,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
