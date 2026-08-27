import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '@/types';
import { DEMO_USERS } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (module: string) => boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  central_ministry: ['dashboard', 'projects', 'proposals', 'parcels', 'gis', 'compensation', 'possession', 'families', 'rehabilitation', 'notifications', 'awards', 'alerts', 'reports', 'analytics', 'workflow', 'documents', 'audit', 'admin'],
  state_gov: ['dashboard', 'projects', 'proposals', 'parcels', 'gis', 'compensation', 'possession', 'families', 'rehabilitation', 'notifications', 'awards', 'alerts', 'reports', 'workflow', 'documents'],
  district_authority: ['dashboard', 'projects', 'proposals', 'parcels', 'gis', 'compensation', 'possession', 'families', 'rehabilitation', 'notifications', 'awards', 'alerts', 'reports', 'workflow', 'documents'],
  pwd_agency: ['dashboard', 'projects', 'proposals', 'parcels', 'gis', 'documents', 'workflow'],
  land_acquisition_officer: ['dashboard', 'projects', 'parcels', 'gis', 'notifications', 'awards', 'compensation', 'possession', 'workflow', 'documents'],
  rr_officer: ['dashboard', 'projects', 'families', 'rehabilitation', 'workflow', 'documents'],
  system_admin: ['dashboard', 'admin', 'audit', 'sync', 'admin-users', 'admin-roles', 'admin-settings', 'admin-pwa', 'admin-health'],
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('nlams_user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('nlams_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('nlams_user');
    }
  }, [user]);

  const login = (email: string, password: string): boolean => {
    const found = DEMO_USERS.find((u) => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...userWithoutPassword } = found;
      setUser(userWithoutPassword);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  const hasPermission = (module: string): boolean => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(module) ?? false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
