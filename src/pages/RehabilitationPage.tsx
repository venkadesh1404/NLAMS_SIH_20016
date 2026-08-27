import { useState, useMemo } from 'react';
import { DATA, STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, StatusBadge, KpiCard, ProgressBar } from '@/components/ui';
import { HeartHandshake, Home, Briefcase, Landmark, Banknote, Building } from 'lucide-react';

const BENEFIT_TYPES = [
  { key: 'housing', label: 'Housing Assistance', icon: Home },
  { key: 'land', label: 'Land Allotment', icon: Landmark },
  { key: 'employment', label: 'Employment Assistance', icon: Briefcase },
  { key: 'financial', label: 'Financial Assistance', icon: Banknote },
  { key: 'infrastructure', label: 'Infrastructure Support', icon: Building },
];

export default function RehabilitationPage() {
  const { families, projects } = DATA;
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return families.filter((f) => {
      if (stateFilter) {
        const proj = projects.find((p) => p.id === f.projectId);
        if (!proj || proj.state !== stateFilter) return false;
      }
      if (statusFilter && f.rrStatus !== statusFilter) return false;
      return true;
    });
  }, [families, stateFilter, statusFilter, projects]);

  const eligible = filtered.filter((f) => f.rrEligibility).length;
  const completed = filtered.filter((f) => f.rrStatus === 'Completed').length;
  const pending = filtered.filter((f) => ['Not Started', 'Eligible'].includes(f.rrStatus)).length;
  const displaced = filtered.filter((f) => f.displacementStatus !== 'Not Displaced').length;

  return (
    <div>
      <PageHeader title="Rehabilitation & Resettlement" subtitle="Track R&R eligibility, benefits, and progress for displaced families" />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <KpiCard label="Total Affected" value={filtered.length} icon={HeartHandshake} color="#2b6cb0" />
        <KpiCard label="R&R Eligible" value={eligible} icon={HeartHandshake} color="#2c7a7b" />
        <KpiCard label="R&R Completed" value={completed} icon={HeartHandshake} color="#22543d" />
        <KpiCard label="R&R Pending" value={pending} icon={HeartHandshake} color="#dd6b20" />
        <KpiCard label="Displaced" value={displaced} icon={HeartHandshake} color="#dc2626" />
      </div>

      <FilterBar>
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="R&R Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'Not Started', label: 'Not Started' }, { value: 'Eligible', label: 'Eligible' },
          { value: 'In Progress', label: 'In Progress' }, { value: 'Completed', label: 'Completed' }, { value: 'Disputed', label: 'Disputed' },
        ]} />
      </FilterBar>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card title="R&R Benefit Distribution">
          <div className="space-y-3">
            {BENEFIT_TYPES.map((b) => {
              const count = filtered.filter((f) => f.rrBenefit.includes(b.label.replace(' Assistance', '').replace(' Support', ''))).length;
              const Icon = b.icon;
              return (
                <div key={b.key} className="flex items-center gap-3 p-3 bg-slate-50 rounded">
                  <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                    <Icon className="w-4 h-4 text-[#1e3a5f]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-700">{b.label}</p>
                    <ProgressBar value={(count / Math.max(filtered.length, 1)) * 100} color="bg-teal-600" height="h-1.5" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Resettlement Progress">
          <div className="space-y-3">
            {(['Not Started', 'Eligible', 'In Progress', 'Completed', 'Disputed'] as const).map((s) => {
              const count = filtered.filter((f) => f.rrStatus === s).length;
              const pct = Math.round((count / Math.max(filtered.length, 1)) * 100);
              return (
                <div key={s}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-600">{s}</span>
                    <span className="text-slate-700 font-medium">{count} ({pct}%)</span>
                  </div>
                  <ProgressBar value={pct} color={s === 'Completed' ? 'bg-green-600' : s === 'Disputed' ? 'bg-red-600' : s === 'In Progress' ? 'bg-blue-600' : 'bg-amber-500'} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="R&R Case Tracking">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Family ID', 'Project', 'Village', 'Displacement', 'R&R Eligible', 'R&R Benefit', 'R&R Status'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.slice(0, 20).map((f) => {
                const proj = projects.find((p) => p.id === f.projectId);
                return (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-slate-600">{f.id}</td>
                    <td className="px-3 py-2 text-slate-700 max-w-[140px] truncate">{proj?.name || f.projectId}</td>
                    <td className="px-3 py-2 text-slate-600">{f.village}</td>
                    <td className="px-3 py-2"><StatusBadge status={f.displacementStatus} /></td>
                    <td className="px-3 py-2 text-slate-600">{f.rrEligibility ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2 text-slate-600">{f.rrBenefit}</td>
                    <td className="px-3 py-2"><StatusBadge status={f.rrStatus} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
