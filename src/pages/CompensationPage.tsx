import { useState, useMemo } from 'react';
import { DATA, STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, SearchInput, StatusBadge, Button, KpiCard, EmptyState } from '@/components/ui';
import { IndianRupee, Download, FileText, TrendingUp } from 'lucide-react';

export default function CompensationPage() {
  const { compensation, projects } = DATA;
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return compensation.filter((c) => {
      if (search && !c.id.toLowerCase().includes(search.toLowerCase()) && !c.beneficiaryId.toLowerCase().includes(search.toLowerCase())) return false;
      if (stateFilter) {
        const proj = projects.find((p) => p.id === c.projectId);
        if (!proj || proj.state !== stateFilter) return false;
      }
      if (statusFilter && c.status !== statusFilter) return false;
      return true;
    });
  }, [compensation, search, stateFilter, statusFilter, projects]);

  const totalAssessed = compensation.reduce((s, c) => s + c.assessedAmount, 0);
  const totalApproved = compensation.reduce((s, c) => s + c.approvedAmount, 0);
  const totalPaid = compensation.reduce((s, c) => s + c.paidAmount, 0);
  const totalPending = totalAssessed - totalPaid;

  return (
    <div>
      <PageHeader
        title="Compensation Management"
        subtitle="Track assessed, approved, and disbursed compensation across all projects"
        actions={<Button variant="outline" size="sm" icon={Download}>Export CSV</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Compensation Assessed" value={`₹${totalAssessed.toLocaleString()}`} unit="Cr" icon={IndianRupee} color="#2b6cb0" />
        <KpiCard label="Compensation Approved" value={`₹${totalApproved.toLocaleString()}`} unit="Cr" icon={IndianRupee} color="#2c7a7b" />
        <KpiCard label="Compensation Paid" value={`₹${totalPaid.toLocaleString()}`} unit="Cr" icon={IndianRupee} color="#22543d" />
        <KpiCard label="Pending Compensation" value={`₹${totalPending.toLocaleString()}`} unit="Cr" icon={IndianRupee} color="#dd6b20" />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search case ID or beneficiary..." />
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'Assessment Pending', label: 'Assessment Pending' }, { value: 'Assessed', label: 'Assessed' },
          { value: 'Approved', label: 'Approved' }, { value: 'Payment Pending', label: 'Payment Pending' },
          { value: 'Partially Paid', label: 'Partially Paid' }, { value: 'Fully Paid', label: 'Fully Paid' },
        ]} />
      </FilterBar>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No compensation records" message="No records match the current filters." icon={FileText} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Case ID', 'Project', 'District', 'Beneficiary ID', 'Land Area (ha)', 'Assessed (₹)', 'Approved (₹)', 'Paid (₹)', 'Payment Date', 'Status'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-slate-600">{c.id}</td>
                    <td className="px-3 py-2 text-slate-700 max-w-[160px] truncate">{c.projectName}</td>
                    <td className="px-3 py-2 text-slate-600">{c.district}</td>
                    <td className="px-3 py-2 font-mono text-slate-600">{c.beneficiaryId}</td>
                    <td className="px-3 py-2 text-slate-600 text-right">{c.landArea}</td>
                    <td className="px-3 py-2 text-slate-600 text-right">{c.assessedAmount.toLocaleString()}</td>
                    <td className="px-3 py-2 text-slate-600 text-right">{c.approvedAmount.toLocaleString()}</td>
                    <td className="px-3 py-2 text-slate-600 text-right">{c.paidAmount.toLocaleString()}</td>
                    <td className="px-3 py-2 text-slate-600">{c.paymentDate || '—'}</td>
                    <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Simulated payment data. Not connected to real banking or treasury systems.</p>
    </div>
  );
}
