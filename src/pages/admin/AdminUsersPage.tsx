import { DATA, DEMO_USERS } from '@/data/mockData';
import { PageHeader, Card, StatusBadge, Button } from '@/components/ui';
import { ROLE_LABELS } from '@/utils/statusStyles';
import { UserCog, Plus, Download } from 'lucide-react';

export default function AdminUsersPage() {
  return (
    <div>
      <PageHeader title="User Management" subtitle="Manage officer accounts and access" actions={<><Button size="sm" icon={Plus}>Add User</Button><Button variant="outline" size="sm" icon={Download}>Export</Button></>} />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200"><tr>{['User ID', 'Name', 'Email', 'Role', 'Department', 'Designation', 'State', 'Status', 'Actions'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {DEMO_USERS.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-slate-600">{u.id}</td>
                  <td className="px-3 py-2 text-slate-700">{u.name}</td>
                  <td className="px-3 py-2 text-slate-600">{u.email}</td>
                  <td className="px-3 py-2 text-slate-600">{ROLE_LABELS[u.role]}</td>
                  <td className="px-3 py-2 text-slate-600">{u.department}</td>
                  <td className="px-3 py-2 text-slate-600">{u.designation}</td>
                  <td className="px-3 py-2 text-slate-600">{u.state || '—'}</td>
                  <td className="px-3 py-2"><StatusBadge status="Active" /></td>
                  <td className="px-3 py-2"><button className="text-blue-600 hover:underline">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
