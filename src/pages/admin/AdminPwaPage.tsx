import { PageHeader, Card, StatusBadge, Button } from '@/components/ui';
import { Smartphone, Download, Wifi, Database, HardDrive } from 'lucide-react';

export default function AdminPwaPage() {
  return (
    <div>
      <PageHeader title="PWA Configuration" subtitle="Progressive Web App settings and offline support configuration" />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="App Manifest">
          <div className="space-y-3 text-sm">
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Application Name</label><input defaultValue="NLAMS" className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" /></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Short Name</label><input defaultValue="NLAMS" className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" /></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Display Mode</label><select className="w-full text-sm border border-slate-300 rounded px-3 py-1.5 bg-white"><option>standalone</option><option>fullscreen</option><option>minimal-ui</option></select></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Theme Color</label><input defaultValue="#1e3a5f" className="w-full text-sm border border-slate-300 rounded px-3 py-1.5 font-mono" /></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Background Color</label><input defaultValue="#f1f5f9" className="w-full text-sm border border-slate-300 rounded px-3 py-1.5 font-mono" /></div>
          </div>
        </Card>
        <Card title="Offline & Cache Settings">
          <div className="space-y-3 text-sm">
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Service Worker</label><div className="flex items-center gap-2"><StatusBadge status="Active" /><span className="text-xs text-slate-500">v1.0.0</span></div></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">IndexedDB Storage</label><div className="flex items-center gap-2"><StatusBadge status="Active" /><span className="text-xs text-slate-500">Dexie.js</span></div></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Cache Strategy</label><select className="w-full text-sm border border-slate-300 rounded px-3 py-1.5 bg-white"><option>Stale-While-Revalidate</option><option>Cache-First</option><option>Network-First</option></select></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Max Cache Size (MB)</label><input type="number" defaultValue={50} className="w-full text-sm border border-slate-300 rounded px-3 py-1.5" /></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Offline Fallback Page</label><input defaultValue="/offline" className="w-full text-sm border border-slate-300 rounded px-3 py-1.5 font-mono" /></div>
          </div>
        </Card>
      </div>
      <Card title="Cached Data Categories" className="mt-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            { name: 'Application Shell', cached: true, icon: Smartphone },
            { name: 'Recently Viewed Projects', cached: true, icon: HardDrive },
            { name: 'Recently Viewed Parcels', cached: true, icon: HardDrive },
            { name: 'Last Dashboard Sync', cached: true, icon: Database },
            { name: 'Reference Data', cached: true, icon: Database },
            { name: 'Saved Drafts', cached: true, icon: HardDrive },
            { name: 'Authorized Alerts', cached: true, icon: Wifi },
            { name: 'Passwords / Secrets', cached: false, icon: HardDrive },
            { name: 'Sensitive Personal Data', cached: false, icon: HardDrive },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.name} className={`p-3 border rounded ${item.cached ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${item.cached ? 'text-green-600' : 'text-red-600'}`} />
                  <span className="font-medium text-slate-700">{item.name}</span>
                </div>
                <p className={`mt-1 text-[10px] ${item.cached ? 'text-green-700' : 'text-red-700'}`}>{item.cached ? 'Cached for offline use' : 'Never cached (security)'}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
