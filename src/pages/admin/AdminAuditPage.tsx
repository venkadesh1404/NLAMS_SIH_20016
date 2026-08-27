import { useState, useMemo } from 'react';
import { DATA } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, SearchInput, StatusBadge, Button } from '@/components/ui';
import { ScrollText, Download } from 'lucide-react';

export default function AdminAuditPage() {
  const { audit } = DATA;
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [originFilter, setOriginFilter] = useState('');

  const filtered = useMemo(() => {
    return audit.filter((a) => {
      if (search && !a.user.toLowerCase().includes(search.toLowerCase()) && !a.recordId.toLowerCase().includes(search.toLowerCase())) return false;
      if (moduleFilter && a.module !== moduleFilter) return false;
      if (actionFilter && a.action !== actionFilter) return false;
      if (originFilter && a.origin !== originFilter) return false;
      return true;
    });
  }, [audit, search, moduleFilter, actionFilter, originFilter]);

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Immutable record of all system actions — online and offline" actions={<Button variant="outline" size="sm" icon={Download}>Export</Button>} />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search user or record ID..." />
        <Select label="Module" value={moduleFilter} onChange={setModuleFilter} options={['Projects', 'Compensation', 'Land Verification', 'Notifications', 'Awards', 'Possession', 'R&R', 'Workflow', 'Documents'].map((m) => ({ value: m, label: m }))} />
        <Select label="Action" value={actionFilter} onChange={setActionFilter} options={['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'FORWARD', 'LOGIN', 'LOGOUT'].map((a) => ({ value: a, label: a }))} />
        <Select label="Origin" value={originFilter} onChange={setOriginFilter} options={[{ value: 'ONLINE', label: 'ONLINE' }, { value: 'OFFLINE', label: 'OFFLINE' }]} />
      </FilterBar>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Timestamp', 'User', 'Role', 'Module', 'Action', 'Record ID', 'Description', 'Origin', 'Sync Timestamp'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.slice(0, 50).map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{a.timestamp}</td>
                  <td className="px-3 py-2 text-slate-700">{a.user}</td>
                  <td className="px-3 py-2 text-slate-600">{a.role}</td>
                  <td className="px-3 py-2 text-slate-600">{a.module}</td>
                  <td className="px-3 py-2"><StatusBadge status={a.action} /></td>
                  <td className="px-3 py-2 font-mono text-slate-600">{a.recordId}</td>
                  <td className="px-3 py-2 text-slate-600 max-w-[200px] truncate">{a.description}</td>
                  <td className="px-3 py-2"><StatusBadge status={a.origin} /></td>
                  <td className="px-3 py-2 text-slate-600">{a.syncTimestamp || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><ScrollText className="w-3 h-3" /> Audit logs are immutable and cannot be edited from the UI.</p>
    </div>
  );
}
