import { useState, useMemo } from 'react';
import { DATA } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, StatusBadge, Button, EmptyState } from '@/components/ui';
import { RefreshCw, Download, AlertCircle, CheckCircle, Loader, XCircle } from 'lucide-react';

export default function SyncQueuePage() {
  const { sync } = DATA;
  const [statusFilter, setStatusFilter] = useState('');
  const [syncing, setSyncing] = useState(false);

  const filtered = useMemo(() => {
    return sync.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      return true;
    });
  }, [sync, statusFilter]);

  const pending = sync.filter((s) => s.status === 'Pending').length;
  const failed = sync.filter((s) => s.status === 'Failed').length;
  const conflicts = sync.filter((s) => s.status === 'Conflict').length;
  const synced = sync.filter((s) => s.status === 'Synchronized').length;

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  return (
    <div>
      <PageHeader
        title="Synchronization Queue"
        subtitle="Offline records pending synchronization with the server"
        actions={<Button size="sm" icon={RefreshCw} onClick={handleSync} disabled={syncing}>{syncing ? 'Synchronizing...' : 'Sync Now'}</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card><div className="flex items-center gap-2"><RefreshCw className="w-5 h-5 text-amber-500" /><div><p className="text-xs text-slate-500">Pending</p><p className="text-xl font-bold text-slate-800">{pending}</p></div></div></Card>
        <Card><div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /><div><p className="text-xs text-slate-500">Synchronized</p><p className="text-xl font-bold text-slate-800">{synced}</p></div></div></Card>
        <Card><div className="flex items-center gap-2"><XCircle className="w-5 h-5 text-red-600" /><div><p className="text-xs text-slate-500">Failed</p><p className="text-xl font-bold text-slate-800">{failed}</p></div></div></Card>
        <Card><div className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-500" /><div><p className="text-xs text-slate-500">Conflicts</p><p className="text-xl font-bold text-slate-800">{conflicts}</p></div></div></Card>
      </div>

      {syncing && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-300 rounded-lg text-sm text-blue-800 flex items-center gap-2">
          <Loader className="w-4 h-4 animate-spin" /> Synchronizing offline records... Validating authentication, permissions, and record versions.
        </div>
      )}

      <FilterBar>
        <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'Pending', label: 'Pending' }, { value: 'Synchronizing', label: 'Synchronizing' },
          { value: 'Synchronized', label: 'Synchronized' }, { value: 'Failed', label: 'Failed' }, { value: 'Conflict', label: 'Conflict' },
        ]} />
      </FilterBar>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No sync records" message="No records in the synchronization queue." icon={RefreshCw} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Queue ID', 'Module', 'Record ID', 'Action', 'Created Time', 'Retry Count', 'Status', 'Last Error'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-slate-600">{s.id}</td>
                    <td className="px-3 py-2 text-slate-600">{s.module}</td>
                    <td className="px-3 py-2 font-mono text-slate-600">{s.recordId}</td>
                    <td className="px-3 py-2"><StatusBadge status={s.action} /></td>
                    <td className="px-3 py-2 text-slate-600">{s.createdTime}</td>
                    <td className="px-3 py-2 text-slate-600 text-right">{s.retryCount}</td>
                    <td className="px-3 py-2"><StatusBadge status={s.status} /></td>
                    <td className="px-3 py-2 text-red-600 max-w-[200px] truncate">{s.lastError || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Conflict resolution */}
      {conflicts > 0 && (
        <Card title="Synchronization Conflicts" className="mt-4">
          <div className="space-y-3">
            {sync.filter((s) => s.status === 'Conflict').map((s) => (
              <div key={s.id} className="p-3 border border-orange-300 bg-orange-50 rounded">
                <p className="text-sm font-medium text-slate-700">{s.module} — {s.recordId}</p>
                <p className="text-xs text-slate-500 mt-1">{s.lastError}</p>
                <div className="mt-2 flex gap-2">
                  <button className="text-xs px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50">Use Server Version</button>
                  <button className="text-xs px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50">Review & Merge</button>
                  <button className="text-xs px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50">Save as New Draft</button>
                  <button className="text-xs px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50">Cancel</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Synchronization Flow" className="mt-4">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {['IndexedDB', 'Sync Queue', 'FastAPI', 'Validate Auth', 'Validate Permission', 'Validate Version', 'Update PostgreSQL', 'Audit Log', 'Success'].map((step, i, arr) => (
            <div key={step} className="flex items-center">
              <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">{step}</span>
              {i < arr.length - 1 && <span className="text-slate-400 mx-0.5">→</span>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
