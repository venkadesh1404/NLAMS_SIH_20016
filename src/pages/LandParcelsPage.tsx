import { useState, useMemo } from 'react';
import { DATA, STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, StatusBadge, Button, EmptyState } from '@/components/ui';
import { Map, Download } from 'lucide-react';

export default function LandParcelsPage() {
  const { parcels, projects } = DATA;
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return parcels.filter((p) => {
      if (search && !p.id.toLowerCase().includes(search.toLowerCase()) && !p.surveyNumber.toLowerCase().includes(search.toLowerCase()) && !p.village.toLowerCase().includes(search.toLowerCase())) return false;
      if (stateFilter && p.state !== stateFilter) return false;
      if (statusFilter && p.acquisitionStatus !== statusFilter) return false;
      return true;
    });
  }, [parcels, search, stateFilter, statusFilter]);

  return (
    <div>
      <PageHeader title="Land Parcels" subtitle="Individual land parcels under acquisition with PostGIS geometry" actions={<Button variant="outline" size="sm" icon={Download}>Export</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {(['Proposed', 'Notified', 'Acquired', 'Disputed', 'Pending'] as const).map((s) => {
          const count = parcels.filter((p) => p.acquisitionStatus === s).length;
          return <div key={s} className="bg-white border border-slate-200 rounded-lg p-3"><p className="text-xs text-slate-500">{s}</p><p className="text-xl font-bold text-slate-800">{count}</p></div>;
        })}
      </div>

      <FilterBar>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search parcel, survey no, or village..." className="text-sm border border-slate-300 rounded px-3 py-1.5 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="Acquisition Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'Proposed', label: 'Proposed' }, { value: 'Notified', label: 'Notified' },
          { value: 'Acquired', label: 'Acquired' }, { value: 'Disputed', label: 'Disputed' }, { value: 'Pending', label: 'Pending' },
        ]} />
      </FilterBar>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No parcels found" message="No land parcels match the current filters." icon={Map} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Parcel ID', 'Survey No.', 'Village', 'Taluk', 'District', 'State', 'Area (ha)', 'Land Type', 'Ownership', 'Acquisition', 'Compensation', 'Possession', 'R&R'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.slice(0, 50).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-slate-600">{p.id}</td>
                    <td className="px-3 py-2 text-slate-600">{p.surveyNumber}</td>
                    <td className="px-3 py-2 text-slate-600">{p.village}</td>
                    <td className="px-3 py-2 text-slate-600">{p.taluk}</td>
                    <td className="px-3 py-2 text-slate-600">{p.district}</td>
                    <td className="px-3 py-2 text-slate-600">{p.state}</td>
                    <td className="px-3 py-2 text-slate-600 text-right">{p.area}</td>
                    <td className="px-3 py-2 text-slate-600">{p.landType}</td>
                    <td className="px-3 py-2 text-slate-600">{p.ownershipType}</td>
                    <td className="px-3 py-2"><StatusBadge status={p.acquisitionStatus} /></td>
                    <td className="px-3 py-2"><StatusBadge status={p.compensationStatus} /></td>
                    <td className="px-3 py-2"><StatusBadge status={p.possessionStatus} /></td>
                    <td className="px-3 py-2"><StatusBadge status={p.rrStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-2">Geometry: POLYGON (EPSG:4326) · PostGIS spatial database · GeoJSON conversion supported</p>
    </div>
  );
}
