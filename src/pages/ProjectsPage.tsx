import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { ApiService } from '@/services/apiService';
import { STATES, DISTRICTS } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, SearchInput, StatusBadge, ProgressBar, Button, EmptyState } from '@/components/ui';
import { Building2, Eye, Map, Download, RefreshCw, ChevronLeft, ChevronRight, Save, Plus, CheckCircle2, X } from 'lucide-react';
import { exportToCsv } from '@/utils/exportUtils';
import { useForm } from 'react-hook-form';
import type { Project, ProjectType } from '@/types';

const PROJECT_TYPES: ProjectType[] = ['Highways', 'Railways', 'Irrigation', 'Industrial Corridor', 'Urban Development', 'Renewable Energy', 'Public Infrastructure', 'Other'];

interface ProjectFormData {
  name: string;
  agency: string;
  state: string;
  district: string;
  type: ProjectType;
  landRequired: number;
  estimatedCost: number;
  targetDate: string;
  description: string;
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [sortKey, setSortKey] = useState<'id' | 'name' | 'acquisitionPct' | 'riskScore'>('id');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // New project modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ProjectFormData>();

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiService.getProjects();
      setProjects(data);
    } catch (e) {
      console.error('Failed to load projects', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const selectedFormState = watch('state');
  const districtOptions = selectedFormState ? DISTRICTS[selectedFormState] || [] : [];

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

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleExportCsv = () => {
    exportToCsv(
      filtered,
      `NLAMS_Projects_${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Project ID' },
        { key: 'name', label: 'Project Name' },
        { key: 'agency', label: 'Agency' },
        { key: 'state', label: 'State' },
        { key: 'district', label: 'District' },
        { key: 'type', label: 'Type' },
        { key: 'landRequired', label: 'Land Required (ha)' },
        { key: 'landAcquired', label: 'Land Acquired (ha)' },
        { key: 'acquisitionPct', label: 'Acquisition %' },
        { key: 'compensationPct', label: 'Compensation %' },
        { key: 'possessionPct', label: 'Possession %' },
        { key: 'rrPct', label: 'R&R %' },
        { key: 'estimatedCost', label: 'Estimated Cost (₹ Cr)' },
        { key: 'status', label: 'Status' },
        { key: 'risk', label: 'Risk' },
        { key: 'riskScore', label: 'Risk Score' },
        { key: 'targetDate', label: 'Target Date' },
      ]
    );
  };

  const handleCreateProject = async (data: ProjectFormData) => {
    try {
      setSaving(true);
      const created = await ApiService.createProject({
        name: data.name,
        agency: data.agency || 'PWD',
        state: data.state,
        district: data.district,
        type: data.type,
        landRequired: Number(data.landRequired),
        estimatedCost: Number(data.estimatedCost),
        targetDate: data.targetDate,
        description: data.description,
      });
      setShowCreateModal(false);
      reset();
      showToast(`Project ${created.id} created and registered successfully!`);
      await loadProjects();
    } catch (e: any) {
      alert(`Error creating project: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const canCreate = user?.role === 'pwd_agency' || user?.role === 'central_ministry' || user?.role === 'system_admin';

  return (
    <div className="space-y-4">
      <PageHeader
        title="Project Management"
        subtitle={`${filtered.length} active infrastructure projects across all states and implementing agencies`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadProjects}>Refresh</Button>
            <Button variant="outline" size="sm" icon={Download} onClick={handleExportCsv}>Export CSV</Button>
            {canCreate && (
              <Button size="sm" icon={Plus} onClick={() => { reset(); setShowCreateModal(true); }}>
                Register Project
              </Button>
            )}
          </div>
        }
      />

      {toastMessage && (
        <div className="p-3 bg-green-50 border border-green-300 rounded-lg text-sm text-green-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-green-600 hover:text-green-800"><X className="w-4 h-4" /></button>
        </div>
      )}

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search project ID or name..." />
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="Type" value={typeFilter} onChange={setTypeFilter} options={PROJECT_TYPES.map((t) => ({ value: t, label: t }))} />
        <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'Submitted', label: 'Submitted' }, { value: 'Under Scrutiny', label: 'Under Scrutiny' },
          { value: 'Approved', label: 'Approved' }, { value: 'Notification Issued', label: 'Notification Issued' },
          { value: 'Compensation Pending', label: 'Compensation Pending' }, { value: 'Delayed', label: 'Delayed' }, { value: 'Completed', label: 'Completed' },
        ]} />
        <Select label="Risk" value={riskFilter} onChange={setRiskFilter} options={[
          { value: 'LOW', label: 'LOW' }, { value: 'MEDIUM', label: 'MEDIUM' }, { value: 'HIGH', label: 'HIGH' }, { value: 'CRITICAL', label: 'CRITICAL' },
        ]} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Sort By</label>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)} className="text-xs border border-slate-300 rounded px-2 py-1.5 bg-white">
            <option value="id">Project ID</option>
            <option value="name">Name</option>
            <option value="acquisitionPct">Acquisition %</option>
            <option value="riskScore">Risk Score</option>
          </select>
        </div>
      </FilterBar>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading project database...</div>
      ) : paged.length === 0 ? (
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
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-2 py-2 font-mono font-medium text-slate-700 whitespace-nowrap">{p.id}</td>
                    <td className="px-2 py-2 text-slate-800 font-medium max-w-[180px] truncate" title={p.name}>
                      <Link to={`/projects/${p.id}`} className="text-blue-600 hover:underline">{p.name}</Link>
                    </td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{p.agency}</td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{p.state}</td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{p.district}</td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{p.type}</td>
                    <td className="px-2 py-2 text-slate-700 text-right whitespace-nowrap">{p.landRequired}</td>
                    <td className="px-2 py-2 text-slate-700 text-right whitespace-nowrap">{p.landAcquired}</td>
                    <td className="px-2 py-2"><div className="w-14"><ProgressBar value={p.acquisitionPct} color="bg-blue-600" height="h-1.5" /></div></td>
                    <td className="px-2 py-2"><div className="w-14"><ProgressBar value={p.compensationPct} color="bg-amber-500" height="h-1.5" /></div></td>
                    <td className="px-2 py-2"><div className="w-14"><ProgressBar value={p.possessionPct} color="bg-teal-600" height="h-1.5" /></div></td>
                    <td className="px-2 py-2"><div className="w-14"><ProgressBar value={p.rrPct} color="bg-green-600" height="h-1.5" /></div></td>
                    <td className="px-2 py-2 whitespace-nowrap"><StatusBadge status={p.status} /></td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{p.targetDate}</td>
                    <td className="px-2 py-2 whitespace-nowrap"><StatusBadge status={p.risk} /></td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Link to={`/projects/${p.id}`} className="p-1 rounded hover:bg-blue-50 text-blue-600" title="View Full Details"><Eye className="w-3.5 h-3.5" /></Link>
                        <Link to={`/gis?project=${p.id}`} className="p-1 rounded hover:bg-green-50 text-green-600" title="View GIS Cadastral Map"><Map className="w-3.5 h-3.5" /></Link>
                        <button onClick={() => showToast(`Project ${p.id} cached offline in IndexedDB.`)} className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Save Offline Cache"><Save className="w-3.5 h-3.5" /></button>
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
              Showing {filtered.length === 0 ? 0 : ((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} projects
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs text-slate-600 px-2">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </Card>
      )}

      {/* New Project Registration Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
              <h2 className="text-sm font-bold text-slate-800">Register New Infrastructure Project</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit(handleCreateProject)} className="p-5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-600 block mb-1">Project Name *</label>
                  <input
                    {...register('name', { required: true })}
                    placeholder="e.g. Madurai Outer Ring Road Phase 3"
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2"
                  />
                  {errors.name && <span className="text-[10px] text-red-600">Required</span>}
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Implementing Agency *</label>
                  <input
                    {...register('agency', { required: true })}
                    defaultValue="PWD Tamil Nadu"
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Project Type *</label>
                  <select {...register('type', { required: true })} className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white">
                    {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">State *</label>
                  <select {...register('state', { required: true })} className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white">
                    <option value="">Select State...</option>
                    {STATES.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">District *</label>
                  <select {...register('district', { required: true })} className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white" disabled={!selectedFormState}>
                    <option value="">Select District...</option>
                    {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Total Land Required (ha) *</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('landRequired', { required: true, min: 0.1 })}
                    placeholder="e.g. 110.5"
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Estimated Cost (₹ Cr) *</label>
                  <input
                    type="number"
                    step="1"
                    {...register('estimatedCost', { required: true, min: 1 })}
                    placeholder="e.g. 3200"
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Target Completion Date *</label>
                  <input
                    type="date"
                    {...register('targetDate', { required: true })}
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-600 block mb-1">Project Description & Scope</label>
                  <textarea
                    {...register('description')}
                    rows={2}
                    placeholder="Brief description of the corridor alignment and utility..."
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs px-3 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="text-xs px-4 py-2 bg-[#1e3a5f] text-white rounded hover:bg-[#2a4a6f] font-medium shadow-sm"
                >
                  {saving ? 'Registering...' : 'Register Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
