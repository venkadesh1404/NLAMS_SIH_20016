import { useState, useMemo, useEffect } from 'react';
import { ApiService } from '@/services/apiService';
import { STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, StatusBadge, Button, EmptyState } from '@/components/ui';
import { Map, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportToCsv } from '@/utils/exportUtils';
import type { LandParcel } from '@/types';

export default function LandParcelsPage() {
  const [parcels, setParcels] = useState<LandParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await ApiService.getParcels();
        setParcels(data);
      } catch (e) {
        console.error('Failed to load parcels', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return parcels.filter((p) => {
      if (search && !p.id.toLowerCase().includes(search.toLowerCase()) && !p.surveyNumber.toLowerCase().includes(search.toLowerCase()) && !p.village.toLowerCase().includes(search.toLowerCase())) return false;
      if (stateFilter && p.state !== stateFilter) return false;
      if (statusFilter && p.acquisitionStatus !== statusFilter) return false;
      return true;
    });
  }, [parcels, search, stateFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleExportCsv = () => {
    exportToCsv(
      filtered,
      `NLAMS_Land_Parcels_${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Parcel ID' },
        { key: 'surveyNumber', label: 'Survey No.' },
        { key: 'village', label: 'Village' },
        { key: 'taluk', label: 'Taluk' },
        { key: 'district', label: 'District' },
        { key: 'state', label: 'State' },
        { key: 'area', label: 'Area (ha)' },
        { key: 'landType', label: 'Land Type' },
        { key: 'ownershipType', label: 'Ownership' },
        { key: 'acquisitionStatus', label: 'Acquisition Status' },
        { key: 'compensationStatus', label: 'Compensation Status' },
        { key: 'possessionStatus', label: 'Possession Status' },
        { key: 'rrStatus', label: 'R&R Status' },
        { key: 'projectId', label: 'Project ID' },
      ]
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Land Parcels Cadastral Registry"
        subtitle={`${filtered.length} individual revenue parcels under statutory acquisition proceedings`}
        actions={<Button variant="outline" size="sm" icon={Download} onClick={handleExportCsv}>Export CSV</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(['Proposed', 'Notified', 'Acquired', 'Disputed', 'Pending'] as const).map((s) => {
          const count = parcels.filter((p) => p.acquisitionStatus === s).length;
          return (
            <div key={s} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">{s}</p>
              <p className="text-xl font-bold text-slate-800 mt-0.5">{count}</p>
            </div>
          );
        })}
      </div>

      <FilterBar>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search parcel ID, survey no, or village..."
          className="text-xs border border-slate-300 rounded px-3 py-1.5 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="Acquisition Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'Proposed', label: 'Proposed' },
          { value: 'Notified', label: 'Notified' },
          { value: 'Acquired', label: 'Acquired' },
          { value: 'Disputed', label: 'Disputed' },
          { value: 'Pending', label: 'Pending' },
        ]} />
      </FilterBar>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading cadastral parcel registry...</div>
        ) : paged.length === 0 ? (
          <EmptyState title="No parcels found" message="No land parcels match the current filters." icon={Map} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Parcel ID', 'Survey No.', 'Village', 'Taluk', 'District', 'State', 'Area (ha)', 'Land Type', 'Ownership', 'Acquisition', 'Compensation', 'Possession', 'R&R'].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paged.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 font-mono font-medium text-slate-700 whitespace-nowrap">{p.id}</td>
                    <td className="px-3 py-2 font-mono text-slate-700 whitespace-nowrap">{p.surveyNumber}</td>
                    <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{p.village}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.taluk}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.district}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.state}</td>
                    <td className="px-3 py-2 text-slate-700 text-right whitespace-nowrap font-medium">{p.area}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.landType}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.ownershipType}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={p.acquisitionStatus} /></td>
                    <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={p.compensationStatus} /></td>
                    <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={p.possessionStatus} /></td>
                    <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={p.rrStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Showing {filtered.length === 0 ? 0 : ((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} parcels
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs text-slate-600 px-2">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </Card>
      <p className="text-xs text-slate-400">PostGIS Geometry Spatial Polygon (EPSG:4326) · GeoJSON interoperability enabled</p>
    </div>
  );
}
