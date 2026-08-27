import { useState, useMemo } from 'react';
import { DATA, STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, SearchInput, StatusBadge, Button, KpiCard, EmptyState } from '@/components/ui';
import { Users, Download, FileText } from 'lucide-react';

export default function FamiliesPage() {
  const { families, projects } = DATA;
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return families.filter((f) => {
      if (search && !f.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (stateFilter) {
        const proj = projects.find((p) => p.id === f.projectId);
        if (!proj || proj.state !== stateFilter) return false;
      }
      if (statusFilter && f.rrStatus !== statusFilter) return false;
      return true;
    });
  }, [families, search, stateFilter, statusFilter, projects]);

  return (
    <div>
      <PageHeader
        title="Affected Families"
        subtitle="Track families affected by land acquisition and their R&R eligibility"
        actions={<Button variant="outline" size="sm" icon={Download}>Export CSV</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Total Families" value={families.length} icon={Users} color="#2b6cb0" />
        <KpiCard label="R&R Eligible" value={families.filter((f) => f.rrEligibility).length} icon={Users} color="#2c7a7b" />
        <KpiCard label="Displaced" value={families.filter((f) => f.displacementStatus !== 'Not Displaced').length} icon={Users} color="#dd6b20" />
        <KpiCard label="R&R Completed" value={families.filter((f) => f.rrStatus === 'Completed').length} icon={Users} color="#22543d" />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search family ID..." />
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="R&R Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'Not Started', label: 'Not Started' }, { value: 'Eligible', label: 'Eligible' },
          { value: 'In Progress', label: 'In Progress' }, { value: 'Completed', label: 'Completed' }, { value: 'Disputed', label: 'Disputed' },
        ]} />
      </FilterBar>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No families found" message="No affected families match the current filters." icon={Users} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Family ID', 'Project', 'District', 'Village', 'Category', 'Land Affected (ha)', 'Displacement', 'Compensation', 'R&R Eligible', 'R&R Benefit', 'R&R Status'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((f) => {
                  const proj = projects.find((p) => p.id === f.projectId);
                  return (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-slate-600">{f.id}</td>
                      <td className="px-3 py-2 text-slate-700 max-w-[120px] truncate">{proj?.name || f.projectId}</td>
                      <td className="px-3 py-2 text-slate-600">{f.district}</td>
                      <td className="px-3 py-2 text-slate-600">{f.village}</td>
                      <td className="px-3 py-2 text-slate-600">{f.category}</td>
                      <td className="px-3 py-2 text-slate-600 text-right">{f.landAffected}</td>
                      <td className="px-3 py-2"><StatusBadge status={f.displacementStatus} /></td>
                      <td className="px-3 py-2"><StatusBadge status={f.compensationStatus} /></td>
                      <td className="px-3 py-2 text-slate-600">{f.rrEligibility ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2 text-slate-600">{f.rrBenefit}</td>
                      <td className="px-3 py-2"><StatusBadge status={f.rrStatus} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-2">Anonymized sample data. No real personal information is used.</p>
    </div>
  );
}
