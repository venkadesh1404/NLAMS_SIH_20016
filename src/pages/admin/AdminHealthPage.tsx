import { PageHeader, Card, StatusBadge } from '@/components/ui';
import { Server, Database, Map, Cpu, Bell, RefreshCw, HardDrive, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

const SERVICES = [
  { name: 'Backend (FastAPI)', status: 'healthy', detail: 'Python 3.11 · FastAPI 0.104', icon: Server },
  { name: 'Database (PostgreSQL)', status: 'connected', detail: 'PostgreSQL 16.1 · 42 connections', icon: Database },
  { name: 'PostGIS', status: 'available', detail: 'PostGIS 3.4.2 · EPSG:4326', icon: Map },
  { name: 'REST API', status: 'healthy', detail: '/api/v1 · 18 endpoints · 12ms avg', icon: Activity },
  { name: 'Storage', status: 'connected', detail: '2.4 GB used / 50 GB allocated', icon: HardDrive },
  { name: 'ML Service', status: 'healthy', detail: 'scikit-learn 1.3.2 · model loaded', icon: Cpu },
  { name: 'Notification Service', status: 'healthy', detail: 'In-app + push architecture ready', icon: Bell },
  { name: 'Synchronization Service', status: 'healthy', detail: 'Queue: 12 pending · 0 conflicts', icon: RefreshCw },
];

export default function AdminHealthPage() {
  return (
    <div>
      <PageHeader title="System Health" subtitle="Real-time health monitoring of all system components" />
      <Card className="mb-4">
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-300 rounded">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-800">All Systems Operational</p>
              <p className="text-xs text-green-700">GET /api/v1/health — Status: healthy · Database: connected · PostGIS: available</p>
            </div>
          </div>
          <span className="text-xs text-green-700">Last checked: 27-Aug-2026 09:42 IST</span>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card><p className="text-xs text-slate-500">Uptime</p><p className="text-xl font-bold text-green-600">99.9%</p></Card>
        <Card><p className="text-xs text-slate-500">Avg Response</p><p className="text-xl font-bold text-slate-800">12ms</p></Card>
        <Card><p className="text-xs text-slate-500">Active Sessions</p><p className="text-xl font-bold text-slate-800">7</p></Card>
        <Card><p className="text-xs text-slate-500">DB Connections</p><p className="text-xl font-bold text-slate-800">42</p></Card>
      </div>

      <Card title="Service Status">
        <div className="space-y-2">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.name} className="flex items-center gap-3 p-3 border border-slate-200 rounded hover:bg-slate-50">
                <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#1e3a5f]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.detail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-green-700">{s.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="API Documentation" className="mt-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            { name: 'Swagger UI', url: '/docs', desc: 'Interactive API documentation' },
            { name: 'ReDoc', url: '/redoc', desc: 'Clean API reference' },
            { name: 'OpenAPI JSON', url: '/openapi.json', desc: 'Machine-readable spec' },
          ].map((doc) => (
            <div key={doc.name} className="p-3 border border-slate-200 rounded">
              <p className="font-medium text-slate-700">{doc.name}</p>
              <p className="text-slate-500">{doc.desc}</p>
              <code className="text-[10px] text-blue-600">{doc.url}</code>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-slate-50 rounded text-xs text-slate-600">
          <p className="font-medium mb-1">API Groups:</p>
          <p>/api/v1/auth · /users · /projects · /proposals · /parcels · /notifications · /awards · /compensation · /possession · /families · /rehabilitation · /workflow · /documents · /alerts · /reports · /analytics · /gis · /audit · /sync</p>
        </div>
      </Card>
    </div>
  );
}
