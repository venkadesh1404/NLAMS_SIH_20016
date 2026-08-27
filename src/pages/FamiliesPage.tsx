import { useState, useMemo, useEffect } from 'react';
import { ApiService } from '@/services/apiService';
import { STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, SearchInput, StatusBadge, Button, KpiCard, EmptyState } from '@/components/ui';
import { Users, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportToCsv } from '@/utils/exportUtils';
import type { AffectedFamily, Project } from '@/types';

export default function FamiliesPage() {
  const [families, setFamilies] = useState<AffectedFamily[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [fams, projs] = await Promise.all([
          ApiService.getFamilies(),
          ApiService.getProjects(),
        ]);
        setFamilies(fams);
        setProjects(projs);
      } catch (e) {
        console.error('Failed to load affected families', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return families.filter((f) => {
      if (search && !f.id.toLowerCase().includes(search.toLowerCase()) && !f.village.toLowerCase().includes(search.toLowerCase())) return false;
      if (stateFilter) {
        const proj = projects.find((p) => p.id === f.projectId);
        if (!proj || proj.state !== stateFilter) return false;
      }
      if (statusFilter && f.rrStatus !== statusFilter) return false;
      return true;
    });
  }, [families, search, stateFilter, statusFilter, projects]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleExportCsv = () => {
    exportToCsv(
      filtered,
      `NLAMS_Affected_Families_Census_${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Family ID' },
        { key: 'projectId', label: 'Project ID' },
        { key: 'district', label: 'District' },
        { key: 'village', label: 'Village' },
        { key: 'category', label: 'Category' },
        { key: 'landAffected', label: 'Land Affected (ha)' },
        { key: 'displacementStatus', label: 'Displacement' },
        { key: 'compensationStatus', label: 'Compensation' },
        { key: 'rrEligibility', label: 'R&R Eligible', formatter: (val) => val ? 'Yes' : 'No' },
        { key: 'rrBenefit', label: 'R&R Benefit Package' },
        { key: 'rrStatus', label: 'R&R Status' },
      ]
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Project Affected Families (PAFs) Census"
        subtitle="Track families affected by land acquisition, displacement status, and R&R entitlement benefits"
        actions={<Button variant="outline" size="sm" icon={Download} onClick={handleExportCsv}>Export CSV</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Families" value={families.length} icon={Users} color="#2b6cb0" />
        <KpiCard label="R&R Eligible" value={families.filter((f) => f.rrEligibility).length} icon={Users} color="#2c7a7b" />
        <KpiCard label="Displaced Families" value={families.filter((f) => f.displacementStatus !== 'Not Displaced').length} icon={Users} color="#dd6b20" />
        <KpiCard label="R&R Completed" value={families.filter((f) => f.rrStatus === 'Completed').length} icon={Users} color="#22543d" />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search family ID or village..." />
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="R&R Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'Not Started', label: 'Not Started' },
          { value: 'Eligible', label: 'Eligible' },
          { value: 'In Progress', label: 'In Progress' },
          { value: 'Completed', label: 'Completed' },
          { value: 'Disputed', label: 'Disputed' },
        ]} />
      </FilterBar>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading affected families census...</div>
        ) : paged.length === 0 ? (
          <EmptyState title="No families found" message="No affected families match the current filters." icon={Users} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Family ID', 'Project', 'District', 'Village', 'Category', 'Land Affected (ha)', 'Displacement', 'Compensation', 'R&R Eligible', 'R&R Benefit', 'R&R Status'].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paged.map((f) => {
                  const proj = projects.find((p) => p.id === f.projectId);
                  return (
                    <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-mono font-medium text-slate-700 whitespace-nowrap">{f.id}</td>
                      <td className="px-3 py-2 text-slate-800 font-medium max-w-[120px] truncate" title={proj?.name || f.projectId}>
                        {proj?.name || f.projectId}
                      </td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{f.district}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{f.village}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{f.category}</td>
                      <td className="px-3 py-2 text-slate-700 text-right whitespace-nowrap">{f.landAffected}</td>
                      <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={f.displacementStatus} /></td>
                      <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={f.compensationStatus} /></td>
                      <td className="px-3 py-2 text-slate-700 whitespace-nowrap font-medium">{f.rrEligibility ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2 text-slate-600 max-w-[140px] truncate" title={f.rrBenefit}>{f.rrBenefit}</td>
                      <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={f.rrStatus} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Showing {filtered.length === 0 ? 0 : ((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} families
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs text-slate-600 px-2">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </Card>
    </div>
  );
}
