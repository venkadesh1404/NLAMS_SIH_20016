import type { UserRole } from '@/types';

export interface NavItem {
  label: string;
  path: string;
  module: string;
  icon: string;
  children?: NavItem[];
}

export const NAV_STRUCTURE: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', module: 'dashboard', icon: 'LayoutDashboard' },
  {
    label: 'Land Acquisition',
    path: '/acquisition',
    module: 'projects',
    icon: 'Landmark',
    children: [
      { label: 'Acquisition Proposals', path: '/proposals', module: 'proposals', icon: 'FileText' },
      { label: 'Projects', path: '/projects', module: 'projects', icon: 'Building2' },
      { label: 'Land Parcels', path: '/land-parcels', module: 'parcels', icon: 'Map' },
      { label: 'Notifications', path: '/notifications', module: 'notifications', icon: 'Bell' },
      { label: 'Awards', path: '/awards', module: 'awards', icon: 'Gavel' },
      { label: 'Compensation', path: '/compensation', module: 'compensation', icon: 'IndianRupee' },
      { label: 'Possession', path: '/possession', module: 'possession', icon: 'Key' },
    ],
  },
  {
    label: 'Rehabilitation & Resettlement',
    path: '/rehabilitation',
    module: 'rehabilitation',
    icon: 'Users',
    children: [
      { label: 'Affected Families', path: '/families', module: 'families', icon: 'Users' },
      { label: 'R&R Progress', path: '/rehabilitation', module: 'rehabilitation', icon: 'HeartHandshake' },
    ],
  },
  { label: 'GIS / Maps', path: '/gis', module: 'gis', icon: 'Map' },
  {
    label: 'Workflow',
    path: '/workflow',
    module: 'workflow',
    icon: 'GitBranch',
    children: [
      { label: 'Pending Actions', path: '/workflow', module: 'workflow', icon: 'ListChecks' },
      { label: 'Escalations', path: '/alerts', module: 'alerts', icon: 'AlertTriangle' },
      { label: 'Sync Queue', path: '/sync-queue', module: 'sync', icon: 'RefreshCw' },
    ],
  },
  {
    label: 'Reports & MIS',
    path: '/reports',
    module: 'reports',
    icon: 'FileBarChart',
  },
  { label: 'Documents', path: '/documents', module: 'documents', icon: 'FolderOpen' },
  { label: 'Alerts & Notifications', path: '/alerts', module: 'alerts', icon: 'Bell' },
  { label: 'Analytics', path: '/analytics', module: 'analytics', icon: 'TrendingUp' },
  {
    label: 'Administration',
    path: '/admin',
    module: 'admin',
    icon: 'Settings',
    children: [
      { label: 'Users', path: '/admin/users', module: 'admin-users', icon: 'UserCog' },
      { label: 'Roles & Permissions', path: '/admin/roles', module: 'admin-roles', icon: 'Shield' },
      { label: 'Audit Logs', path: '/admin/audit', module: 'audit', icon: 'ScrollText' },
      { label: 'System Settings', path: '/admin/settings', module: 'admin-settings', icon: 'Settings' },
      { label: 'PWA Settings', path: '/admin/pwa', module: 'admin-pwa', icon: 'Smartphone' },
      { label: 'System Health', path: '/admin/health', module: 'admin-health', icon: 'Activity' },
    ],
  },
];

export function getVisibleNav(permissions: string[]): NavItem[] {
  return NAV_STRUCTURE.filter((item) => {
    if (item.children) {
      const visibleChildren = item.children.filter((c) => permissions.includes(c.module));
      return visibleChildren.length > 0;
    }
    return permissions.includes(item.module);
  }).map((item) => {
    if (item.children) {
      return {
        ...item,
        children: item.children.filter((c) => permissions.includes(c.module)),
      };
    }
    return item;
  });
}
