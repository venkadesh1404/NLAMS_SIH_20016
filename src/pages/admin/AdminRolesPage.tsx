import { PageHeader, Card, StatusBadge } from '@/components/ui';
import { ROLE_LABELS } from '@/utils/statusStyles';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';

const PERMISSIONS = [
  'dashboard', 'projects', 'proposals', 'parcels', 'gis', 'compensation', 'possession',
  'families', 'rehabilitation', 'notifications', 'awards', 'alerts', 'reports',
  'analytics', 'workflow', 'documents', 'audit', 'admin', 'sync',
];

const ROLE_PERMS: Record<string, string[]> = {
  central_ministry: PERMISSIONS,
  state_gov: ['dashboard', 'projects', 'proposals', 'parcels', 'gis', 'compensation', 'possession', 'families', 'rehabilitation', 'notifications', 'awards', 'alerts', 'reports', 'workflow', 'documents'],
  district_authority: ['dashboard', 'projects', 'proposals', 'parcels', 'gis', 'compensation', 'possession', 'families', 'rehabilitation', 'notifications', 'awards', 'alerts', 'reports', 'workflow', 'documents'],
  pwd_agency: ['dashboard', 'projects', 'proposals', 'parcels', 'gis', 'documents', 'workflow'],
  land_acquisition_officer: ['dashboard', 'projects', 'parcels', 'gis', 'notifications', 'awards', 'compensation', 'possession', 'workflow', 'documents'],
  rr_officer: ['dashboard', 'projects', 'families', 'rehabilitation', 'workflow', 'documents'],
  system_admin: ['dashboard', 'admin', 'audit', 'sync'],
};

export default function AdminRolesPage() {
  return (
    <div>
      <PageHeader title="Roles & Permissions" subtitle="Role-Based Access Control (RBAC) configuration" />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-slate-600 sticky left-0 bg-slate-50">Permission</th>
                {Object.keys(ROLE_PERMS).map((role) => (
                  <th key={role} className="text-center px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{ROLE_LABELS[role]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PERMISSIONS.map((perm) => (
                <tr key={perm} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-700 font-medium capitalize sticky left-0 bg-white">{perm}</td>
                  {Object.keys(ROLE_PERMS).map((role) => {
                    const has = ROLE_PERMS[role].includes(perm);
                    return (
                      <td key={role} className="px-3 py-2 text-center">
                        {has ? <CheckCircle2 className="w-4 h-4 text-green-600 inline" /> : <XCircle className="w-4 h-4 text-slate-300 inline" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Shield className="w-3 h-3" /> RBAC enforced via JWT claims and server-side permission validation. Audit logs are non-editable.</p>
    </div>
  );
}
