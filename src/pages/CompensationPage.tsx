import { useState, useMemo, useEffect } from 'react';
import { ApiService } from '@/services/apiService';
import { STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, SearchInput, StatusBadge, Button, KpiCard, EmptyState } from '@/components/ui';
import { IndianRupee, Download, FileText, TrendingUp } from 'lucide-react';
import { exportToCsv } from '@/utils/exportUtils';
import type { CompensationRecord, Project } from '@/types';

export default function CompensationPage() {
  const [compensation, setCompensation] = useState<CompensationRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [comp, projs] = await Promise.all([
          ApiService.getCompensation(),
          ApiService.getProjects(),
        ]);
        setCompensation(comp);
        setProjects(projs);
      } catch (e) {
        console.error('Failed to load compensation records', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return compensation.filter((c) => {
      if (search && !c.id.toLowerCase().includes(search.toLowerCase()) && !c.beneficiaryId.toLowerCase().includes(search.toLowerCase()) && !c.projectName.toLowerCase().includes(search.toLowerCase())) return false;
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

  const handleExportCsv = () => {
    exportToCsv(
      filtered,
      `NLAMS_Compensation_Disbursements_${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Case ID' },
        { key: 'projectId', label: 'Project ID' },
        { key: 'projectName', label: 'Project Name' },
        { key: 'district', label: 'District' },
        { key: 'beneficiaryId', label: 'Beneficiary ID' },
        { key: 'landArea', label: 'Land Area (ha)' },
        { key: 'assessedAmount', label: 'Assessed Amount (₹)' },
        { key: 'approvedAmount', label: 'Approved Amount (₹)' },
        { key: 'paidAmount', label: 'Paid Amount (₹)' },
        { key: 'paymentDate', label: 'Payment Date' },
        { key: 'status', label: 'Status' },
      ]
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Compensation Management"
        subtitle="Track assessed, approved, and disbursed financial compensation across all land parcels and beneficiaries"
        actions={<Button variant="outline" size="sm" icon={Download} onClick={handleExportCsv}>Export CSV</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Compensation Assessed" value={`₹${totalAssessed.toLocaleString()}`} unit="Cr" icon={IndianRupee} color="#2b6cb0" />
        <KpiCard label="Compensation Approved" value={`₹${totalApproved.toLocaleString()}`} unit="Cr" icon={IndianRupee} color="#2c7a7b" />
        <KpiCard label="Compensation Paid" value={`₹${totalPaid.toLocaleString()}`} unit="Cr" icon={IndianRupee} color="#22543d" />
        <KpiCard label="Pending Compensation" value={`₹${totalPending.toLocaleString()}`} unit="Cr" icon={IndianRupee} color="#dd6b20" />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search case ID, beneficiary, or project..." />
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'Assessment Pending', label: 'Assessment Pending' },
          { value: 'Assessed', label: 'Assessed' },
          { value: 'Approved', label: 'Approved' },
          { value: 'Payment Pending', label: 'Payment Pending' },
          { value: 'Partially Paid', label: 'Partially Paid' },
          { value: 'Fully Paid', label: 'Fully Paid' },
        ]} />
      </FilterBar>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading compensation database...</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No compensation records" message="No records match the current filters." icon={FileText} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Case ID', 'Project Name', 'District', 'Beneficiary ID', 'Land Area (ha)', 'Assessed (₹)', 'Approved (₹)', 'Paid (₹)', 'Payment Date', 'Status'].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 font-mono font-medium text-slate-700 whitespace-nowrap">{c.id}</td>
                    <td className="px-3 py-2 text-slate-800 font-medium max-w-[160px] truncate" title={c.projectName}>{c.projectName}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{c.district}</td>
                    <td className="px-3 py-2 font-mono text-slate-600 whitespace-nowrap">{c.beneficiaryId}</td>
                    <td className="px-3 py-2 text-slate-700 text-right whitespace-nowrap">{c.landArea}</td>
                    <td className="px-3 py-2 text-slate-700 text-right whitespace-nowrap">₹{c.assessedAmount.toLocaleString()}</td>
                    <td className="px-3 py-2 text-slate-700 text-right whitespace-nowrap">₹{c.approvedAmount.toLocaleString()}</td>
                    <td className="px-3 py-2 text-slate-700 text-right whitespace-nowrap font-medium">₹{c.paidAmount.toLocaleString()}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{c.paymentDate || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="text-xs text-slate-400 flex items-center gap-1">
        <TrendingUp className="w-3.5 h-3.5" />
        Simulated PFMS treasury disbursement tracking for demonstration.
      </p>
    </div>
  );
}
