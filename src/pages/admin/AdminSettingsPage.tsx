import { PageHeader, Card, StatusBadge, Button } from '@/components/ui';
import { Settings, Save, Server, Database, Map, Cpu, Bell, RefreshCw, HardDrive } from 'lucide-react';
import { useState } from 'react';

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div>
      <PageHeader title="System Settings" subtitle="Configure system-wide parameters" actions={<Button size="sm" icon={Save} onClick={handleSave}>{saved ? 'Saved!' : 'Save Settings'}</Button>} />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="General Configuration">
          <div className="space-y-3 text-sm">
            <div><label className="text-xs font-medium text-slate-600 block mb-1">System Name</label><input defaultValue="NLAMS" className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" /></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Department</label><input defaultValue="Public Works Department" className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" /></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">API Prefix</label><input defaultValue="/api/v1" className="w-full text-sm border border-slate-300 rounded px-3 py-1.5 font-mono" /></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Session Timeout (minutes)</label><input type="number" defaultValue={30} className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" /></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Max Retry Count (Sync)</label><input type="number" defaultValue={3} className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" /></div>
          </div>
        </Card>
        <Card title="Security Configuration">
          <div className="space-y-3 text-sm">
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Password Hashing</label><input defaultValue="bcrypt (cost factor 12)" className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" disabled /></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">JWT Access Token TTL</label><input defaultValue="15 minutes" className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" disabled /></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">JWT Refresh Token TTL</label><input defaultValue="7 days" className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" disabled /></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Rate Limiting</label><select className="w-full text-sm border border-slate-300 rounded px-3 py-1.5 bg-white"><option>100 requests/minute</option><option>500 requests/minute</option><option>1000 requests/minute</option></select></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">CORS Origins</label><input defaultValue="https://nlams.gov.in" className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" /></div>
          </div>
        </Card>
      </div>
      <Card title="API Integration Architecture (Mock)" className="mt-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            { name: 'Land Records API', desc: 'Parcel Verification', status: 'MOCK' },
            { name: 'GIS API', desc: 'Spatial Data', status: 'MOCK' },
            { name: 'Project Management API', desc: 'Project Information', status: 'MOCK' },
            { name: 'Payment/Treasury API', desc: 'Compensation Status', status: 'MOCK' },
            { name: 'Notification API', desc: 'Alerts', status: 'MOCK' },
            { name: 'Identity API', desc: 'Authentication', status: 'MOCK' },
          ].map((api) => (
            <div key={api.name} className="p-3 border border-slate-200 rounded">
              <p className="font-medium text-slate-700">{api.name}</p>
              <p className="text-slate-500">{api.desc}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-300 rounded text-[10px] font-medium">{api.status} / PROTOTYPE INTEGRATION</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
