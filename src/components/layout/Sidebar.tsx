import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { getVisibleNav, type NavItem } from '@/config/navigation';
import * as Icons from 'lucide-react';
import { ChevronDown, X } from 'lucide-react';

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, hasPermission } = useAuth();
  const location = useLocation();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!user) return null;

  const permissions = Object.keys(user).length > 0 ? getPermsForRole(user.role) : [];
  const nav = getVisibleNav(permissions);

  const toggleExpand = (label: string) => {
    setExpanded(expanded === label ? null : label);
  };

  const isActive = (item: NavItem) => {
    if (item.children) {
      return item.children.some((c) => location.pathname === c.path);
    }
    return location.pathname === item.path;
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[96px] left-0 h-screen lg:h-[calc(100vh-96px)] w-64 bg-[#1e3a5f] text-white z-30 overflow-y-auto transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10">
          <span className="text-sm font-semibold">Navigation</span>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <nav className="p-2">
          {nav.map((item) => {
            const Icon = (Icons as any)[item.icon] || Icons.Circle;
            const active = isActive(item);
            if (item.children) {
              const childActive = item.children.some((c) => location.pathname === c.path);
              return (
                <div key={item.label} className="mb-1">
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${
                      childActive ? 'bg-white/15 text-white' : 'text-blue-100 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded === item.label ? 'rotate-180' : ''}`} />
                  </button>
                  {expanded === item.label && (
                    <div className="mt-0.5 ml-3 pl-3 border-l border-white/10">
                      {item.children.map((child) => {
                        const ChildIcon = (Icons as any)[child.icon] || Icons.Circle;
                        return (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                              `flex items-center gap-2 px-3 py-1.5 text-xs rounded transition-colors ${
                                isActive ? 'bg-white/15 text-white font-medium' : 'text-blue-100 hover:bg-white/10'
                              }`
                            }
                          >
                            <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                            {child.label}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors mb-1 ${
                    isActive ? 'bg-white/15 text-white font-medium' : 'text-blue-100 hover:bg-white/10'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 mt-auto border-t border-white/10">
          <p className="text-[10px] text-blue-200/70 leading-relaxed">
            NLAMS v1.0.0 (Prototype)<br />
            SIH 2026 Demonstration<br />
            Not for official use.
          </p>
        </div>
      </aside>
    </>
  );
}

function getPermsForRole(role: string): string[] {
  const map: Record<string, string[]> = {
    central_ministry: ['dashboard', 'projects', 'proposals', 'parcels', 'gis', 'compensation', 'possession', 'families', 'rehabilitation', 'notifications', 'awards', 'alerts', 'reports', 'analytics', 'workflow', 'documents', 'audit', 'admin', 'sync', 'admin-users', 'admin-roles', 'admin-settings', 'admin-pwa', 'admin-health'],
    state_gov: ['dashboard', 'projects', 'proposals', 'parcels', 'gis', 'compensation', 'possession', 'families', 'rehabilitation', 'notifications', 'awards', 'alerts', 'reports', 'workflow', 'documents', 'analytics', 'audit', 'sync'],
    district_authority: ['dashboard', 'projects', 'proposals', 'parcels', 'gis', 'compensation', 'possession', 'families', 'rehabilitation', 'notifications', 'awards', 'alerts', 'reports', 'workflow', 'documents', 'analytics', 'audit', 'sync'],
    pwd_agency: ['dashboard', 'projects', 'proposals', 'parcels', 'gis', 'documents', 'workflow', 'notifications', 'reports', 'audit', 'sync'],
    land_acquisition_officer: ['dashboard', 'projects', 'proposals', 'parcels', 'gis', 'notifications', 'awards', 'compensation', 'possession', 'workflow', 'documents', 'reports', 'audit', 'sync'],
    rr_officer: ['dashboard', 'projects', 'proposals', 'families', 'rehabilitation', 'workflow', 'documents', 'notifications', 'reports', 'audit', 'sync'],
    system_admin: ['dashboard', 'projects', 'proposals', 'parcels', 'gis', 'compensation', 'possession', 'families', 'rehabilitation', 'notifications', 'awards', 'alerts', 'reports', 'analytics', 'workflow', 'documents', 'admin', 'audit', 'sync', 'admin-users', 'admin-roles', 'admin-settings', 'admin-pwa', 'admin-health'],
  };
  return map[role] || [];
}
