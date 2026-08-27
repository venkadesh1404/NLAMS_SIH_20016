import { useState, useMemo } from 'react';
import { DATA, STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, Button } from '@/components/ui';
import { FileBarChart, Download, Printer, FileText } from 'lucide-react';

const REPORT_CATEGORIES = {
  National: ['National Acquisition Progress', 'State-wise Progress', 'Compensation Report', 'R&R Report', 'Delayed Projects'],
  State: ['District-wise Progress', 'Project-wise Acquisition', 'Compensation Status'],
  Project: ['Acquisition Summary', 'Land Parcel Report', 'Compensation Report', 'Possession Report', 'R&R Report'],
};

export default function ReportsPage() {
  const { projects, compensation, families } = DATA;
  const [category, setCategory] = useState('National');
  const [stateFilter, setStateFilter] = useState('');
  const [fy, setFy] = useState('2026-27');
  const [generated, setGenerated] = useState(false);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => !stateFilter || p.state === stateFilter);
  }, [projects, stateFilter]);

  const handleGenerate = () => {
    setGenerated(true);
    setTimeout(() => setGenerated(false), 3000);
  };

  return (
    <div>
      <PageHeader title="Reports & MIS" subtitle="Generate management information system reports across national, state, and project levels" actions={<Button variant="outline" size="sm" icon={Printer}>Print</Button>} />

      <FilterBar>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Report Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="text-sm border border-slate-300 rounded px-2 py-1.5 bg-white">
            {Object.keys(REPORT_CATEGORIES).map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="Financial Year" value={fy} onChange={setFy} options={[{ value: '2026-27', label: '2026-27' }, { value: '2025-26', label: '2025-26' }]} />
        <Button size="sm" icon={FileBarChart} onClick={handleGenerate}>Generate Report</Button>
      </FilterBar>

      {generated && (
        <div className="mb-4 p-3 bg-green-50 border border-green-300 rounded-lg text-sm text-green-800">
          Report generated successfully. Ready for export or print.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Available reports */}
        <Card title="Available Reports">
          <div className="space-y-2">
            {REPORT_CATEGORIES[category as keyof typeof REPORT_CATEGORIES].map((report) => (
              <button key={report} className="w-full text-left p-3 border border-slate-200 rounded hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1e3a5f]" />
                  <span className="text-sm text-slate-700">{report}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Report preview */}
        <Card title="Report Preview" className="lg:col-span-2">
          <div className="border border-slate-200 rounded p-6 bg-white">
            {/* Government-style header */}
            <div className="text-center border-b-2 border-[#1e3a5f] pb-3 mb-4">
              <p className="text-xs text-slate-500">Government of India</p>
              <h2 className="text-base font-bold text-[#1e3a5f]">National Land Acquisition & Management System</h2>
              <p className="text-xs text-slate-500">Public Works Department (PWD)</p>
              <p className="text-xs text-slate-500 mt-1">{category} Report — {fy}</p>
            </div>

            <div className="mb-4 text-xs text-slate-500">
              <p><strong>Filters:</strong> State: {stateFilter || 'All'} · Financial Year: {fy}</p>
              <p><strong>Generated:</strong> 27-Aug-2026 09:42 IST · Data Freshness: Real-time</p>
            </div>

            <table className="w-full text-xs border border-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-2 py-2 border-b border-slate-200 font-semibold text-slate-600">Project ID</th>
                  <th className="text-left px-2 py-2 border-b border-slate-200 font-semibold text-slate-600">Name</th>
                  <th className="text-right px-2 py-2 border-b border-slate-200 font-semibold text-slate-600">Land Req</th>
                  <th className="text-right px-2 py-2 border-b border-slate-200 font-semibold text-slate-600">Acquired</th>
                  <th className="text-right px-2 py-2 border-b border-slate-200 font-semibold text-slate-600">Acq %</th>
                  <th className="text-right px-2 py-2 border-b border-slate-200 font-semibold text-slate-600">Comp %</th>
                  <th className="text-right px-2 py-2 border-b border-slate-200 font-semibold text-slate-600">Poss %</th>
                  <th className="text-right px-2 py-2 border-b border-slate-200 font-semibold text-slate-600">R&R %</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.slice(0, 15).map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="px-2 py-1.5 font-mono">{p.id}</td>
                    <td className="px-2 py-1.5 max-w-[140px] truncate">{p.name}</td>
                    <td className="px-2 py-1.5 text-right">{p.landRequired}</td>
                    <td className="px-2 py-1.5 text-right">{p.landAcquired}</td>
                    <td className="px-2 py-1.5 text-right">{p.acquisitionPct}%</td>
                    <td className="px-2 py-1.5 text-right">{p.compensationPct}%</td>
                    <td className="px-2 py-1.5 text-right">{p.possessionPct}%</td>
                    <td className="px-2 py-1.5 text-right">{p.rrPct}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-semibold">
                <tr>
                  <td colSpan={2} className="px-2 py-2">TOTAL ({filteredProjects.length} projects)</td>
                  <td className="px-2 py-2 text-right">{filteredProjects.reduce((s, p) => s + p.landRequired, 0)}</td>
                  <td className="px-2 py-2 text-right">{filteredProjects.reduce((s, p) => s + p.landAcquired, 0)}</td>
                  <td colSpan={4} className="px-2 py-2"></td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-4 text-xs text-slate-500">
              <p><strong>Summary:</strong> {filteredProjects.length} projects · {filteredProjects.reduce((s, p) => s + p.affectedFamilies, 0)} affected families · {filteredProjects.reduce((s, p) => s + p.compensationDisbursed, 0)} ₹Cr disbursed</p>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 text-center text-xs text-slate-400">
              <p>NLAMS v1.0.0 (Prototype) · This is a demonstration report · Not for official use</p>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" icon={Download}>Export CSV</Button>
            <Button variant="outline" size="sm" icon={Printer}>Print Report</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
