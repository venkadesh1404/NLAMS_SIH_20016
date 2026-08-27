import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DATA, STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, SearchInput, StatusBadge, ProgressBar, Button, EmptyState } from '@/components/ui';
import { Building2, Eye, FileText, Map, Download, RefreshCw, ChevronLeft, ChevronRight, Save } from 'lucide-react';

const PROJECT_TYPES = ['Highways', 'Railways', 'Irrigation', 'Industrial Corridor', 'Urban Development', 'Renewable Energy', 'Public Infrastructure', 'Other'];

export default function ProjectsPage() {
  const { projects } = DATA;
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [sortKey, setSortKey] = useState<'id' | 'name' | 'acquisitionPct' | 'riskScore'>('id');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let result = projects.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (stateFilter && p.state !== stateFilter) return false;
      if (typeFilter && p.type !== typeFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (riskFilter && p.risk !== riskFilter) return false;
      return true;
    });
    result = [...result].sort((a, b) => {
      if (sortKey === 'id') return a.id.localeCompare(b.id);
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'acquisitionPct') return b.acquisitionPct - a.acquisitionPct;
      if (sortKey === 'riskScore') return b.riskScore - a.riskScore;
      return 0;
    });
    return result;
  }, [projects, search, stateFilter, typeFilter, statusFilter, riskFilter, sortKey]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <PageHeader
        title="Project Management"
        subtitle={`${filtered.length} projects across all states and implementing agencies`}
        actions={
          <>
            <Button variant="outline" size="sm" icon={RefreshCw}>Refresh</Button>
            <Button variant="outline" size="sm" icon={Download}>Export CSV</Button>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search project ID or name..." />
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="Type" value={typeFilter} onChange={setTypeFilter} options={PROJECT_TYPES.map((t) => ({ value: t, label: t }))} />
        <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'Submitted', label: 'Submitted' }, { value: 'Under Scrutiny', label: 'Under Scrutiny' },
          { value: 'Approved', label: 'Approved' }, { value: 'Delayed', label: 'Delayed' }, { value: 'Completed', label: 'Completed' },
        ]} />
        <Select label="Risk" value={riskFilter} onChange={setRiskFilter} options={[
          { value: 'LOW', label: 'LOW' }, { value: 'MEDIUM', label: 'MEDIUM' }, { value: 'HIGH', label: 'HIGH' }, { value: 'CRITICAL', label: 'CRITICAL' },
        ]} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Sort By</label>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)} className="text-sm border border-slate-300 rounded px-2 py-1.5 bg-white">
            <option value="id">Project ID</option>
            <option value="name">Name</option>
            <option value="acquisitionPct">Acquisition %</option>
            <option value="riskScore">Risk Score</option>
          </select>
        </div>
      </FilterBar>

      {paged.length === 0 ? (
        <Card><EmptyState title="No projects found" message="No projects match the current filters. Try adjusting your search criteria." icon={Building2} /></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Project ID', 'Name', 'Agency', 'State', 'District', 'Type', 'Land Req (ha)', 'Land Acq (ha)', 'Acq %', 'Comp %', 'Poss %', 'R&R %', 'Status', 'Target Date', 'Risk', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-2 py-2.5 font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paged.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-2 py-2 font-mono text-slate-600 whitespace-nowrap">{p.id}</td>
                    <td className="px-2 py-2 text-slate-700 max-w-[180px] truncate"><Link to={`/projects/${p.id}`} className="text-blue-600 hover:underline">{p.name}</Link></td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{p.agency}</td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{p.state}</td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{p.district}</td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{p.type}</td>
                    <td className="px-2 py-2 text-slate-600 text-right whitespace-nowrap">{p.landRequired}</td>
                    <td className="px-2 py-2 text-slate-600 text-right whitespace-nowrap">{p.landAcquired}</td>
                    <td className="px-2 py-2"><div className="w-14"><ProgressBar value={p.acquisitionPct} color="bg-blue-600" height="h-1.5" /></div></td>
                    <td className="px-2 py-2"><div className="w-14"><ProgressBar value={p.compensationPct} color="bg-amber-500" height="h-1.5" /></div></td>
                    <td className="px-2 py-2"><div className="w-14"><ProgressBar value={p.possessionPct} color="bg-teal-600" height="h-1.5" /></div></td>
                    <td className="px-2 py-2"><div className="w-14"><ProgressBar value={p.rrPct} color="bg-green-600" height="h-1.5" /></div></td>
                    <td className="px-2 py-2"><StatusBadge status={p.status} /></td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{p.targetDate}</td>
                    <td className="px-2 py-2"><StatusBadge status={p.risk} /></td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1">
                        <Link to={`/projects/${p.id}`} className="p-1 rounded hover:bg-blue-50 text-blue-600" title="View"><Eye className="w-3.5 h-3.5" /></Link>
                        <Link to={`/gis?project=${p.id}`} className="p-1 rounded hover:bg-green-50 text-green-600" title="GIS"><Map className="w-3.5 h-3.5" /></Link>
                        <button className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Save Offline"><Save className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs text-slate-600 px-2">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
