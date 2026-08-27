import { useState, useMemo } from 'react';
import { DATA, STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, SearchInput, StatusBadge, Button, EmptyState } from '@/components/ui';
import { Key, Download, FileText } from 'lucide-react';

export default function PossessionPage() {
  const { parcels, projects } = DATA;
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return parcels.filter((p) => {
      if (search && !p.id.toLowerCase().includes(search.toLowerCase()) && !p.village.toLowerCase().includes(search.toLowerCase())) return false;
      if (stateFilter && p.state !== stateFilter) return false;
      if (statusFilter && p.possessionStatus !== statusFilter) return false;
      return true;
    });
  }, [parcels, search, stateFilter, statusFilter]);

  return (
    <div>
      <PageHeader
        title="Possession Management"
        subtitle="Track land possession status and handover progress"
        actions={<Button variant="outline" size="sm" icon={Download}>Export CSV</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {(['Pending', 'Scheduled', 'Taken', 'Handover Completed'] as const).map((s) => {
          const count = parcels.filter((p) => p.possessionStatus === s).length;
          return (
            <div key={s} className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-500 font-medium uppercase">{s}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{count}</p>
            </div>
          );
        })}
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search parcel ID or village..." />
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="Possession Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'Pending', label: 'Pending' }, { value: 'Scheduled', label: 'Scheduled' },
          { value: 'Taken', label: 'Taken' }, { value: 'Handover Completed', label: 'Handover Completed' },
        ]} />
      </FilterBar>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No possession records" message="No parcels match the current filters." icon={Key} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Parcel ID', 'Project', 'Village', 'District', 'Area (ha)', 'Compensation', 'Possession Officer', 'Possession Status'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const proj = projects.find((pr) => pr.id === p.projectId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-slate-600">{p.id}</td>
                      <td className="px-3 py-2 text-slate-700 max-w-[140px] truncate">{proj?.name || p.projectId}</td>
                      <td className="px-3 py-2 text-slate-600">{p.village}</td>
                      <td className="px-3 py-2 text-slate-600">{p.district}</td>
                      <td className="px-3 py-2 text-slate-600 text-right">{p.area}</td>
                      <td className="px-3 py-2"><StatusBadge status={p.compensationStatus} /></td>
                      <td className="px-3 py-2 text-slate-600">LAO-{p.district.slice(0, 3).toUpperCase()}</td>
                      <td className="px-3 py-2"><StatusBadge status={p.possessionStatus} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
