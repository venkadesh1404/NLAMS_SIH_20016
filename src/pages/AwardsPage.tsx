import { useState, useMemo, useEffect } from 'react';
import { ApiService } from '@/services/apiService';
import { STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, SearchInput, StatusBadge, Button, EmptyState } from '@/components/ui';
import { Gavel, Download } from 'lucide-react';
import { exportToCsv } from '@/utils/exportUtils';
import type { Award, Project } from '@/types';

export default function AwardsPage() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [awd, projs] = await Promise.all([
          ApiService.getAwards(),
          ApiService.getProjects(),
        ]);
        setAwards(awd);
        setProjects(projs);
      } catch (e) {
        console.error('Failed to load awards', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

  const handleExportCsv = () => {
    exportToCsv(
      filtered,
      `NLAMS_Statutory_Awards_${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Award ID' },
        { key: 'projectId', label: 'Project ID' },
        { key: 'district', label: 'District' },
        { key: 'village', label: 'Village' },
        { key: 'surveyNumber', label: 'Survey No.' },
        { key: 'awardDate', label: 'Award Date' },
        { key: 'landArea', label: 'Land Area (ha)' },
        { key: 'awardAmount', label: 'Award Amount (₹ Cr)' },
        { key: 'beneficiaryCount', label: 'Beneficiary Count' },
        { key: 'status', label: 'Status' },
      ]
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Land Acquisition Awards"
        subtitle="Statutory awards declared by competent Land Acquisition Officers under Section 23/31 of RFCTLARR Act"
        actions={<Button variant="outline" size="sm" icon={Download} onClick={handleExportCsv}>Export CSV</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><p className="text-xs text-slate-500 font-medium">Total Award Amount</p><p className="text-xl font-bold text-slate-800 mt-1">₹{totalAmount.toLocaleString()} Cr</p></Card>
        <Card><p className="text-xs text-slate-500 font-medium">Total Beneficiaries</p><p className="text-xl font-bold text-slate-800 mt-1">{totalBeneficiaries}</p></Card>
        <Card><p className="text-xs text-slate-500 font-medium">Total Land Area</p><p className="text-xl font-bold text-slate-800 mt-1">{totalArea.toFixed(1)} ha</p></Card>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search award ID, survey number, or village..." />
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'Draft', label: 'Draft' }, { value: 'Under Review', label: 'Under Review' },
          { value: 'Approved', label: 'Approved' }, { value: 'Declared', label: 'Declared' },
        ]} />
      </FilterBar>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading award records...</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No awards found" message="No awards match the current filters." icon={Gavel} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Award ID', 'Project', 'District', 'Village', 'Survey No.', 'Award Date', 'Land Area (ha)', 'Award Amount (₹ Cr)', 'Beneficiaries', 'Status'].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((a) => {
                  const proj = projects.find((p) => p.id === a.projectId);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-mono font-medium text-slate-700 whitespace-nowrap">{a.id}</td>
                      <td className="px-3 py-2 text-slate-800 font-medium max-w-[140px] truncate" title={proj?.name || a.projectId}>
                        {proj?.name || a.projectId}
                      </td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{a.district}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{a.village}</td>
                      <td className="px-3 py-2 font-mono text-slate-600 whitespace-nowrap">{a.surveyNumber}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{a.awardDate}</td>
                      <td className="px-3 py-2 text-slate-700 text-right whitespace-nowrap font-medium">{a.landArea}</td>
                      <td className="px-3 py-2 text-slate-700 text-right whitespace-nowrap font-medium">₹{a.awardAmount} Cr</td>
                      <td className="px-3 py-2 text-slate-700 text-right whitespace-nowrap">{a.beneficiaryCount}</td>
                      <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={a.status} /></td>
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
