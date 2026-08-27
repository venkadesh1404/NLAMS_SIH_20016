import { useState, useMemo } from 'react';
import { DATA } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, StatusBadge, Button, EmptyState } from '@/components/ui';
import { AlertTriangle, Download, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function AlertsPage() {
  const { alerts, projects } = DATA;
  const [severity, setSeverity] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (severity && a.severity !== severity) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      if (typeFilter && a.type !== typeFilter) return false;
      return true;
    });
  }, [alerts, severity, statusFilter, typeFilter]);

  const critical = alerts.filter((a) => a.severity === 'Critical').length;
  const high = alerts.filter((a) => a.severity === 'High').length;
  const open = alerts.filter((a) => a.status === 'Open').length;
  const resolved = alerts.filter((a) => a.status === 'Resolved').length;

  return (
    <div>
      <PageHeader title="Alerts & Escalations" subtitle="Automated alerts for delays, pending actions, and critical cases" actions={<Button variant="outline" size="sm" icon={Download}>Export</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card><div className="flex items-center gap-2"><AlertOctagon className="w-5 h-5 text-red-600" /><div><p className="text-xs text-slate-500">Critical</p><p className="text-xl font-bold text-slate-800">{critical}</p></div></div></Card>
        <Card><div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-500" /><div><p className="text-xs text-slate-500">High</p><p className="text-xl font-bold text-slate-800">{high}</p></div></div></Card>
        <Card><div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /><div><p className="text-xs text-slate-500">Open</p><p className="text-xl font-bold text-slate-800">{open}</p></div></div></Card>
        <Card><div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><div><p className="text-xs text-slate-500">Resolved</p><p className="text-xl font-bold text-slate-800">{resolved}</p></div></div></Card>
      </div>

      {/* Escalation flow */}
      <Card className="mb-4">
        <p className="text-xs font-medium text-slate-600 mb-2">Escalation Flow</p>
        <div className="flex items-center gap-2 text-xs">
          {['District', 'State', 'Central'].map((level, i, arr) => (
            <div key={level} className="flex items-center">
              <span className={`px-3 py-1.5 rounded border ${level === 'Central' ? 'bg-red-50 border-red-300 text-red-700' : level === 'State' ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-amber-50 border-amber-300 text-amber-700'}`}>{level}</span>
              {i < arr.length - 1 && <span className="text-slate-400 mx-1">→</span>}
            </div>
          ))}
        </div>
      </Card>

      <FilterBar>
        <Select label="Severity" value={severity} onChange={setSeverity} options={[{ value: 'Critical', label: 'Critical' }, { value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]} />
        <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: 'Open', label: 'Open' }, { value: 'Acknowledged', label: 'Acknowledged' }, { value: 'Resolved', label: 'Resolved' }]} />
        <Select label="Type" value={typeFilter} onChange={setTypeFilter} options={[
          { value: 'Delayed Approval', label: 'Delayed Approval' }, { value: 'Pending Verification', label: 'Pending Verification' },
          { value: 'Compensation Delay', label: 'Compensation Delay' }, { value: 'Possession Delay', label: 'Possession Delay' },
          { value: 'R&R Delay', label: 'R&R Delay' }, { value: 'Missing Document', label: 'Missing Document' },
          { value: 'Expiring Deadline', label: 'Expiring Deadline' }, { value: 'Long Pending Case', label: 'Long Pending Case' },
        ]} />
      </FilterBar>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No alerts" message="No alerts match the current filters." icon={AlertTriangle} />
        ) : (
          <div className="space-y-2">
            {filtered.map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded hover:bg-slate-50">
                <AlertTriangle className={`w-5 h-5 shrink-0 ${alert.severity === 'Critical' ? 'text-red-600' : alert.severity === 'High' ? 'text-orange-500' : alert.severity === 'Medium' ? 'text-amber-500' : 'text-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-700">{alert.type}</p>
                    <StatusBadge status={alert.severity} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{alert.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{alert.projectName} · {alert.createdDate}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusBadge status={alert.escalationLevel} />
                  <StatusBadge status={alert.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
