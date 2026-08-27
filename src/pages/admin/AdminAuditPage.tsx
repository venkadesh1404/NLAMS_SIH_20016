import { useState, useMemo, useEffect } from 'react';
import { ApiService } from '@/services/apiService';
import { PageHeader, Card, FilterBar, Select, SearchInput, StatusBadge, Button, EmptyState } from '@/components/ui';
import { ScrollText, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportToCsv } from '@/utils/exportUtils';
import type { AuditLog } from '@/types';

export default function AdminAuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await ApiService.getAuditLogs();
        setAuditLogs(data);
      } catch (e) {
        console.error('Failed to load audit logs', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return auditLogs.filter((a) => {
      if (search && !a.user.toLowerCase().includes(search.toLowerCase()) && !a.recordId.toLowerCase().includes(search.toLowerCase()) && !a.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (moduleFilter && a.module !== moduleFilter) return false;
      if (actionFilter && a.action !== actionFilter) return false;
      if (originFilter && a.origin !== originFilter) return false;
      return true;
    });
  }, [auditLogs, search, moduleFilter, actionFilter, originFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleExportCsv = () => {
    exportToCsv(
      filtered,
      `NLAMS_System_Audit_Trail_${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Log ID' },
        { key: 'timestamp', label: 'Timestamp' },
        { key: 'user', label: 'Officer Name' },
        { key: 'role', label: 'Role' },
        { key: 'module', label: 'Module' },
        { key: 'action', label: 'Action' },
        { key: 'recordId', label: 'Record ID' },
        { key: 'description', label: 'Description' },
        { key: 'origin', label: 'Origin' },
      ]
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Comprehensive System Audit Trail"
        subtitle="Cryptographically verified immutable record of all system mutations, proposals, verifications, and approvals"
        actions={<Button variant="outline" size="sm" icon={Download} onClick={handleExportCsv}>Export CSV</Button>}
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search user, record ID, or action..." />
        <Select
          label="Module"
          value={moduleFilter}
          onChange={setModuleFilter}
          options={['Proposals', 'Projects', 'Compensation', 'Land Verification', 'Notifications', 'Awards', 'Possession', 'R&R', 'Workflow', 'Documents'].map((m) => ({ value: m, label: m }))}
        />
        <Select
          label="Action"
          value={actionFilter}
          onChange={setActionFilter}
          options={['CREATE', 'UPDATE', 'SUBMIT', 'VERIFY', 'APPROVE', 'SEND_BACK', 'REJECT', 'UPLOAD', 'DELETE', 'FORWARD', 'LOGIN', 'LOGOUT'].map((a) => ({ value: a, label: a }))}
        />
        <Select
          label="Origin"
          value={originFilter}
          onChange={setOriginFilter}
          options={[{ value: 'ONLINE', label: 'ONLINE' }, { value: 'OFFLINE', label: 'OFFLINE' }]}
        />
      </FilterBar>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading immutable audit trail...</div>
        ) : paged.length === 0 ? (
          <EmptyState title="No audit records" message="No audit logs match the active filter criteria." icon={ScrollText} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Log ID', 'Timestamp', 'User', 'Role', 'Module', 'Action', 'Record ID', 'Description', 'Origin'].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paged.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 font-mono font-medium text-slate-700 whitespace-nowrap">{a.id}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap font-mono">{a.timestamp}</td>
                    <td className="px-3 py-2 text-slate-800 font-medium whitespace-nowrap">{a.user}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{a.role}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{a.module}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={a.action} /></td>
                    <td className="px-3 py-2 font-mono text-slate-600 whitespace-nowrap">{a.recordId}</td>
                    <td className="px-3 py-2 text-slate-700 max-w-[240px] truncate" title={a.description}>{a.description}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={a.origin} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Showing {filtered.length === 0 ? 0 : ((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} audit entries
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs text-slate-600 px-2">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </Card>
    </div>
  );
}
