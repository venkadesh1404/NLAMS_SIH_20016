import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON } from 'react-leaflet';
import { DATA, STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, StatusBadge } from '@/components/ui';
import { getStatusStyle } from '@/utils/statusStyles';
import { Layers, MapPin, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const ACQ_COLORS: Record<string, string> = {
  Proposed: '#64748b',
  Notified: '#3b82f6',
  Acquired: '#16a34a',
  Disputed: '#dc2626',
  Pending: '#f59e0b',
};

export default function GisPage() {
  const { parcels, projects } = DATA;
  const [searchParams] = useSearchParams();
  const projectFilter = searchParams.get('project') || '';
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [layers, setLayers] = useState({ projects: true, parcels: true, acquired: true, disputed: true, pending: true });

  const filtered = useMemo(() => {
    return parcels.filter((p) => {
      if (projectFilter && p.projectId !== projectFilter) return false;
      if (stateFilter && p.state !== stateFilter) return false;
      if (districtFilter && p.district !== districtFilter) return false;
      if (statusFilter && p.acquisitionStatus !== statusFilter) return false;
      if (!layers.acquired && p.acquisitionStatus === 'Acquired') return false;
      if (!layers.disputed && p.acquisitionStatus === 'Disputed') return false;
      if (!layers.pending && (p.acquisitionStatus === 'Pending' || p.acquisitionStatus === 'Proposed')) return false;
      return true;
    });
  }, [parcels, projectFilter, stateFilter, districtFilter, statusFilter, layers]);

  const centerLat = filtered.length > 0 ? filtered.reduce((s, p) => s + p.lat, 0) / filtered.length : 20.5937;
  const centerLng = filtered.length > 0 ? filtered.reduce((s, p) => s + p.lng, 0) / filtered.length : 78.9629;

  const districts = stateFilter ? DATA.parcels.filter((p) => p.state === stateFilter).map((p) => p.district).filter((v, i, a) => a.indexOf(v) === i) : [];

  return (
    <div>
      <PageHeader
        title="GIS / Maps"
        subtitle="Geographic visualization of land parcels and acquisition status across India"
        actions={<span className="text-xs text-slate-400">PostGIS · EPSG:4326 · OpenStreetMap</span>}
      />

      <FilterBar>
        <Select label="State" value={stateFilter} onChange={(v) => { setStateFilter(v); setDistrictFilter(''); }} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="District" value={districtFilter} onChange={setDistrictFilter} options={districts.map((d) => ({ value: d, label: d }))} />
        <Select label="Parcel Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'Proposed', label: 'Proposed' }, { value: 'Notified', label: 'Notified' },
          { value: 'Acquired', label: 'Acquired' }, { value: 'Disputed', label: 'Disputed' }, { value: 'Pending', label: 'Pending' },
        ]} />
        {projectFilter && <span className="text-xs text-blue-600">Filtered: {projectFilter}</span>}
      </FilterBar>

      <div className="grid lg:grid-cols-4 gap-4">
        {/* Map */}
        <div className="lg:col-span-3">
          <Card title="Interactive Map" actions={<span className="text-xs text-slate-400">{filtered.length} parcels shown</span>}>
            <div className="h-[500px] rounded overflow-hidden border border-slate-200">
              <MapContainer center={[centerLat, centerLng]} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {filtered.map((parcel) => (
                  <CircleMarker
                    key={parcel.id}
                    center={[parcel.lat, parcel.lng]}
                    radius={8}
                    pathOptions={{ color: ACQ_COLORS[parcel.acquisitionStatus] || '#64748b', fillColor: ACQ_COLORS[parcel.acquisitionStatus] || '#64748b', fillOpacity: 0.7 }}
                    eventHandlers={{ click: () => setSelectedParcel(parcel) }}
                  >
                    <Popup>
                      <div className="text-xs">
                        <strong>{parcel.id}</strong><br />
                        {parcel.village}, {parcel.district}<br />
                        Area: {parcel.area} ha<br />
                        Status: {parcel.acquisitionStatus}
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card title="Map Layers">
            <div className="space-y-2">
              {[
                { key: 'parcels', label: 'Parcel Layer' },
                { key: 'acquired', label: 'Acquired Parcels' },
                { key: 'disputed', label: 'Disputed Parcels' },
                { key: 'pending', label: 'Pending Parcels' },
              ].map((l) => (
                <label key={l.key} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(layers as any)[l.key]}
                    onChange={(e) => setLayers({ ...layers, [l.key]: e.target.checked })}
                    className="rounded"
                  />
                  <span className={`w-3 h-3 rounded-full ${l.key === 'acquired' ? 'bg-green-600' : l.key === 'disputed' ? 'bg-red-600' : l.key === 'pending' ? 'bg-amber-500' : 'bg-blue-600'}`} />
                  {l.label}
                </label>
              ))}
            </div>
          </Card>

          <Card title="Legend">
            <div className="space-y-1.5">
              {Object.entries(ACQ_COLORS).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-slate-600">{status}</span>
                </div>
              ))}
            </div>
          </Card>

          {selectedParcel && (
            <Card title="Parcel Details" actions={<button onClick={() => setSelectedParcel(null)}><X className="w-3.5 h-3.5 text-slate-400" /></button>}>
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between"><dt className="text-slate-500">Parcel ID</dt><dd className="font-mono text-slate-700">{selectedParcel.id}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Survey No.</dt><dd className="text-slate-700">{selectedParcel.surveyNumber}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Village</dt><dd className="text-slate-700">{selectedParcel.village}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">District</dt><dd className="text-slate-700">{selectedParcel.district}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Area</dt><dd className="text-slate-700">{selectedParcel.area} ha</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Land Type</dt><dd className="text-slate-700">{selectedParcel.landType}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Owners</dt><dd className="text-slate-700">{selectedParcel.ownerCount}</dd></div>
                <div className="flex justify-between items-center"><dt className="text-slate-500">Acquisition</dt><dd><StatusBadge status={selectedParcel.acquisitionStatus} /></dd></div>
                <div className="flex justify-between items-center"><dt className="text-slate-500">Compensation</dt><dd><StatusBadge status={selectedParcel.compensationStatus} /></dd></div>
                <div className="flex justify-between items-center"><dt className="text-slate-500">Possession</dt><dd><StatusBadge status={selectedParcel.possessionStatus} /></dd></div>
                <div className="flex justify-between items-center"><dt className="text-slate-500">R&R</dt><dd><StatusBadge status={selectedParcel.rrStatus} /></dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Coordinates</dt><dd className="font-mono text-slate-700 text-[10px]">{selectedParcel.lat}, {selectedParcel.lng}</dd></div>
                <div className="pt-2"><Link to={`/projects/${selectedParcel.projectId}`} className="text-blue-600 hover:underline">View Project →</Link></div>
              </dl>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
