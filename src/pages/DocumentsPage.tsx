import { useState, useMemo } from 'react';
import { DATA, STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, SearchInput, StatusBadge, Button, EmptyState } from '@/components/ui';
import { FolderOpen, Download, Upload, FileText } from 'lucide-react';

export default function DocumentsPage() {
  const { documents, projects } = DATA;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (search && !d.fileName.toLowerCase().includes(search.toLowerCase()) && !d.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (category && d.category !== category) return false;
      if (stateFilter) {
        const proj = projects.find((p) => p.id === d.projectId);
        if (!proj || proj.state !== stateFilter) return false;
      }
      return true;
    });
  }, [documents, search, category, stateFilter, projects]);

  return (
    <div>
      <PageHeader title="Document Management" subtitle="Centralized repository for project documents, land records, and government orders" actions={<Button size="sm" icon={Upload}>Upload Document</Button>} />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search document name or ID..." />
        <Select label="Category" value={category} onChange={setCategory} options={[
          'Project Proposal', 'DPR', 'Land Records', 'Survey Documents', 'Notifications', 'Awards', 'Compensation Documents', 'Possession Records', 'R&R Documents', 'Government Orders',
        ].map((c) => ({ value: c, label: c }))} />
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
      </FilterBar>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No documents found" message="No documents match the current filters." icon={FolderOpen} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Document ID', 'Category', 'File Name', 'Project', 'Uploaded By', 'Upload Date', 'Version', 'Size', 'Status', 'Actions'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.slice(0, 30).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-slate-600">{d.id}</td>
                    <td className="px-3 py-2 text-slate-600">{d.category}</td>
                    <td className="px-3 py-2 text-slate-700"><span className="inline-flex items-center gap-1"><FileText className="w-3 h-3" />{d.fileName}</span></td>
                    <td className="px-3 py-2 text-slate-600 max-w-[120px] truncate">{d.projectName}</td>
                    <td className="px-3 py-2 text-slate-600">{d.uploadedBy}</td>
                    <td className="px-3 py-2 text-slate-600">{d.uploadDate}</td>
                    <td className="px-3 py-2 text-slate-600">{d.version}</td>
                    <td className="px-3 py-2 text-slate-600">{d.size}</td>
                    <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button className="p-1 rounded hover:bg-blue-50 text-blue-600" title="View"><FileText className="w-3.5 h-3.5" /></button>
                        <button className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Download"><Download className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-2">Private files are not exposed publicly. Access is controlled via RBAC and audit logged.</p>
    </div>
  );
}
