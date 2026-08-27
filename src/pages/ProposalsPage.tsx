import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { ApiService } from '@/services/apiService';
import { STATES, DISTRICTS } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, StatusBadge, Button, EmptyState } from '@/components/ui';
import {
  FileText, Plus, Upload, Eye, CheckCircle2, XCircle, Undo2,
  Download, Clock, AlertTriangle, Building2, UserCheck, Search, ChevronRight, X
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { exportToCsv } from '@/utils/exportUtils';
import type { Proposal, ProposalStatus, ProjectType } from '@/types';

interface ProposalFormData {
  projectName: string;
  department: string;
  agency: string;
  projectType: ProjectType;
  state: string;
  district: string;
  purpose: string;
  landRequired: number;
  estimatedCost: number;
  targetDate: string;
  dprAttached?: boolean;
  cadastralAttached?: boolean;
  siaAttached?: boolean;
}

export default function ProposalsPage() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState(user?.state || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'my' | 'sent_back'>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [actionType, setActionType] = useState<'verify' | 'approve' | 'send_back' | 'reject' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<ProposalFormData>();

  const loadProposals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiService.getProposals();
      setProposals(data);
    } catch (e) {
      console.error('Failed to load proposals', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Role helpers
  const isPwd = user?.role === 'pwd_agency';
  const isDistrict = user?.role === 'district_authority';
  const isState = user?.role === 'state_gov';
  const isAdminOrMinistry = user?.role === 'central_ministry' || user?.role === 'system_admin';

  // Filtered proposals
  const filtered = useMemo(() => {
    return proposals.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        const matchName = p.projectName.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        const matchAgency = p.agency.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchAgency) return false;
      }
      if (stateFilter && p.state !== stateFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;

      if (activeTab === 'pending') {
        if (isDistrict && !['SUBMITTED', 'UNDER_VERIFICATION'].includes(p.status)) return false;
        if (isState && !['UNDER_SCRUTINY', 'VERIFIED'].includes(p.status)) return false;
      }
      if (activeTab === 'my') {
        if (p.submittedByEmail && user?.email && p.submittedByEmail.toLowerCase() !== user.email.toLowerCase()) return false;
      }
      if (activeTab === 'sent_back') {
        if (p.status !== 'SENT_BACK') return false;
      }

      return true;
    });
  }, [proposals, search, stateFilter, statusFilter, activeTab, isDistrict, isState, user]);

  const selectedFormState = watch('state');
  const districtOptions = selectedFormState ? DISTRICTS[selectedFormState] || [] : [];

  // Submit new or edited proposal
  const onSaveProposal = async (data: ProposalFormData, isSubmit: boolean) => {
    try {
      setActionLoading(true);
      const docs = [];
      if (data.dprAttached) {
        docs.push({ id: `DOC-${Date.now()}-1`, name: `DPR_${data.projectName.replace(/\s+/g, '_')}.pdf`, type: 'DPR', size: '3.8 MB', uploadDate: new Date().toISOString().split('T')[0] });
      }
      if (data.cadastralAttached) {
        docs.push({ id: `DOC-${Date.now()}-2`, name: `Cadastral_Map_${data.district}.pdf`, type: 'Land Records', size: '2.1 MB', uploadDate: new Date().toISOString().split('T')[0] });
      }
      if (data.siaAttached) {
        docs.push({ id: `DOC-${Date.now()}-3`, name: `SIA_Preliminary_Report.pdf`, type: 'Survey Documents', size: '1.9 MB', uploadDate: new Date().toISOString().split('T')[0] });
      }

      if (editingProposal) {
        const updated = await ApiService.updateProposal(editingProposal.id, {
          projectName: data.projectName,
          department: data.department,
          agency: data.agency,
          projectType: data.projectType,
          state: data.state,
          district: data.district,
          landRequired: Number(data.landRequired),
          estimatedCost: Number(data.estimatedCost),
          purpose: data.purpose,
          targetDate: data.targetDate,
          isSubmit,
          documents: [...(editingProposal.documents || []), ...docs],
        });
        showToast(isSubmit ? `Proposal ${updated.id} resubmitted for District Verification!` : `Proposal ${updated.id} draft updated.`);
      } else {
        const created = await ApiService.createProposal({
          projectName: data.projectName,
          submittedBy: user?.name || 'PWD Officer',
          submittedByEmail: user?.email || 'pwd@nlams.gov.in',
          department: data.department,
          agency: data.agency,
          projectType: data.projectType,
          state: data.state,
          district: data.district,
          landRequired: Number(data.landRequired),
          estimatedCost: Number(data.estimatedCost),
          purpose: data.purpose,
          targetDate: data.targetDate,
          isSubmit,
          documents: docs,
        });
        showToast(isSubmit ? `Proposal ${created.id} submitted successfully to District Authority!` : `Proposal ${created.id} saved as draft.`);
      }

      setShowCreateModal(false);
      setEditingProposal(null);
      reset();
      await loadProposals();
    } catch (e: any) {
      alert(`Error saving proposal: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Perform workflow actions (Verify, Approve, Send Back, Reject)
  const handleWorkflowAction = async () => {
    if (!selectedProposal || !actionType) return;
    try {
      setActionLoading(true);
      if (actionType === 'verify') {
        await ApiService.verifyProposal(selectedProposal.id, actionNotes);
        showToast(`Proposal ${selectedProposal.id} verified and forwarded to State Government!`);
      } else if (actionType === 'approve') {
        await ApiService.approveProposal(selectedProposal.id, actionNotes);
        showToast(`Proposal ${selectedProposal.id} APPROVED! Land acquisition project initiated.`);
      } else if (actionType === 'send_back') {
        if (!actionReason.trim()) {
          alert('A mandatory reason is required to send back a proposal.');
          return;
        }
        await ApiService.sendBackProposal(selectedProposal.id, actionReason.trim());
        showToast(`Proposal ${selectedProposal.id} sent back to PWD with remarks.`);
      } else if (actionType === 'reject') {
        if (!actionReason.trim()) {
          alert('A mandatory rejection reason is required.');
          return;
        }
        await ApiService.rejectProposal(selectedProposal.id, actionReason.trim());
        showToast(`Proposal ${selectedProposal.id} rejected.`);
      }

      setActionType(null);
      setSelectedProposal(null);
      setActionReason('');
      setActionNotes('');
      await loadProposals();
    } catch (e: any) {
      alert(`Action failed: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (p: Proposal) => {
    setEditingProposal(p);
    setValue('projectName', p.projectName);
    setValue('department', p.department);
    setValue('agency', p.agency);
    setValue('projectType', p.projectType);
    setValue('state', p.state);
    setValue('district', p.district);
    setValue('landRequired', p.landRequired);
    setValue('estimatedCost', p.estimatedCost);
    setValue('purpose', p.purpose);
    setValue('targetDate', p.targetDate);
    setShowCreateModal(true);
  };

  const handleExportCsv = () => {
    exportToCsv(
      filtered,
      `NLAMS_Proposals_${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Proposal ID' },
        { key: 'projectName', label: 'Project Name' },
        { key: 'agency', label: 'Agency' },
        { key: 'department', label: 'Department' },
        { key: 'state', label: 'State' },
        { key: 'district', label: 'District' },
        { key: 'projectType', label: 'Project Type' },
        { key: 'landRequired', label: 'Land Required (ha)' },
        { key: 'estimatedCost', label: 'Estimated Cost (₹ Cr)' },
        { key: 'status', label: 'Status' },
        { key: 'assignedAuthority', label: 'Assigned Authority' },
        { key: 'createdDate', label: 'Created Date' },
      ]
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Land Acquisition Proposals"
        subtitle="End-to-end statutory workflow: Draft → District Verification → State Scrutiny → Administrative Approval"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Download} onClick={handleExportCsv}>Export CSV</Button>
            {isPwd && (
              <Button size="sm" icon={Plus} onClick={() => { setEditingProposal(null); reset(); setShowCreateModal(true); }}>
                New Acquisition Proposal
              </Button>
            )}
          </div>
        }
      />

      {successToast && (
        <div className="p-3 bg-green-50 border border-green-300 rounded-lg text-sm text-green-800 flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-green-600 hover:text-green-800"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Workflow Stage Stepper */}
      <Card className="bg-slate-50/50">
        <div className="flex items-center justify-between text-xs overflow-x-auto py-1">
          {[
            { label: '1. PWD Draft', sub: 'Create & Attach DPR' },
            { label: '2. Submitted', sub: 'Forward to District' },
            { label: '3. District Verification', sub: 'Cadastral Boundary Check' },
            { label: '4. State Scrutiny', sub: 'Financial & SIA Sanction' },
            { label: '5. Approved', sub: 'Land Acquisition Active' },
          ].map((s, i, arr) => (
            <div key={s.label} className="flex items-center flex-1 min-w-[140px]">
              <div className="flex flex-col items-center text-center w-full">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-[#1e3a5f] text-white' : i === 1 ? 'bg-blue-600 text-white' : i === 2 ? 'bg-amber-600 text-white' : i === 3 ? 'bg-purple-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  {i + 1}
                </div>
                <span className="mt-1 font-semibold text-slate-800 text-[11px]">{s.label}</span>
                <span className="text-[10px] text-slate-500">{s.sub}</span>
              </div>
              {i < arr.length - 1 && <div className="hidden md:block flex-1 h-0.5 bg-slate-300 mx-2 -mt-4" />}
            </div>
          ))}
        </div>
      </Card>

      {/* View Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'all' ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          All Proposals ({proposals.length})
        </button>
        {(isDistrict || isState) && (
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'pending' ? 'border-amber-600 text-amber-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Action Required / Pending Verification
            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {proposals.filter((p) => (isDistrict ? ['SUBMITTED', 'UNDER_VERIFICATION'].includes(p.status) : ['UNDER_SCRUTINY', 'VERIFIED'].includes(p.status))).length}
            </span>
          </button>
        )}
        {isPwd && (
          <>
            <button
              onClick={() => setActiveTab('my')}
              className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'my' ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              My Proposals
            </button>
            <button
              onClick={() => setActiveTab('sent_back')}
              className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1 ${
                activeTab === 'sent_back' ? 'border-red-600 text-red-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Sent Back / Requires Revision
              {proposals.filter((p) => p.status === 'SENT_BACK').length > 0 && (
                <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {proposals.filter((p) => p.status === 'SENT_BACK').length}
                </span>
              )}
            </button>
          </>
        )}
      </div>

      <FilterBar>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search proposal ID, project, agency..."
            className="w-full text-xs border border-slate-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select label="State" value={stateFilter} onChange={setStateFilter} options={STATES.map((s) => ({ value: s.name, label: s.name }))} />
        <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'DRAFT', label: 'Draft' },
          { value: 'SUBMITTED', label: 'Submitted' },
          { value: 'UNDER_SCRUTINY', label: 'Under Scrutiny' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'SENT_BACK', label: 'Sent Back' },
          { value: 'REJECTED', label: 'Rejected' },
        ]} />
      </FilterBar>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading acquisition proposals...</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No proposals found" message="No land acquisition proposals match the selected filters." icon={FileText} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Proposal ID', 'Project Name', 'Agency / Dept', 'State & District', 'Type', 'Land (ha)', 'Cost (₹ Cr)', 'Status', 'Assigned Authority', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const canVerify = isDistrict && ['SUBMITTED', 'UNDER_VERIFICATION'].includes(p.status);
                  const canApprove = isState && ['UNDER_SCRUTINY', 'VERIFIED'].includes(p.status);
                  const canEdit = isPwd && ['DRAFT', 'SENT_BACK'].includes(p.status);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5 font-mono font-medium text-slate-700 whitespace-nowrap">
                        {p.id}
                      </td>
                      <td className="px-3 py-2.5 text-slate-800 font-medium max-w-[200px]">
                        <div className="truncate" title={p.projectName}>{p.projectName}</div>
                        {p.status === 'SENT_BACK' && p.sendBackReason && (
                          <div className="text-[10px] text-red-600 truncate mt-0.5 bg-red-50 px-1 py-0.5 rounded border border-red-200">
                            Reason: {p.sendBackReason}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                        <div>{p.agency}</div>
                        <div className="text-[10px] text-slate-400">{p.department}</div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                        {p.state}, {p.district}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{p.projectType}</td>
                      <td className="px-3 py-2.5 text-slate-700 font-medium text-right whitespace-nowrap">{p.landRequired}</td>
                      <td className="px-3 py-2.5 text-slate-700 font-medium text-right whitespace-nowrap">₹{p.estimatedCost.toLocaleString()}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 max-w-[140px] truncate whitespace-nowrap" title={p.assignedAuthority}>
                        {p.assignedAuthority}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedProposal(p)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium inline-flex items-center gap-1"
                            title="View Proposal Details"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>

                          {canVerify && (
                            <button
                              onClick={() => { setSelectedProposal(p); setActionType('verify'); }}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[11px] font-medium inline-flex items-center gap-1"
                              title="Verify Proposal"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Verify
                            </button>
                          )}

                          {canApprove && (
                            <button
                              onClick={() => { setSelectedProposal(p); setActionType('approve'); }}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-medium inline-flex items-center gap-1"
                              title="Approve Proposal"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Approve
                            </button>
                          )}

                          {(canVerify || canApprove) && (
                            <>
                              <button
                                onClick={() => { setSelectedProposal(p); setActionType('send_back'); setActionReason(''); }}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-medium inline-flex items-center gap-1"
                                title="Send Back with Feedback"
                              >
                                <Undo2 className="w-3 h-3" /> Send Back
                              </button>
                              <button
                                onClick={() => { setSelectedProposal(p); setActionType('reject'); setActionReason(''); }}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-medium inline-flex items-center gap-1"
                                title="Reject Proposal"
                              >
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => openEditModal(p)}
                              className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded text-[11px] font-medium inline-flex items-center gap-1"
                            >
                              {p.status === 'SENT_BACK' ? 'Edit & Resubmit' : 'Edit Draft'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Details / Action Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setSelectedProposal(null); setActionType(null); }}>
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800 text-sm">{selectedProposal.id}</span>
                  <StatusBadge status={selectedProposal.status} />
                </div>
                <h2 className="text-base font-bold text-[#1e3a5f] mt-0.5">{selectedProposal.projectName}</h2>
              </div>
              <button onClick={() => { setSelectedProposal(null); setActionType(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Proposal Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div><span className="text-slate-500 block">Submitted By:</span> <strong className="text-slate-800">{selectedProposal.submittedBy}</strong></div>
                <div><span className="text-slate-500 block">Agency:</span> <strong className="text-slate-800">{selectedProposal.agency}</strong></div>
                <div><span className="text-slate-500 block">Department:</span> <strong className="text-slate-800">{selectedProposal.department}</strong></div>
                <div><span className="text-slate-500 block">State / District:</span> <strong className="text-slate-800">{selectedProposal.state}, {selectedProposal.district}</strong></div>
                <div><span className="text-slate-500 block">Land Requirement:</span> <strong className="text-slate-800">{selectedProposal.landRequired} ha</strong></div>
                <div><span className="text-slate-500 block">Estimated Cost:</span> <strong className="text-slate-800">₹{selectedProposal.estimatedCost.toLocaleString()} Cr</strong></div>
                <div><span className="text-slate-500 block">Target Completion:</span> <strong className="text-slate-800">{selectedProposal.targetDate}</strong></div>
                <div><span className="text-slate-500 block">Current Stage:</span> <strong className="text-slate-800">{selectedProposal.currentStage}</strong></div>
                <div><span className="text-slate-500 block">Assigned Authority:</span> <strong className="text-slate-800">{selectedProposal.assignedAuthority}</strong></div>
              </div>

              {/* Purpose & Justification */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Project Purpose & Public Interest</h4>
                <p className="text-xs text-slate-600 bg-white border border-slate-200 rounded p-3 leading-relaxed">
                  {selectedProposal.purpose || 'No description provided.'}
                </p>
              </div>

              {/* Reasons if Sent Back / Rejected */}
              {selectedProposal.sendBackReason && (
                <div className="p-3 bg-red-50 border border-red-300 rounded text-xs text-red-800">
                  <strong>Send Back Feedback from Reviewing Authority:</strong>
                  <p className="mt-1">{selectedProposal.sendBackReason}</p>
                </div>
              )}

              {selectedProposal.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-300 rounded text-xs text-red-800">
                  <strong>Rejection Reason:</strong>
                  <p className="mt-1">{selectedProposal.rejectionReason}</p>
                </div>
              )}

              {/* Attached Documents */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Attached Statutory Documents</h4>
                {selectedProposal.documents && selectedProposal.documents.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedProposal.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 border border-slate-200 rounded bg-slate-50 text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#1e3a5f]" />
                          <span className="font-medium text-slate-700">{doc.name}</span>
                          <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">{doc.type}</span>
                        </div>
                        <span className="text-slate-400">{doc.size}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No document attachments uploaded.</p>
                )}
              </div>

              {/* Chronological Workflow History */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Audit & Workflow Timeline</h4>
                <div className="border-l-2 border-slate-200 ml-2 pl-4 space-y-3">
                  {selectedProposal.timeline && selectedProposal.timeline.map((evt, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="w-2.5 h-2.5 bg-[#1e3a5f] rounded-full absolute -left-[21px] top-1" />
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{evt.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{evt.timestamp}</span>
                      </div>
                      <p className="text-slate-500 text-[11px]">By {evt.by} ({evt.role})</p>
                      {evt.notes && <p className="text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200 mt-1">{evt.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Form (if verifying, approving, sending back, or rejecting) */}
              {actionType && (
                <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-4 rounded-lg border">
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-800">
                    {actionType === 'verify' && 'Confirm District Verification'}
                    {actionType === 'approve' && 'Confirm State Administrative Sanction'}
                    {actionType === 'send_back' && 'Send Back Proposal for Clarification'}
                    {actionType === 'reject' && 'Reject Acquisition Proposal'}
                  </h4>

                  {(actionType === 'send_back' || actionType === 'reject') && (
                    <div className="mb-3">
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Reason for {actionType === 'send_back' ? 'Send Back' : 'Rejection'} *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="Provide detailed reasons and missing document requirements for the PWD engineer..."
                        className="w-full text-xs border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {(actionType === 'verify' || actionType === 'approve') && (
                    <div className="mb-3">
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Review Remarks / Sanction Notes (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder="Add administrative notes regarding boundary validation, SIA sanction, etc..."
                        className="w-full text-xs border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActionType(null)}
                      className="px-3 py-1.5 border border-slate-300 text-xs rounded text-slate-700 hover:bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleWorkflowAction}
                      className={`px-4 py-1.5 text-xs text-white rounded font-medium ${
                        actionType === 'verify' ? 'bg-green-600 hover:bg-green-700' :
                        actionType === 'approve' ? 'bg-blue-600 hover:bg-blue-700' :
                        actionType === 'send_back' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {actionLoading ? 'Processing...' : 'Confirm & Dispatch'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!actionType && (
              <div className="px-6 py-3 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setSelectedProposal(null)}
                  className="px-4 py-1.5 border border-slate-300 text-xs rounded text-slate-700 hover:bg-white"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New / Edit Proposal Form Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
              <h2 className="text-sm font-bold text-slate-800">
                {editingProposal ? `Edit Proposal (${editingProposal.id})` : 'New Land Acquisition Proposal'}
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form className="p-5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-600 block mb-1">Project Name *</label>
                  <input
                    {...register('projectName', { required: true })}
                    placeholder="e.g. Coimbatore Eastern Bypass Link Expressway"
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2"
                  />
                  {errors.projectName && <span className="text-[10px] text-red-600">Required</span>}
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Department *</label>
                  <input
                    {...register('department', { required: true })}
                    defaultValue="Infrastructure Planning Cell"
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Implementing Agency *</label>
                  <input
                    {...register('agency', { required: true })}
                    defaultValue="PWD Tamil Nadu"
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Project Type *</label>
                  <select {...register('projectType', { required: true })} className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white">
                    {['Highways', 'Railways', 'Irrigation', 'Industrial Corridor', 'Urban Development', 'Renewable Energy', 'Public Infrastructure', 'Other'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">State *</label>
                  <select {...register('state', { required: true })} className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white">
                    <option value="">Select State...</option>
                    {STATES.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">District *</label>
                  <select {...register('district', { required: true })} className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white" disabled={!selectedFormState}>
                    <option value="">Select District...</option>
                    {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Land Required (ha) *</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('landRequired', { required: true, min: 0.1 })}
                    placeholder="e.g. 85.5"
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Estimated Cost (₹ Cr) *</label>
                  <input
                    type="number"
                    step="1"
                    {...register('estimatedCost', { required: true, min: 1 })}
                    placeholder="e.g. 1500"
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Target Completion Date *</label>
                  <input
                    type="date"
                    {...register('targetDate', { required: true })}
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-600 block mb-1">Purpose & Land Acquisition Justification *</label>
                  <textarea
                    {...register('purpose', { required: true })}
                    rows={2}
                    placeholder="Provide details on corridor alignment, public benefit, affected villages, and land requirement statement..."
                    className="w-full text-xs border border-slate-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <label className="text-xs font-bold text-slate-700 block mb-2">Required Proposal Document Attachments</label>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('dprAttached')} defaultChecked className="rounded text-blue-600" />
                    <span>Attach Detailed Project Report (DPR_Final.pdf)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('cadastralAttached')} defaultChecked className="rounded text-blue-600" />
                    <span>Attach Cadastral Revenue Map & Boundary Survey Sheet</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('siaAttached')} className="rounded text-blue-600" />
                    <span>Attach Social Impact Assessment (SIA) Preliminary Matrix</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs px-3 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleSubmit((data) => onSaveProposal(data, false))}
                  className="text-xs px-3 py-2 bg-slate-100 text-slate-800 border border-slate-300 rounded hover:bg-slate-200 font-medium"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleSubmit((data) => onSaveProposal(data, true))}
                  className="text-xs px-4 py-2 bg-[#1e3a5f] text-white rounded hover:bg-[#2a4a6f] font-medium shadow-sm"
                >
                  {actionLoading ? 'Saving...' : 'Submit to District Authority'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
