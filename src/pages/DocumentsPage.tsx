import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { ApiService } from '@/services/apiService';
import { STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, SearchInput, StatusBadge, Button, EmptyState } from '@/components/ui';
import { FolderOpen, Download, Upload, FileText, Eye, CheckCircle2, X, Plus } from 'lucide-react';
import { exportToCsv } from '@/utils/exportUtils';
import { useForm } from 'react-hook-form';
import type { DocumentRecord, Project } from '@/types';

const CATEGORIES: DocumentRecord['category'][] = [
  'Project Proposal',
  'DPR',
  'Land Records',
  'Survey Documents',
  'Notifications',
  'Awards',
  'Compensation Documents',
  'Possession Records',
  'R&R Documents',
  'Government Orders',
];

interface UploadFormData {
  projectId: string;
  category: DocumentRecord['category'];
  fileName: string;
  version: string;
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  // Modals & Feedback
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UploadFormData>();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [docs, projs] = await Promise.all([
        ApiService.getDocuments(),
        ApiService.getProjects(),
      ]);
      setDocuments(docs);
      setProjects(projs);
    } catch (e) {
      console.error('Failed to load documents', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

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

  const handleUploadSubmit = async (data: UploadFormData) => {
    try {
      setUploading(true);
      const proj = projects.find((p) => p.id === data.projectId);
      const newDoc = await ApiService.uploadDocument({
        projectId: data.projectId,
        projectName: proj ? proj.name : 'Infrastructure Project',
        category: data.category,
        fileName: data.fileName.endsWith('.pdf') ? data.fileName : `${data.fileName}.pdf`,
        version: data.version || 'v1.0',
        size: `${(Math.random() * 3 + 1.2).toFixed(1)} MB`,
      });
      setShowUploadModal(false);
      reset();
      showToast(`Document '${newDoc.fileName}' uploaded & registered successfully!`);
      await loadData();
    } catch (e: any) {
      alert(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (doc: DocumentRecord) => {
    const dummyContent = `Government of India\nNational Land Acquisition & Management System (NLAMS)\nDocument ID: ${doc.id}\nProject: ${doc.projectName} (${doc.projectId})\nCategory: ${doc.category}\nFile: ${doc.fileName}\nUploaded By: ${doc.uploadedBy}\nDate: ${doc.uploadDate}\nStatus: ${doc.status}\n\nOfficial document digital record certified.`;
    const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloading '${doc.fileName}'...`);
  };

  const handleExportCsv = () => {
    exportToCsv(
      filtered,
      `NLAMS_Documents_Index_${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Document ID' },
        { key: 'category', label: 'Category' },
        { key: 'fileName', label: 'File Name' },
        { key: 'projectId', label: 'Project ID' },
        { key: 'projectName', label: 'Project Name' },
        { key: 'uploadedBy', label: 'Uploaded By' },
        { key: 'uploadDate', label: 'Upload Date' },
        { key: 'version', label: 'Version' },
        { key: 'size', label: 'Size' },
        { key: 'status', label: 'Status' },
      ]
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Document Management"
        subtitle="Centralized repository for project DPRs, cadastral land records, notifications, and government orders"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Download} onClick={handleExportCsv}>Export CSV</Button>
            <Button size="sm" icon={Upload} onClick={() => { reset(); setShowUploadModal(true); }}>
              Upload Document
            </Button>
          </div>
        }
      />

      {toastMessage && (
        <div className="p-3 bg-green-50 border border-green-300 rounded-lg text-sm text-green-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-green-600 hover:text-green-800"><X className="w-4 h-4" /></button>
        </div>
      )}

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search document name or ID..." />
        <Select
          label="Category"
          value={category}
          onChange={setCategory}
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
        <Select
          label="State"
          value={stateFilter}
          onChange={setStateFilter}
          options={STATES.map((s) => ({ value: s.name, label: s.name }))}
        />
      </FilterBar>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading document repository...</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No documents found" message="No documents match the current filters." icon={FolderOpen} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Document ID', 'Category', 'File Name', 'Project', 'Uploaded By', 'Upload Date', 'Version', 'Size', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 font-mono font-medium text-slate-700 whitespace-nowrap">{d.id}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{d.category}</td>
                    <td className="px-3 py-2 text-slate-800 font-medium max-w-[200px] truncate" title={d.fileName}>
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#1e3a5f] shrink-0" />
                        {d.fileName}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600 max-w-[140px] truncate" title={d.projectName}>
                      {d.projectId} · {d.projectName}
                    </td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{d.uploadedBy}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{d.uploadDate}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap font-mono">{d.version}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{d.size}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={d.status} /></td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreviewDoc(d)}
                          className="p-1 rounded hover:bg-blue-50 text-blue-600"
                          title="Preview Document Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownload(d)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-600"
                          title="Download Document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
              <h2 className="text-sm font-bold text-slate-800">Upload Project Document</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit(handleUploadSubmit)} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Associated Project *</label>
                <select {...register('projectId', { required: true })} className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white">
                  <option value="">Select Project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.id} — {p.name}</option>
                  ))}
                </select>
                {errors.projectId && <span className="text-[10px] text-red-600">Required</span>}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Document Category *</label>
                <select {...register('category', { required: true })} className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Document Title / File Name *</label>
                <input
                  {...register('fileName', { required: true })}
                  placeholder="e.g. Detailed_Project_Report_Final.pdf"
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2"
                />
                {errors.fileName && <span className="text-[10px] text-red-600">Required</span>}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Version</label>
                <input
                  {...register('version')}
                  defaultValue="v1.0"
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded border border-dashed border-slate-300 text-center">
                <FileText className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-xs text-slate-600 font-medium">Digital Signature & File Verification</p>
                <p className="text-[10px] text-slate-400">PDF, GeoJSON, DWG, SHP files supported (Max 25MB)</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="text-xs px-3 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="text-xs px-4 py-2 bg-[#1e3a5f] text-white rounded hover:bg-[#2a4a6f] font-medium shadow-sm"
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Details Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1e3a5f]" />
                <h3 className="text-sm font-bold text-slate-800">{previewDoc.id}</h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div><span className="text-slate-500">File Name:</span> <strong className="text-slate-800">{previewDoc.fileName}</strong></div>
              <div><span className="text-slate-500">Category:</span> <span className="text-slate-700">{previewDoc.category}</span></div>
              <div><span className="text-slate-500">Associated Project:</span> <span className="text-slate-700">{previewDoc.projectId} — {previewDoc.projectName}</span></div>
              <div><span className="text-slate-500">Uploaded By:</span> <span className="text-slate-700">{previewDoc.uploadedBy}</span></div>
              <div><span className="text-slate-500">Date:</span> <span className="text-slate-700">{previewDoc.uploadDate}</span></div>
              <div><span className="text-slate-500">Version:</span> <span className="font-mono text-slate-700">{previewDoc.version}</span></div>
              <div><span className="text-slate-500">File Size:</span> <span className="text-slate-700">{previewDoc.size}</span></div>
              <div><span className="text-slate-500">Verification Status:</span> <StatusBadge status={previewDoc.status} /></div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-3 py-1.5 border border-slate-300 text-xs rounded text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => { handleDownload(previewDoc); setPreviewDoc(null); }}
                className="px-4 py-1.5 bg-[#1e3a5f] text-white text-xs rounded font-medium hover:bg-[#2a4a6f]"
              >
                Download File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
