import { useState, useMemo } from 'react';
import { DATA, STATES, DISTRICTS } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, StatusBadge, Button, EmptyState } from '@/components/ui';
import { FileText, Download, Plus, Upload, Eye, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface ProposalForm {
  projectName: string;
  department: string;
  agency: string;
  projectType: string;
  state: string;
  district: string;
  purpose: string;
  totalLandRequired: number;
  estimatedCost: number;
  expectedCompletion: string;
}

export default function ProposalsPage() {
  const { projects } = DATA;
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ProposalForm>();

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (stateFilter && p.state !== stateFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      return true;
    });
  }, [projects, search, stateFilter, statusFilter]);

  const selectedState = watch('state');
  const districtOptions = selectedState ? DISTRICTS[selectedState] || [] : [];

  const onSubmit = (data: ProposalForm) => {
    setSubmitted(true);
    setTimeout(() => { setShowForm(false); setSubmitted(false); }, 3000);
  };

  return (
    <div>
      <PageHeader
        title="Acquisition Proposals"
        subtitle="Submit and track land acquisition proposals through the approval workflow"
        actions={<Button size="sm" icon={Plus} onClick={() => setShowForm(true)}>New Proposal</Button>}
      />

      {/* Workflow indicator */}
      <Card className="mb-4">
        <div className="flex items-center justify-between text-xs">
          {['Draft', 'Submitted', 'Under Scrutiny', 'Approved', 'Returned', 'Rejected'].map((s, i, arr) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</div>
                <span className="mt-1 text-slate-600">{s}</span>
              </div>
              {i < arr.length - 1 && <div className="flex-1 h-0.5 bg-slate-200 mx-1 mt-[-20px]" />}
            </div>
          ))}
        </div>
      </Card>

      {submitted && (
        <div className="mb-4 p-3 bg-green-50 border border-green-300 rounded-lg text-sm text-green-800">
          Proposal submitted successfully. Status: SUBMITTED. The proposal will now be reviewed by the District Authority.
        </div>
      )}

      <FilterBar>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search proposals..." className="text-sm border border-slate-300 rounded px-3 py-1.5 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'Submitted', label: 'Submitted' }, { value: 'Under Scrutiny', label: 'Under Scrutiny' },
          { value: 'Approved', label: 'Approved' }, { value: 'Delayed', label: 'Delayed' },
        ]} />
      </FilterBar>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No proposals found" message="No proposals match the current filters." icon={FileText} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Project ID', 'Project Name', 'Agency', 'State', 'District', 'Type', 'Land Required (ha)', 'Est. Cost (₹ Cr)', 'Status', 'Actions'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-slate-600">{p.id}</td>
                    <td className="px-3 py-2 text-slate-700 max-w-[160px] truncate">{p.name}</td>
                    <td className="px-3 py-2 text-slate-600">{p.agency}</td>
                    <td className="px-3 py-2 text-slate-600">{p.state}</td>
                    <td className="px-3 py-2 text-slate-600">{p.district}</td>
                    <td className="px-3 py-2 text-slate-600">{p.type}</td>
                    <td className="px-3 py-2 text-slate-600 text-right">{p.landRequired}</td>
                    <td className="px-3 py-2 text-slate-600 text-right">{p.estimatedCost.toLocaleString()}</td>
                    <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                    <td className="px-3 py-2"><a href={`#/projects/${p.id}`} className="text-blue-600 hover:underline inline-flex items-center gap-0.5">View <ChevronRight className="w-3 h-3" /></a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* New Proposal Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">New Acquisition Proposal</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Project Name *</label>
                  <input {...register('projectName', { required: true })} className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" />
                  {errors.projectName && <span className="text-xs text-red-600">Required</span>}
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Department *</label>
                  <input {...register('department', { required: true })} className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Implementing Agency *</label>
                  <input {...register('agency', { required: true })} className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Project Type *</label>
                  <select {...register('projectType', { required: true })} className="w-full text-sm border border-slate-300 rounded px-3 py-1.5 bg-white">
                    <option value="">Select...</option>
                    {['Highways', 'Railways', 'Irrigation', 'Industrial Corridor', 'Urban Development', 'Renewable Energy', 'Public Infrastructure', 'Other'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">State *</label>
                  <select {...register('state', { required: true })} className="w-full text-sm border border-slate-300 rounded px-3 py-1.5 bg-white">
                    <option value="">Select...</option>
                    {STATES.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">District *</label>
                  <select {...register('district', { required: true })} className="w-full text-sm border border-slate-300 rounded px-3 py-1.5 bg-white" disabled={!selectedState}>
                    <option value="">Select...</option>
                    {districtOptions.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Total Land Required (ha) *</label>
                  <input type="number" {...register('totalLandRequired', { required: true, min: 1 })} className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Estimated Cost (₹ Cr) *</label>
                  <input type="number" {...register('estimatedCost', { required: true, min: 1 })} className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Expected Completion *</label>
                  <input type="date" {...register('expectedCompletion', { required: true })} className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600 block mb-1">Purpose *</label>
                  <textarea {...register('purpose', { required: true })} rows={3} className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Required Documents</label>
                <div className="space-y-1 text-xs text-slate-600">
                  {['DPR (Detailed Project Report)', 'Project Proposal', 'Land Requirement Statement', 'Supporting Documents'].map((d) => (
                    <label key={d} className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" /> {d}
                    </label>
                  ))}
                </div>
                <button type="button" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><Upload className="w-3 h-3" /> Upload Document</button>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="text-sm px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="text-sm px-4 py-1.5 bg-[#1e3a5f] text-white rounded hover:bg-[#2a4a6f]">Submit Proposal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
