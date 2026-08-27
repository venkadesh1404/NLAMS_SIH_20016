import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { ApiService } from '@/services/apiService';
import { STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, SearchInput, StatusBadge, Button, EmptyState } from '@/components/ui';
import { Bell, Download, FileText, CheckCircle2, AlertTriangle, Info, XCircle, ArrowRight } from 'lucide-react';
import { exportToCsv } from '@/utils/exportUtils';
import type { Notification, SystemNotification } from '@/types';

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'system' | 'statutory'>('system');
  const [systemNotifs, setSystemNotifs] = useState<SystemNotification[]>([]);
  const [statutoryNotifs, setStatutoryNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // System notification filter
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');

  // Statutory notification filters
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sys, stat] = await Promise.all([
        ApiService.getSystemNotifications(user?.role, user?.email),
        ApiService.getNotifications(),
      ]);
      setSystemNotifs(sys);
      setStatutoryNotifs(stat);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await ApiService.markNotificationRead(id);
    setSystemNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await ApiService.markAllNotificationsRead(user?.role, user?.email);
    setSystemNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNavigate = (n: SystemNotification) => {
    if (!n.isRead) {
      handleMarkAsRead(n.id);
    }
    if (n.targetModule === 'proposals') {
      navigate('/proposals');
    } else if (n.targetModule === 'projects' && n.targetId) {
      navigate(`/projects/${n.targetId}`);
    } else if (n.targetModule === 'compensation') {
      navigate('/compensation');
    } else if (n.targetModule === 'possession') {
      navigate('/possession');
    } else if (n.targetModule === 'rehabilitation') {
      navigate('/rehabilitation');
    } else if (n.targetModule === 'alerts') {
      navigate('/alerts');
    } else {
      navigate('/dashboard');
    }
  };

  const filteredSystemNotifs = useMemo(() => {
    if (filterRead === 'unread') return systemNotifs.filter((n) => !n.isRead);
    if (filterRead === 'read') return systemNotifs.filter((n) => n.isRead);
    return systemNotifs;
  }, [systemNotifs, filterRead]);

  const filteredStatutory = useMemo(() => {
    return statutoryNotifs.filter((n) => {
      if (search && !n.id.toLowerCase().includes(search.toLowerCase()) && !n.projectName.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter && n.type !== typeFilter) return false;
      return true;
    });
  }, [statutoryNotifs, search, typeFilter]);

  const unreadCount = systemNotifs.filter((n) => !n.isRead).length;

  const handleExportStatutoryCsv = () => {
    exportToCsv(
      filteredStatutory,
      `NLAMS_Statutory_Gazette_Notifications_${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Notification ID' },
        { key: 'projectName', label: 'Project Name' },
        { key: 'type', label: 'Notification Type' },
        { key: 'number', label: 'Gazette Number' },
        { key: 'issueDate', label: 'Issue Date' },
        { key: 'publicationDate', label: 'Publication Date' },
        { key: 'status', label: 'Status' },
        { key: 'remarks', label: 'Remarks' },
      ]
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notification Center"
        subtitle="Real-time administrative alerts, workflow action items, and official statutory Gazette publications"
        actions={
          <div className="flex items-center gap-2">
            {activeTab === 'system' ? (
              <Button variant="outline" size="sm" icon={CheckCircle2} onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                Mark All as Read
              </Button>
            ) : (
              <Button variant="outline" size="sm" icon={Download} onClick={handleExportStatutoryCsv}>
                Export Gazette CSV
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('system')}
          className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'system' ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bell className="w-3.5 h-3.5" /> Action Alerts & Workflow Notifications
          {unreadCount > 0 && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('statutory')}
          className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'statutory' ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Statutory Gazette Publications ({statutoryNotifs.length})
        </button>
      </div>

      {activeTab === 'system' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Filter View:</span>
            <div className="flex gap-1 bg-slate-100 p-1 rounded">
              {(['all', 'unread', 'read'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterRead(mode)}
                  className={`text-xs px-3 py-1 rounded capitalize font-medium transition-colors ${
                    filterRead === mode ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {mode} {mode === 'unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading notifications...</div>
          ) : filteredSystemNotifs.length === 0 ? (
            <Card>
              <EmptyState title="No notifications" message="You have no notifications matching this filter." icon={Bell} />
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredSystemNotifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNavigate(n)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                    n.isRead
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-blue-50/60 border-blue-200 hover:border-blue-300 shadow-sm'
                  }`}
                >
                  <div className="mt-0.5">
                    {n.type === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                    {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    {n.type === 'info' && <Info className="w-4 h-4 text-blue-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-xs font-bold ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</h4>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Unread notification" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{n.timestamp}</span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-blue-700 font-medium inline-flex items-center gap-1 hover:underline">
                        Open related record <ArrowRight className="w-3 h-3" />
                      </span>
                      {!n.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          className="text-[10px] text-slate-500 hover:text-slate-700 hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search notification ID or project..." />
            <Select label="Type" value={typeFilter} onChange={setTypeFilter} options={[
              { value: 'Preliminary Notification', label: 'Preliminary Notification' },
              { value: 'Declaration', label: 'Declaration' },
              { value: 'Award Notification', label: 'Award Notification' },
              { value: 'Possession Notice', label: 'Possession Notice' },
              { value: 'Other Statutory Notice', label: 'Other Statutory Notice' },
            ]} />
          </FilterBar>

          <Card>
            {filteredStatutory.length === 0 ? (
              <EmptyState title="No statutory notifications" message="No gazette publications match the current filters." icon={Bell} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {['ID', 'Project Name', 'Type', 'Gazette Number', 'Issue Date', 'Publication Date', 'Status', 'Remarks'].map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStatutory.map((n) => (
                      <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 font-mono font-medium text-slate-700">{n.id}</td>
                        <td className="px-3 py-2 text-slate-800 font-medium max-w-[180px] truncate">{n.projectName}</td>
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{n.type}</td>
                        <td className="px-3 py-2 font-mono text-slate-600 whitespace-nowrap">{n.number}</td>
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{n.issueDate}</td>
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{n.publicationDate}</td>
                        <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={n.status} /></td>
                        <td className="px-3 py-2 text-slate-600 max-w-[200px] truncate">{n.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
