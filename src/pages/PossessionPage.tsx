import { useState, useMemo, useEffect } from 'react';
import { ApiService } from '@/services/apiService';
import { STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, SearchInput, StatusBadge, Button, EmptyState } from '@/components/ui';
import { Key, Download } from 'lucide-react';
import { exportToCsv } from '@/utils/exportUtils';
import type { LandParcel, Project } from '@/types';

export default function PossessionPage() {
  const [parcels, setParcels] = useState<LandParcel[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [pcl, projs] = await Promise.all([
          ApiService.getParcels(),
          ApiService.getProjects(),
        ]);
        setParcels(pcl);
        setProjects(projs);
      } catch (e) {
        console.error('Failed to load possession data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return parcels.filter((p) => {
      if (search && !p.id.toLowerCase().includes(search.toLowerCase()) && !p.village.toLowerCase().includes(search.toLowerCase())) return false;
      if (stateFilter && p.state !== stateFilter) return false;
      if (statusFilter && p.possessionStatus !== statusFilter) return false;
      return true;
    });
  }, [parcels, search, stateFilter, statusFilter]);

  const handleExportCsv = () => {
    exportToCsv(
      filtered,
      `NLAMS_Land_Possession_Registry_${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Parcel ID' },
        { key: 'projectId', label: 'Project ID' },
        { key: 'village', label: 'Village' },
        { key: 'taluk', label: 'Taluk' },
        { key: 'district', label: 'District' },
        { key: 'state', label: 'State' },
        { key: 'area', label: 'Area (ha)' },
        { key: 'compensationStatus', label: 'Compensation Status' },
        { key: 'possessionStatus', label: 'Possession Status' },
      ]
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Physical Land Possession Management"
        subtitle="Track site inspection schedules, physical possession proceedings, and infrastructure handover status"
        actions={<Button variant="outline" size="sm" icon={Download} onClick={handleExportCsv}>Export CSV</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['Pending', 'Scheduled', 'Taken', 'Handover Completed'] as const).map((s) => {
          const count = parcels.filter((p) => p.possessionStatus === s).length;
          return (
            <div key={s} className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">{s}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{count}</p>
            </div>
          );
        })}
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search parcel ID or village..." />
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="Possession Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'Pending', label: 'Pending' },
          { value: 'Scheduled', label: 'Scheduled' },
          { value: 'Taken', label: 'Taken' },
          { value: 'Handover Completed', label: 'Handover Completed' },
        ]} />
      </FilterBar>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading possession records...</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No possession records" message="No parcels match the current filters." icon={Key} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Parcel ID', 'Project Name', 'Village', 'District', 'State', 'Area (ha)', 'Compensation', 'Possession Status'].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.slice(0, 40).map((p) => {
                  const proj = projects.find((pr) => pr.id === p.projectId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-mono font-medium text-slate-700 whitespace-nowrap">{p.id}</td>
                      <td className="px-3 py-2 text-slate-800 font-medium max-w-[160px] truncate" title={proj?.name || p.projectId}>
                        {proj?.name || p.projectId}
                      </td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.village}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.district}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.state}</td>
                      <td className="px-3 py-2 text-slate-700 text-right whitespace-nowrap font-medium">{p.area}</td>
                      <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={p.compensationStatus} /></td>
                      <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={p.possessionStatus} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
