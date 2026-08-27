import { useState, useMemo, useEffect } from 'react';
import { ApiService } from '@/services/apiService';
import { STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, Button } from '@/components/ui';
import { FileBarChart, Download, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { exportToCsv } from '@/utils/exportUtils';
import type { Project, CompensationRecord, AffectedFamily } from '@/types';

const REPORT_CATEGORIES = {
  National: ['National Acquisition Progress', 'State-wise Progress', 'Compensation Report', 'R&R Report', 'Delayed Projects'],
  State: ['District-wise Progress', 'Project-wise Acquisition', 'Compensation Status'],
  Project: ['Acquisition Summary', 'Land Parcel Report', 'Compensation Report', 'Possession Report', 'R&R Report'],
};

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [compensation, setCompensation] = useState<CompensationRecord[]>([]);
  const [families, setFamilies] = useState<AffectedFamily[]>([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState<keyof typeof REPORT_CATEGORIES>('National');
  const [selectedReport, setSelectedReport] = useState('National Acquisition Progress');
  const [stateFilter, setStateFilter] = useState('');
  const [fy, setFy] = useState('2026-27');
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [projs, comps, fams] = await Promise.all([
          ApiService.getProjects(),
          ApiService.getCompensation(),
          ApiService.getFamilies(),
        ]);
        setProjects(projs);
        setCompensation(comps);
        setFamilies(fams);
      } catch (e) {
        console.error('Failed to load report data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (stateFilter && p.state !== stateFilter) return false;
      if (selectedReport === 'Delayed Projects' && p.status !== 'Delayed') return false;
      return true;
    });
  }, [projects, stateFilter, selectedReport]);

  const handleGenerate = () => {
    setGenerated(true);
    setTimeout(() => setGenerated(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    exportToCsv(
      filteredProjects,
      `NLAMS_MIS_Report_${selectedReport.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Project ID' },
        { key: 'name', label: 'Project Name' },
        { key: 'agency', label: 'Agency' },
        { key: 'state', label: 'State' },
        { key: 'district', label: 'District' },
        { key: 'landRequired', label: 'Land Required (ha)' },
        { key: 'landAcquired', label: 'Land Acquired (ha)' },
        { key: 'acquisitionPct', label: 'Acquisition %' },
        { key: 'compensationPct', label: 'Compensation %' },
        { key: 'possessionPct', label: 'Possession %' },
        { key: 'rrPct', label: 'R&R %' },
        { key: 'estimatedCost', label: 'Estimated Cost (₹ Cr)' },
        { key: 'status', label: 'Status' },
      ]
    );
  };

  const totalLandReq = filteredProjects.reduce((s, p) => s + p.landRequired, 0);
  const totalLandAcq = filteredProjects.reduce((s, p) => s + p.landAcquired, 0);
  const totalCost = filteredProjects.reduce((s, p) => s + p.estimatedCost, 0);
  const totalAffected = filteredProjects.reduce((s, p) => s + p.affectedFamilies, 0);
  const totalDisbursed = filteredProjects.reduce((s, p) => s + p.compensationDisbursed, 0);

  return (
    <div className="space-y-4">
      <div className="no-print">
        <PageHeader
          title="Reports & MIS Analytics"
          subtitle="Generate and print standardized Management Information System (MIS) progress reports across national, state, and project levels"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" icon={Download} onClick={handleExportCsv}>Export CSV</Button>
              <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>Print Report</Button>
            </div>
          }
        />
      </div>

      <div className="no-print">
        <FilterBar>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Report Category</label>
            <select
              value={category}
              onChange={(e) => {
                const cat = e.target.value as keyof typeof REPORT_CATEGORIES;
                setCategory(cat);
                setSelectedReport(REPORT_CATEGORIES[cat][0]);
              }}
              className="text-xs border border-slate-300 rounded px-2 py-1.5 bg-white font-medium"
            >
              {Object.keys(REPORT_CATEGORIES).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
          <Select label="Financial Year" value={fy} onChange={setFy} options={[{ value: '2026-27', label: '2026-27' }, { value: '2025-26', label: '2025-26' }]} />
          <Button size="sm" icon={FileBarChart} onClick={handleGenerate}>Generate Report</Button>
        </FilterBar>
      </div>

      {generated && (
        <div className="p-3 bg-green-50 border border-green-300 rounded-lg text-xs text-green-800 flex items-center gap-2 no-print">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          Report dataset dynamically updated and ready for export or official printing.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Available reports */}
        <div className="no-print">
          <Card title="Available MIS Reports">
            <div className="space-y-1.5">
              {REPORT_CATEGORIES[category].map((report) => (
                <button
                  key={report}
                  onClick={() => setSelectedReport(report)}
                  className={`w-full text-left p-2.5 border rounded text-xs transition-colors flex items-center justify-between ${
                    selectedReport === report
                      ? 'border-blue-500 bg-blue-50 text-blue-900 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-[#1e3a5f]" />
                    <span>{report}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Report preview */}
        <Card title="Official MIS Document Preview" className="lg:col-span-2">
          <div className="border border-slate-200 rounded p-6 bg-white shadow-sm">
            {/* Government Header */}
            <div className="text-center border-b-2 border-[#1e3a5f] pb-3 mb-4">
              <p className="text-[11px] uppercase tracking-wider text-slate-600 font-medium">Government of India · Ministry of Road Transport & Highways</p>
              <h2 className="text-base font-bold text-[#1e3a5f] mt-0.5">National Land Acquisition & Management System (NLAMS)</h2>
              <p className="text-xs text-slate-700 font-semibold mt-1">
                {selectedReport.toUpperCase()} — FY {fy}
              </p>
            </div>

            <div className="mb-4 text-xs text-slate-600 flex flex-wrap justify-between border-b border-slate-100 pb-2">
              <div>
                <strong>Jurisdiction Filter:</strong> {stateFilter || 'All India'} · <strong>Financial Year:</strong> {fy}
              </div>
              <div>
                <strong>Generated Date:</strong> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · <strong>Data Freshness:</strong> Real-time
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500">Compiling MIS dataset...</div>
            ) : filteredProjects.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No project records match the active criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-2.5 py-2 border-b border-slate-200 font-semibold text-slate-700">Project ID</th>
                      <th className="text-left px-2.5 py-2 border-b border-slate-200 font-semibold text-slate-700">Project Name</th>
                      <th className="text-left px-2.5 py-2 border-b border-slate-200 font-semibold text-slate-700">State / Dist</th>
                      <th className="text-right px-2.5 py-2 border-b border-slate-200 font-semibold text-slate-700">Req (ha)</th>
                      <th className="text-right px-2.5 py-2 border-b border-slate-200 font-semibold text-slate-700">Acq (ha)</th>
                      <th className="text-right px-2.5 py-2 border-b border-slate-200 font-semibold text-slate-700">Acq %</th>
                      <th className="text-right px-2.5 py-2 border-b border-slate-200 font-semibold text-slate-700">Comp %</th>
                      <th className="text-right px-2.5 py-2 border-b border-slate-200 font-semibold text-slate-700">R&R %</th>
                      <th className="text-left px-2.5 py-2 border-b border-slate-200 font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.slice(0, 15).map((p) => (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-2.5 py-1.5 font-mono text-slate-700">{p.id}</td>
                        <td className="px-2.5 py-1.5 max-w-[140px] truncate text-slate-800 font-medium" title={p.name}>{p.name}</td>
                        <td className="px-2.5 py-1.5 text-slate-600">{p.state}, {p.district}</td>
                        <td className="px-2.5 py-1.5 text-right text-slate-700">{p.landRequired}</td>
                        <td className="px-2.5 py-1.5 text-right text-slate-700">{p.landAcquired}</td>
                        <td className="px-2.5 py-1.5 text-right font-medium text-slate-800">{p.acquisitionPct}%</td>
                        <td className="px-2.5 py-1.5 text-right text-slate-600">{p.compensationPct}%</td>
                        <td className="px-2.5 py-1.5 text-right text-slate-600">{p.rrPct}%</td>
                        <td className="px-2.5 py-1.5 text-slate-700">{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
                    <tr>
                      <td colSpan={3} className="px-2.5 py-2">TOTAL ({filteredProjects.length} Projects)</td>
                      <td className="px-2.5 py-2 text-right">{totalLandReq.toFixed(1)}</td>
                      <td className="px-2.5 py-2 text-right">{totalLandAcq.toFixed(1)}</td>
                      <td className="px-2.5 py-2 text-right">{totalLandReq ? Math.round((totalLandAcq / totalLandReq) * 100) : 0}%</td>
                      <td colSpan={3} className="px-2.5 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700">
              <p>
                <strong>Executive Summary:</strong> {filteredProjects.length} monitored projects requiring a cumulative {totalLandReq.toFixed(1)} ha of land. Overall acquisition progress stands at {totalLandReq ? Math.round((totalLandAcq / totalLandReq) * 100) : 0}%. A total of ₹{totalDisbursed.toLocaleString()} Cr disbursed to {totalAffected.toLocaleString()} affected families.
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
              <p>NLAMS v1.0.0 (Prototype) · National Land Acquisition & Management System · Demonstration Report</p>
            </div>
          </div>

          <div className="mt-3 flex gap-2 no-print">
            <Button variant="outline" size="sm" icon={Download} onClick={handleExportCsv}>Export CSV</Button>
            <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>Print Official Report</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
