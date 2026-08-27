import { useState, useMemo } from 'react';
import { DATA, STATES } from '@/data/mockData';
import { PageHeader, KpiCard, Card, FilterBar, Select, StatusBadge, ProgressBar } from '@/components/ui';
import { Building2, MapPin, IndianRupee, Users, KeyRound, HeartHandshake, FileCheck, AlertTriangle, TrendingUp, Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
} from 'recharts';

const STAGE_FLOW = ['Proposal', 'Scrutiny', 'Approval', 'Notification', 'Award', 'Compensation', 'Possession', 'R&R', 'Completion'];

const PROJECT_TYPES = ['Highways', 'Railways', 'Irrigation', 'Industrial Corridor', 'Urban Development', 'Renewable Energy', 'Public Infrastructure', 'Other'];

const COLORS = ['#1e3a5f', '#2b6cb0', '#2c7a7b', '#744210', '#22543d', '#718096', '#975a16', '#553c9a'];

export default function DashboardPage() {
  const { projects, compensation, families, alerts } = DATA;
  const [fy, setFy] = useState('2026-27');
  const [stateFilter, setStateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (stateFilter && p.state !== stateFilter) return false;
      if (typeFilter && p.type !== typeFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      return true;
    });
  }, [projects, stateFilter, typeFilter, statusFilter]);

  const kpis = useMemo(() => {
    const totalProjects = filtered.length;
    const landProposed = filtered.reduce((s, p) => s + p.landRequired, 0);
    const landNotified = filtered.reduce((s, p) => s + p.landNotified, 0);
    const landAcquired = filtered.reduce((s, p) => s + p.landAcquired, 0);
    const compAssessed = filtered.reduce((s, p) => s + p.compensationAssessed, 0);
    const compDisbursed = filtered.reduce((s, p) => s + p.compensationDisbursed, 0);
    const affectedFamilies = filtered.reduce((s, p) => s + p.affectedFamilies, 0);
    const displacedFamilies = filtered.reduce((s, p) => s + p.displacedFamilies, 0);
    const possessionCompleted = filtered.filter((p) => p.possessionPct >= 90).length;
    const rrCompleted = filtered.filter((p) => p.rrPct >= 90).length;
    return { totalProjects, landProposed, landNotified, landAcquired, compAssessed, compDisbursed, affectedFamilies, displacedFamilies, possessionCompleted, rrCompleted };
  }, [filtered]);

  const stateData = useMemo(() => {
    const byState: Record<string, { state: string; Proposed: number; Notified: number; Acquired: number }> = {};
    for (const p of filtered) {
      if (!byState[p.state]) byState[p.state] = { state: p.state, Proposed: 0, Notified: 0, Acquired: 0 };
      byState[p.state].Proposed += p.landRequired;
      byState[p.state].Notified += p.landNotified;
      byState[p.state].Acquired += p.landAcquired;
    }
    return Object.values(byState).sort((a, b) => b.Proposed - a.Proposed);
  }, [filtered]);

  const typeData = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const p of filtered) {
      byType[p.type] = (byType[p.type] || 0) + 1;
    }
    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const stageData = useMemo(() => {
    return STAGE_FLOW.map((stage) => {
      const count = filtered.filter((p) => p.stage === stage).length;
      return { stage, count };
    });
  }, [filtered]);

  const compData = useMemo(() => {
    const assessed = compensation.filter((c) => c.assessedAmount > 0).length;
    const approved = compensation.filter((c) => ['Approved', 'Partially Paid', 'Fully Paid'].includes(c.status)).length;
    const paid = compensation.filter((c) => c.paidAmount > 0).length;
    const pending = compensation.filter((c) => ['Assessment Pending', 'Assessed', 'Payment Pending'].includes(c.status)).length;
    return [
      { name: 'Assessed', value: assessed, color: '#2b6cb0' },
      { name: 'Approved', value: approved, color: '#2c7a7b' },
      { name: 'Paid', value: paid, color: '#22543d' },
      { name: 'Pending', value: pending, color: '#dd6b20' },
    ];
  }, [compensation]);

  const rrData = useMemo(() => {
    const eligible = families.filter((f) => f.rrEligibility).length;
    const inProgress = families.filter((f) => f.rrStatus === 'In Progress').length;
    const completed = families.filter((f) => f.rrStatus === 'Completed').length;
    const pending = families.filter((f) => ['Not Started', 'Eligible'].includes(f.rrStatus)).length;
    return [
      { name: 'Eligible', value: eligible, color: '#2b6cb0' },
      { name: 'In Progress', value: inProgress, color: '#3182ce' },
      { name: 'Completed', value: completed, color: '#22543d' },
      { name: 'Pending', value: pending, color: '#dd6b20' },
    ];
  }, [families]);

  const criticalAlerts = alerts.filter((a) => a.severity === 'Critical' || a.severity === 'High').slice(0, 5);

  return (
    <div>
      <PageHeader
        title="National Land Acquisition Monitoring Dashboard"
        subtitle="Real-time overview of land acquisition lifecycle across all states and districts"
        actions={<button className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50"><Download className="w-3.5 h-3.5" /> Export Dashboard</button>}
      />

      <FilterBar>
        <Select label="Financial Year" value={fy} onChange={setFy} options={[{ value: '2026-27', label: '2026-27' }, { value: '2025-26', label: '2025-26' }, { value: '2024-25', label: '2024-25' }]} />
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="Project Type" value={typeFilter} onChange={setTypeFilter} options={PROJECT_TYPES.map((t) => ({ value: t, label: t }))} />
        <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'Submitted', label: 'Submitted' },
          { value: 'Under Scrutiny', label: 'Under Scrutiny' },
          { value: 'Approved', label: 'Approved' },
          { value: 'Delayed', label: 'Delayed' },
          { value: 'Completed', label: 'Completed' },
        ]} />
        <span className="text-xs text-slate-400 ml-auto">Last updated: 27-Aug-2026 09:42 IST</span>
      </FilterBar>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <KpiCard label="Total Projects" value={kpis.totalProjects} icon={Building2} color="#1e3a5f" trend="+3 this month" trendDir="up" lastUpdated="09:42" />
        <KpiCard label="Land Proposed" value={kpis.landProposed.toLocaleString()} unit="ha" icon={MapPin} color="#2b6cb0" trend="+1,240 ha" trendDir="up" lastUpdated="09:42" />
        <KpiCard label="Land Notified" value={kpis.landNotified.toLocaleString()} unit="ha" icon={FileCheck} color="#2c7a7b" trend={`${Math.round((kpis.landNotified / kpis.landProposed) * 100)}% of proposed`} trendDir="up" lastUpdated="09:42" />
        <KpiCard label="Land Acquired" value={kpis.landAcquired.toLocaleString()} unit="ha" icon={MapPin} color="#22543d" trend={`${Math.round((kpis.landAcquired / kpis.landProposed) * 100)}% of proposed`} trendDir="up" lastUpdated="09:42" />
        <KpiCard label="Compensation Assessed" value={`₹${kpis.compAssessed.toLocaleString()}`} unit="Cr" icon={IndianRupee} color="#744210" trend="+₹86 Cr" trendDir="up" lastUpdated="09:42" />
        <KpiCard label="Compensation Disbursed" value={`₹${kpis.compDisbursed.toLocaleString()}`} unit="Cr" icon={IndianRupee} color="#22543d" trend={`${Math.round((kpis.compDisbursed / kpis.compAssessed) * 100)}% of assessed`} trendDir="up" lastUpdated="09:42" />
        <KpiCard label="Affected Families" value={kpis.affectedFamilies.toLocaleString()} icon={Users} color="#2b6cb0" trend="+47" trendDir="up" lastUpdated="09:42" />
        <KpiCard label="Displaced Families" value={kpis.displacedFamilies.toLocaleString()} icon={Users} color="#dd6b20" trend="+12" trendDir="up" lastUpdated="09:42" />
        <KpiCard label="Possession Completed" value={kpis.possessionCompleted} icon={KeyRound} color="#22543d" trend={`${Math.round((kpis.possessionCompleted / kpis.totalProjects) * 100)}% of projects`} trendDir="up" lastUpdated="09:42" />
        <KpiCard label="R&R Completed" value={kpis.rrCompleted} icon={HeartHandshake} color="#2c7a7b" trend={`${Math.round((kpis.rrCompleted / kpis.totalProjects) * 100)}% of projects`} trendDir="up" lastUpdated="09:42" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card title="State-wise Acquisition Progress (hectares)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stateData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="state" angle={-35} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: '1px solid #e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Proposed" fill="#2b6cb0" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Notified" fill="#2c7a7b" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Acquired" fill="#22543d" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Project Category Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: any) => `${e.name}: ${e.value}`} labelLine={false} fontSize={11}>
                {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card title="Acquisition Status Flow" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stageData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="stage" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
              <Bar dataKey="count" fill="#1e3a5f" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Compensation Overview">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={compData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={(e: any) => `${e.name}: ${e.value}`} labelLine={false} fontSize={10}>
                {compData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card title="R&R Overview">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={rrData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e: any) => `${e.name}: ${e.value}`} labelLine={false} fontSize={10}>
                {rrData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Live Acquisition Monitoring" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Project ID', 'Name', 'State', 'Stage', 'Acq %', 'Comp %', 'Poss %', 'R&R %', 'Status'].map((h) => (
                    <th key={h} className="text-left px-2 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.slice(0, 6).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-2 py-2 font-mono text-slate-600 whitespace-nowrap">{p.id}</td>
                    <td className="px-2 py-2 text-slate-700 max-w-[160px] truncate">{p.name}</td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{p.state}</td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{p.stage}</td>
                    <td className="px-2 py-2"><div className="w-16"><ProgressBar value={p.acquisitionPct} color="bg-blue-600" height="h-1.5" /></div></td>
                    <td className="px-2 py-2"><div className="w-16"><ProgressBar value={p.compensationPct} color="bg-amber-500" height="h-1.5" /></div></td>
                    <td className="px-2 py-2"><div className="w-16"><ProgressBar value={p.possessionPct} color="bg-teal-600" height="h-1.5" /></div></td>
                    <td className="px-2 py-2"><div className="w-16"><ProgressBar value={p.rrPct} color="bg-green-600" height="h-1.5" /></div></td>
                    <td className="px-2 py-2"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Critical Alerts */}
      <Card title="Critical Alerts & Escalations" actions={<span className="text-xs text-slate-400">{criticalAlerts.length} active</span>}>
        <div className="space-y-2">
          {criticalAlerts.map((alert) => (
            <div key={alert.id} className="flex items-center gap-3 p-2 border border-slate-200 rounded hover:bg-slate-50">
              <AlertTriangle className={`w-4 h-4 shrink-0 ${alert.severity === 'Critical' ? 'text-red-600' : 'text-orange-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700">{alert.type} — {alert.projectName}</p>
                <p className="text-xs text-slate-500 truncate">{alert.description}</p>
              </div>
              <StatusBadge status={alert.severity} />
              <StatusBadge status={alert.escalationLevel} />
              <span className="text-xs text-slate-400 whitespace-nowrap">{alert.createdDate}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
