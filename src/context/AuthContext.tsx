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
  // Requirement: Default user is Admin!
  const [currentUser, setCurrentUser] = useState<AppUser>(() => getActiveSessionUser());
  const [users, setUsers] = useState<AppUser[]>(() => getStoredUsers());

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
  };

  const login = (username: string, password?: string): { success: boolean; message?: string } => {
    const target = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!target) {
      return { success: false, message: 'اسم المستخدم غير موجود' };
    }
    if (!target.isActive || target.status === 'suspended') {
      return { success: false, message: 'هذا الحساب معطل أو موقوف، يرجى مراجعة إدارة النظام' };
    }
    if (password && target.password && target.password !== password.trim()) {
      return { success: false, message: 'كلمة المرور غير صحيحة' };
    }

    updateStoredUser(target.id, { lastLogin: new Date().toISOString() });
    setActiveSessionUser(target);
    setCurrentUser(target);
    return { success: true };
  };

  const logout = () => {
    // Switch to admin default
    const admin = users.find(u => u.role === 'admin' || u.username === 'admin') || users[0];
    setActiveSessionUser(admin);
    setCurrentUser(admin);
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

  const removeUser = (userId: string) => {
    deleteStoredUser(userId);
    refreshUsers();
  };

  const resetDefaults = () => {
    const list = resetUsersToDefaults();
    setUsers(list);
    setCurrentUser(list[0]);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
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
        resetDefaults
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
