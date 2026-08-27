import { useState, useMemo } from 'react';
import { DATA, STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, SearchInput, StatusBadge, Button, EmptyState } from '@/components/ui';
import { Bell, Download, FileText } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, projects } = DATA;
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (search && !n.id.toLowerCase().includes(search.toLowerCase()) && !n.projectName.toLowerCase().includes(search.toLowerCase())) return false;
      if (stateFilter) {
        const proj = projects.find((p) => p.id === n.projectId);
        if (!proj || proj.state !== stateFilter) return false;
      }
      if (typeFilter && n.type !== typeFilter) return false;
      return true;
    });
  }, [notifications, search, stateFilter, typeFilter, projects]);

  return (
    <div>
      <PageHeader title="Notification Management" subtitle="Statutory notifications for land acquisition proceedings" actions={<Button variant="outline" size="sm" icon={Download}>Export</Button>} />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search notification ID or project..." />
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="Type" value={typeFilter} onChange={setTypeFilter} options={[
          { value: 'Preliminary Notification', label: 'Preliminary Notification' }, { value: 'Declaration', label: 'Declaration' },
          { value: 'Award Notification', label: 'Award Notification' }, { value: 'Possession Notice', label: 'Possession Notice' },
          { value: 'Other Statutory Notice', label: 'Other Statutory Notice' },
        ]} />
      </FilterBar>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No notifications" message="No notifications match the current filters." icon={Bell} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200"><tr>{['ID', 'Project', 'Type', 'Number', 'Issue Date', 'Publication Date', 'Status', 'Remarks'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-slate-600">{n.id}</td>
                    <td className="px-3 py-2 text-slate-700 max-w-[160px] truncate">{n.projectName}</td>
                    <td className="px-3 py-2 text-slate-600">{n.type}</td>
                    <td className="px-3 py-2 text-slate-600">{n.number}</td>
                    <td className="px-3 py-2 text-slate-600">{n.issueDate}</td>
                    <td className="px-3 py-2 text-slate-600">{n.publicationDate}</td>
                    <td className="px-3 py-2"><StatusBadge status={n.status} /></td>
                    <td className="px-3 py-2 text-slate-600 max-w-[200px] truncate">{n.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
