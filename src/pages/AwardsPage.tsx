import { useState, useMemo } from 'react';
import { DATA, STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, SearchInput, StatusBadge, Button, EmptyState } from '@/components/ui';
import { Gavel, Download } from 'lucide-react';

export default function AwardsPage() {
  const { awards, projects } = DATA;
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return awards.filter((a) => {
      if (search && !a.id.toLowerCase().includes(search.toLowerCase()) && !a.village.toLowerCase().includes(search.toLowerCase())) return false;
      if (stateFilter) {
        const proj = projects.find((p) => p.id === a.projectId);
        if (!proj || proj.state !== stateFilter) return false;
      }
      if (statusFilter && a.status !== statusFilter) return false;
      return true;
    });
  }, [awards, search, stateFilter, statusFilter, projects]);

  const totalAmount = filtered.reduce((s, a) => s + a.awardAmount, 0);
  const totalBeneficiaries = filtered.reduce((s, a) => s + a.beneficiaryCount, 0);
  const totalArea = filtered.reduce((s, a) => s + a.landArea, 0);

  return (
    <div>
      <PageHeader title="Award Management" subtitle="Land acquisition awards declared under the RFCTLARR Act" actions={<Button variant="outline" size="sm" icon={Download}>Export</Button>} />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card><p className="text-xs text-slate-500">Total Award Amount</p><p className="text-xl font-bold text-slate-800">₹{totalAmount.toLocaleString()} Cr</p></Card>
        <Card><p className="text-xs text-slate-500">Total Beneficiaries</p><p className="text-xl font-bold text-slate-800">{totalBeneficiaries}</p></Card>
        <Card><p className="text-xs text-slate-500">Total Land Area</p><p className="text-xl font-bold text-slate-800">{totalArea.toFixed(1)} ha</p></Card>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search award ID or village..." />
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'Draft', label: 'Draft' }, { value: 'Under Review', label: 'Under Review' },
          { value: 'Approved', label: 'Approved' }, { value: 'Declared', label: 'Declared' },
        ]} />
      </FilterBar>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No awards found" message="No awards match the current filters." icon={Gavel} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Award ID', 'Project', 'District', 'Village', 'Survey No.', 'Award Date', 'Land Area (ha)', 'Award Amount (₹ Cr)', 'Beneficiaries', 'Status'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((a) => {
                  const proj = projects.find((p) => p.id === a.projectId);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-slate-600">{a.id}</td>
                      <td className="px-3 py-2 text-slate-700 max-w-[140px] truncate">{proj?.name || a.projectId}</td>
                      <td className="px-3 py-2 text-slate-600">{a.district}</td>
                      <td className="px-3 py-2 text-slate-600">{a.village}</td>
                      <td className="px-3 py-2 text-slate-600">{a.surveyNumber}</td>
                      <td className="px-3 py-2 text-slate-600">{a.awardDate}</td>
                      <td className="px-3 py-2 text-slate-600 text-right">{a.landArea}</td>
                      <td className="px-3 py-2 text-slate-600 text-right">{a.awardAmount}</td>
                      <td className="px-3 py-2 text-slate-600 text-right">{a.beneficiaryCount}</td>
                      <td className="px-3 py-2"><StatusBadge status={a.status} /></td>
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
