/**
 * NLAMS (National Land Acquisition Management System) - API Service Client
 * Connects frontend to the Python Backend API (http://localhost:8000/api)
 * with robust state persistence and local fallback.
 */

import { DATA, DEMO_USERS, predictRisk as localPredictRisk } from '@/data/mockData';
import type {
  Project,
  LandParcel,
  Notification,
  Award,
  CompensationRecord,
  AffectedFamily,
  Milestone,
  Alert,
  AuditLog,
  WorkflowTask,
  DocumentRecord,
  User,
  RiskPrediction,
  RiskPredictionInput,
  Proposal,
  SystemNotification,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Helper to get active user info
function getActorHeaders(): Record<string, string> {
  try {
    const stored = sessionStorage.getItem('nlams_user');
    if (stored) {
      const u = JSON.parse(stored);
      return {
        'X-User-Name': u.name || 'Officer',
        'X-User-Role': u.role || 'pwd_agency',
      };
    }
  } catch (e) {
    // ignore
  }
  return {
    'X-User-Name': 'Authorized Officer',
    'X-User-Role': 'pwd_agency',
  };
}

async function fetchFromApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...getActorHeaders(),
      ...(options?.headers || {}),
    };
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    console.debug(`Backend API (${endpoint}) unreachable, using local fallback state.`);
    return null;
  }
}

// Local mock storage keys
const STORAGE_PROPOSALS_KEY = 'nlams_proposals_store';
const STORAGE_NOTIFS_KEY = 'nlams_notifs_store';
const STORAGE_PROJECTS_KEY = 'nlams_projects_store';
const STORAGE_DOCS_KEY = 'nlams_docs_store';
const STORAGE_AUDIT_KEY = 'nlams_audit_store';

function getLocalProposals(): Proposal[] {
  const s = localStorage.getItem(STORAGE_PROPOSALS_KEY);
  if (s) {
    try { return JSON.parse(s); } catch (e) { /* ignore */ }
  }
  const initProposals: Proposal[] = [
    {
      id: 'NLAMS-PROP-2026-001',
      projectName: 'Salem-Coimbatore Industrial Freight Corridor Link',
      submittedBy: 'Kavya Krishnan',
      submittedByEmail: 'pwd@nlams.gov.in',
      department: 'Infrastructure Engineering Cell',
      agency: 'PWD Tamil Nadu',
      projectType: 'Industrial Corridor',
      state: 'Tamil Nadu',
      district: 'Coimbatore',
      landRequired: 75.5,
      estimatedCost: 2850.0,
      purpose: 'Four-lane dedicated logistics connector linking upcoming defense industrial hub to national highway network across 3 revenue villages.',
      targetDate: '2028-11-30',
      documents: [
        { id: 'DOC-P001', name: 'DPR_Salem_Coimbatore_Link.pdf', type: 'DPR', size: '4.2 MB', uploadDate: '2026-08-20' },
        { id: 'DOC-P002', name: 'Cadastral_Map_Sheet_142.pdf', type: 'Land Records', size: '2.8 MB', uploadDate: '2026-08-20' },
      ],
      createdDate: '2026-08-20',
      updatedDate: '2026-08-21',
      status: 'SUBMITTED',
      currentStage: 'Scrutiny',
      assignedAuthority: 'District Collector & Magistrate',
      assignedRole: 'district_authority',
      remarks: 'Submitted for revenue boundary verification and preliminary SIA sanction.',
      timeline: [
        { action: 'Proposal Created', by: 'Kavya Krishnan', role: 'PWD Agency', timestamp: '2026-08-20 10:15', notes: 'Draft proposal initialized with DPR.' },
        { action: 'Proposal Submitted', by: 'Kavya Krishnan', role: 'PWD Agency', timestamp: '2026-08-21 14:30', notes: 'Formal submission forwarded to District Authority Coimbatore.' },
      ],
    },
    {
      id: 'NLAMS-PROP-2026-002',
      projectName: 'Tirunelveli Outer Ring Bypass Phase 2',
      submittedBy: 'Kavya Krishnan',
      submittedByEmail: 'pwd@nlams.gov.in',
      department: 'Highways & Infrastructure',
      agency: 'PWD Tamil Nadu',
      projectType: 'Highways',
      state: 'Tamil Nadu',
      district: 'Tirunelveli',
      landRequired: 120.0,
      estimatedCost: 4500.0,
      purpose: 'Bypass highway corridor to relieve traffic congestion through Tirunelveli urban area.',
      targetDate: '2029-03-31',
      documents: [{ id: 'DOC-P003', name: 'Tirunelveli_Bypass_Feasibility.pdf', type: 'Project Proposal', size: '3.1 MB', uploadDate: '2026-08-18' }],
      createdDate: '2026-08-18',
      updatedDate: '2026-08-25',
      status: 'UNDER_SCRUTINY',
      currentStage: 'Approval',
      assignedAuthority: 'State Project Director (PWD)',
      assignedRole: 'state_gov',
      remarks: 'District verification completed. Revenue records authenticated.',
      timeline: [
        { action: 'Proposal Created', by: 'Kavya Krishnan', role: 'PWD Agency', timestamp: '2026-08-18 09:30' },
        { action: 'Proposal Submitted', by: 'Kavya Krishnan', role: 'PWD Agency', timestamp: '2026-08-19 11:20' },
        { action: 'Proposal Verified', by: 'Ramesh Iyer', role: 'District Authority', timestamp: '2026-08-25 16:45', notes: 'Cadastral field survey and joint revenue inspection completed without boundary disputes. Forwarded for State Approval.' },
      ],
    },
    {
      id: 'NLAMS-PROP-2026-003',
      projectName: 'Madurai Urban Elevated Transit Link',
      submittedBy: 'Kavya Krishnan',
      submittedByEmail: 'pwd@nlams.gov.in',
      department: 'Urban Transport Division',
      agency: 'PWD Tamil Nadu',
      projectType: 'Urban Development',
      state: 'Tamil Nadu',
      district: 'Madurai',
      landRequired: 35.0,
      estimatedCost: 1800.0,
      purpose: 'Elevated rapid transit corridor across congested market intersections.',
      targetDate: '2028-06-30',
      documents: [],
      createdDate: '2026-08-22',
      updatedDate: '2026-08-23',
      status: 'SENT_BACK',
      currentStage: 'Proposal',
      assignedAuthority: 'Superintending Engineer (PWD)',
      assignedRole: 'pwd_agency',
      sendBackReason: 'Land ownership survey in Ward 14 lacks sub-division survey patta numbers. Please attach updated village revenue extract.',
      remarks: 'Requires resubmission with updated land registry extract.',
      timeline: [
        { action: 'Proposal Created', by: 'Kavya Krishnan', role: 'PWD Agency', timestamp: '2026-08-22 11:00' },
        { action: 'Proposal Submitted', by: 'Kavya Krishnan', role: 'PWD Agency', timestamp: '2026-08-22 15:40' },
        { action: 'Proposal Sent Back', by: 'Ramesh Iyer', role: 'District Authority', timestamp: '2026-08-23 10:15', notes: 'Land ownership survey in Ward 14 lacks sub-division survey patta numbers. Please attach updated village revenue extract.' },
      ],
    },
  ];
  localStorage.setItem(STORAGE_PROPOSALS_KEY, JSON.stringify(initProposals));
  return initProposals;
}

function saveLocalProposals(list: Proposal[]) {
  localStorage.setItem(STORAGE_PROPOSALS_KEY, JSON.stringify(list));
}

function getLocalSystemNotifs(): SystemNotification[] {
  const s = localStorage.getItem(STORAGE_NOTIFS_KEY);
  if (s) {
    try { return JSON.parse(s); } catch (e) { /* ignore */ }
  }
  const initNotifs: SystemNotification[] = [
    {
      id: 'SYS-NOTIF-001',
      title: 'New Proposal Action Required',
      message: "Proposal NLAMS-PROP-2026-001 (Salem-Coimbatore Link) submitted by PWD Tamil Nadu requires District Authority verification.",
      type: 'warning',
      recipientRole: 'district_authority',
      targetModule: 'proposals',
      targetId: 'NLAMS-PROP-2026-001',
      isRead: false,
      timestamp: '2026-08-21 14:30',
    },
    {
      id: 'SYS-NOTIF-002',
      title: 'Proposal Verified - Scrutiny Required',
      message: 'Proposal NLAMS-PROP-2026-002 (Tirunelveli Outer Ring) verified by District Authority. Awaiting State Government approval.',
      type: 'info',
      recipientRole: 'state_gov',
      targetModule: 'proposals',
      targetId: 'NLAMS-PROP-2026-002',
      isRead: false,
      timestamp: '2026-08-25 16:45',
    },
    {
      id: 'SYS-NOTIF-003',
      title: 'Proposal Sent Back for Clarification',
      message: "Proposal NLAMS-PROP-2026-003 was sent back by District Authority: 'Land ownership survey in Ward 14 lacks sub-division survey patta numbers.'",
      type: 'error',
      recipientRole: 'pwd_agency',
      recipientEmail: 'pwd@nlams.gov.in',
      targetModule: 'proposals',
      targetId: 'NLAMS-PROP-2026-003',
      isRead: false,
      timestamp: '2026-08-23 10:15',
    },
    {
      id: 'SYS-NOTIF-004',
      title: 'Compensation Disbursement Pending',
      message: 'Project PRJ-003 has pending compensation disbursements of ₹588.67 Cr. Please review beneficiary list.',
      type: 'warning',
      recipientRole: 'land_acquisition_officer',
      targetModule: 'compensation',
      targetId: 'PRJ-003',
      isRead: true,
      timestamp: '2026-08-26 09:15',
    },
  ];
  localStorage.setItem(STORAGE_NOTIFS_KEY, JSON.stringify(initNotifs));
  return initNotifs;
}

function saveLocalSystemNotifs(notifs: SystemNotification[]) {
  localStorage.setItem(STORAGE_NOTIFS_KEY, JSON.stringify(notifs));
}

function addLocalAudit(action: string, module: string, recordId: string, description: string) {
  try {
    const stored = sessionStorage.getItem('nlams_user');
    const u = stored ? JSON.parse(stored) : { name: 'Authorized Officer', role: 'pwd_agency' };
    const s = localStorage.getItem(STORAGE_AUDIT_KEY);
    const list: AuditLog[] = s ? JSON.parse(s) : [...DATA.audit];
    const logId = `AUD-${(list.length + 1).toString().padStart(5, '0')}`;
    const now = new Date();
    const ts = `${now.getDate().toString().padStart(2, '0')}-${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()]}-${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    list.unshift({
      id: logId,
      timestamp: ts,
      user: u.name,
      role: u.role,
      module,
      action: action as any,
      recordId,
      description,
      origin: 'ONLINE',
      syncTimestamp: null,
    });
    localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(list));
  } catch (e) {
    // ignore
  }
}

export const ApiService = {
  // System Health
  async checkHealth(): Promise<{ status: string; dataset_projects?: number } | null> {
    return fetchFromApi<{ status: string; dataset_projects?: number }>('/health');
  },

  // Executive Analytics
  async getAnalytics(): Promise<any> {
    const apiData = await fetchFromApi<any>('/analytics');
    if (apiData) return apiData;

    const projects = await this.getProjects();
    const proposals = await this.getProposals();
    const totalLandReq = projects.reduce((sum, p) => sum + p.landRequired, 0);
    const totalLandAcq = projects.reduce((sum, p) => sum + p.landAcquired, 0);
    const totalCost = projects.reduce((sum, p) => sum + p.estimatedCost, 0);
    const totalAssessed = projects.reduce((sum, p) => sum + p.compensationAssessed, 0);
    const totalDisbursed = projects.reduce((sum, p) => sum + p.compensationDisbursed, 0);

    return {
      totalProjects: projects.length,
      totalProposals: proposals.length,
      pendingProposalsCount: proposals.filter((p) => ['SUBMITTED', 'UNDER_VERIFICATION', 'UNDER_SCRUTINY'].includes(p.status)).length,
      totalLandRequired: totalLandReq,
      totalLandAcquired: totalLandAcq,
      overallAcquisitionPct: Math.round((totalLandAcq / (totalLandReq || 1)) * 100),
      totalEstimatedCost: totalCost,
      totalCompensationAssessed: totalAssessed,
      totalCompensationDisbursed: totalDisbursed,
      compensationDisbursementPct: Math.round((totalDisbursed / (totalAssessed || 1)) * 100),
      totalAffectedFamilies: projects.reduce((s, p) => s + p.affectedFamilies, 0),
      totalDisplacedFamilies: projects.reduce((s, p) => s + p.displacedFamilies, 0),
      alertsCount: DATA.alerts.length,
      pendingTasksCount: DATA.workflow.filter((w) => w.status === 'Pending').length,
    };
  },

  // =========================================================================
  // Proposals API
  // =========================================================================
  async getProposals(filters?: {
    status?: string;
    role?: string;
    userEmail?: string;
    state?: string;
    district?: string;
    search?: string;
  }): Promise<Proposal[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.role) params.set('role', filters.role);
    if (filters?.userEmail) params.set('userEmail', filters.userEmail);
    if (filters?.state) params.set('state', filters.state);
    if (filters?.district) params.set('district', filters.district);
    if (filters?.search) params.set('search', filters.search);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const apiData = await fetchFromApi<Proposal[]>(`/proposals${queryStr}`);
    if (apiData) return apiData;

    // Fallback: local filtering
    let list = getLocalProposals();
    if (filters?.status) list = list.filter((p) => p.status.toUpperCase() === filters.status?.toUpperCase());
    if (filters?.state) list = list.filter((p) => p.state.toLowerCase() === filters.state?.toLowerCase());
    if (filters?.district) list = list.filter((p) => p.district.toLowerCase() === filters.district?.toLowerCase());
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((p) => p.projectName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.agency.toLowerCase().includes(q));
    }
    return list;
  },

  async getProposalById(id: string): Promise<Proposal | null> {
    const apiData = await fetchFromApi<Proposal>(`/proposals/${id}`);
    if (apiData) return apiData;
    const list = getLocalProposals();
    return list.find((p) => p.id === id) || null;
  },

  async createProposal(data: Partial<Proposal> & { isSubmit?: boolean }): Promise<Proposal> {
    const apiData = await fetchFromApi<Proposal>('/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (apiData) return apiData;

    // Fallback local creation
    const list = getLocalProposals();
    const nextNum = list.length + 1;
    const propId = `NLAMS-PROP-2026-${nextNum.toString().padStart(3, '0')}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const tsStr = `${dateStr} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const isSub = Boolean(data.isSubmit);
    const newProp: Proposal = {
      id: propId,
      projectName: data.projectName || 'New Highway Proposal',
      submittedBy: data.submittedBy || 'PWD Officer',
      submittedByEmail: data.submittedByEmail || 'pwd@nlams.gov.in',
      department: data.department || 'Infrastructure Cell',
      agency: data.agency || 'PWD',
      projectType: data.projectType || 'Highways',
      state: data.state || 'Tamil Nadu',
      district: data.district || 'Coimbatore',
      landRequired: Number(data.landRequired || 10),
      estimatedCost: Number(data.estimatedCost || 100),
      purpose: data.purpose || '',
      targetDate: data.targetDate || '2028-12-31',
      documents: data.documents || [],
      createdDate: dateStr,
      updatedDate: dateStr,
      status: isSub ? 'SUBMITTED' : 'DRAFT',
      currentStage: isSub ? 'Scrutiny' : 'Proposal',
      assignedAuthority: isSub ? 'District Collector & Magistrate' : 'Superintending Engineer (PWD)',
      assignedRole: isSub ? 'district_authority' : 'pwd_agency',
      timeline: [
        { action: 'Proposal Created', by: data.submittedBy || 'PWD Officer', role: 'PWD Agency', timestamp: tsStr },
      ],
    };

    if (isSub) {
      newProp.timeline.push({
        action: 'Proposal Submitted',
        by: data.submittedBy || 'PWD Officer',
        role: 'PWD Agency',
        timestamp: tsStr,
        notes: 'Submitted for District verification.',
      });
      // Add notification
      const notifs = getLocalSystemNotifs();
      notifs.unshift({
        id: `SYS-NOTIF-${(notifs.length + 1).toString().padStart(3, '0')}`,
        title: 'New Proposal Submitted',
        message: `Proposal ${propId} (${newProp.projectName}) submitted for verification.`,
        type: 'warning',
        recipientRole: 'district_authority',
        targetModule: 'proposals',
        targetId: propId,
        isRead: false,
        timestamp: tsStr,
      });
      saveLocalSystemNotifs(notifs);
      addLocalAudit('SUBMIT', 'Proposals', propId, `Submitted proposal ${propId}`);
    } else {
      addLocalAudit('CREATE', 'Proposals', propId, `Created draft proposal ${propId}`);
    }

    list.unshift(newProp);
    saveLocalProposals(list);
    return newProp;
  },

  async updateProposal(id: string, data: Partial<Proposal> & { isSubmit?: boolean }): Promise<Proposal> {
    const apiData = await fetchFromApi<Proposal>(`/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (apiData) return apiData;

    const list = getLocalProposals();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Proposal not found');

    const now = new Date();
    const tsStr = `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const p = list[idx];

    Object.assign(p, data, { updatedDate: now.toISOString().split('T')[0] });

    if (data.isSubmit) {
      p.status = 'SUBMITTED';
      p.currentStage = 'Scrutiny';
      p.assignedAuthority = 'District Collector & Magistrate';
      p.assignedRole = 'district_authority';
      p.sendBackReason = undefined;
      p.timeline.push({
        action: 'Proposal Resubmitted',
        by: p.submittedBy,
        role: 'PWD Agency',
        timestamp: tsStr,
        notes: 'Resubmitted with revisions.',
      });
      addLocalAudit('SUBMIT', 'Proposals', id, `Resubmitted proposal ${id}`);
    } else {
      p.timeline.push({
        action: 'Proposal Updated',
        by: p.submittedBy,
        role: 'PWD Agency',
        timestamp: tsStr,
      });
      addLocalAudit('UPDATE', 'Proposals', id, `Updated proposal ${id}`);
    }

    saveLocalProposals(list);
    return p;
  },

  async submitProposal(id: string, notes?: string): Promise<Proposal> {
    const apiData = await fetchFromApi<Proposal>(`/proposals/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    if (apiData) return apiData;

    return this.updateProposal(id, { isSubmit: true });
  },

  async verifyProposal(id: string, notes?: string): Promise<Proposal> {
    const apiData = await fetchFromApi<Proposal>(`/proposals/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    if (apiData) return apiData;

    const list = getLocalProposals();
    const p = list.find((item) => item.id === id);
    if (!p) throw new Error('Proposal not found');

    const now = new Date();
    const tsStr = `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    p.status = 'UNDER_SCRUTINY';
    p.currentStage = 'Approval';
    p.assignedAuthority = 'State Project Director (PWD)';
    p.assignedRole = 'state_gov';
    p.updatedDate = now.toISOString().split('T')[0];
    p.timeline.push({
      action: 'Proposal Verified',
      by: 'District Collector',
      role: 'District Authority',
      timestamp: tsStr,
      notes: notes || 'Verified field revenue boundaries.',
    });

    const notifs = getLocalSystemNotifs();
    notifs.unshift({
      id: `SYS-NOTIF-${(notifs.length + 1).toString().padStart(3, '0')}`,
      title: 'Proposal Verified – Action Required',
      message: `Proposal ${id} (${p.projectName}) verified by District Authority. Awaiting State Approval.`,
      type: 'info',
      recipientRole: 'state_gov',
      targetModule: 'proposals',
      targetId: id,
      isRead: false,
      timestamp: tsStr,
    });
    saveLocalSystemNotifs(notifs);
    addLocalAudit('VERIFY', 'Proposals', id, `District Authority verified proposal ${id}`);

    saveLocalProposals(list);
    return p;
  },

  async sendBackProposal(id: string, reason: string): Promise<Proposal> {
    const apiData = await fetchFromApi<Proposal>(`/proposals/${id}/send-back`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    if (apiData) return apiData;

    const list = getLocalProposals();
    const p = list.find((item) => item.id === id);
    if (!p) throw new Error('Proposal not found');

    const now = new Date();
    const tsStr = `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    p.status = 'SENT_BACK';
    p.currentStage = 'Proposal';
    p.assignedAuthority = 'Superintending Engineer (PWD)';
    p.assignedRole = 'pwd_agency';
    p.sendBackReason = reason;
    p.updatedDate = now.toISOString().split('T')[0];
    p.timeline.push({
      action: 'Proposal Sent Back',
      by: 'Authority Reviewer',
      role: 'Review Authority',
      timestamp: tsStr,
      notes: reason,
    });

    const notifs = getLocalSystemNotifs();
    notifs.unshift({
      id: `SYS-NOTIF-${(notifs.length + 1).toString().padStart(3, '0')}`,
      title: 'Proposal Sent Back for Clarification',
      message: `Proposal ${id} was sent back: '${reason}'`,
      type: 'error',
      recipientRole: 'pwd_agency',
      recipientEmail: p.submittedByEmail,
      targetModule: 'proposals',
      targetId: id,
      isRead: false,
      timestamp: tsStr,
    });
    saveLocalSystemNotifs(notifs);
    addLocalAudit('SEND_BACK', 'Proposals', id, `Sent back proposal ${id}: ${reason}`);

    saveLocalProposals(list);
    return p;
  },

  async rejectProposal(id: string, reason: string): Promise<Proposal> {
    const apiData = await fetchFromApi<Proposal>(`/proposals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    if (apiData) return apiData;

    const list = getLocalProposals();
    const p = list.find((item) => item.id === id);
    if (!p) throw new Error('Proposal not found');

    const now = new Date();
    const tsStr = `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    p.status = 'REJECTED';
    p.rejectionReason = reason;
    p.updatedDate = now.toISOString().split('T')[0];
    p.timeline.push({
      action: 'Proposal Rejected',
      by: 'Authority Reviewer',
      role: 'Review Authority',
      timestamp: tsStr,
      notes: reason,
    });

    const notifs = getLocalSystemNotifs();
    notifs.unshift({
      id: `SYS-NOTIF-${(notifs.length + 1).toString().padStart(3, '0')}`,
      title: 'Proposal Rejected',
      message: `Proposal ${id} (${p.projectName}) was rejected: '${reason}'`,
      type: 'error',
      recipientRole: 'pwd_agency',
      recipientEmail: p.submittedByEmail,
      targetModule: 'proposals',
      targetId: id,
      isRead: false,
      timestamp: tsStr,
    });
    saveLocalSystemNotifs(notifs);
    addLocalAudit('REJECT', 'Proposals', id, `Rejected proposal ${id}: ${reason}`);

    saveLocalProposals(list);
    return p;
  },

  async approveProposal(id: string, notes?: string): Promise<Proposal> {
    const apiData = await fetchFromApi<Proposal>(`/proposals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    if (apiData) return apiData;

    const list = getLocalProposals();
    const p = list.find((item) => item.id === id);
    if (!p) throw new Error('Proposal not found');

    const now = new Date();
    const tsStr = `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    p.status = 'APPROVED';
    p.currentStage = 'Notification';
    p.updatedDate = now.toISOString().split('T')[0];
    p.timeline.push({
      action: 'Proposal Approved',
      by: 'State Secretary',
      role: 'State Government',
      timestamp: tsStr,
      notes: notes || 'Administrative approval & financial sanction granted.',
    });

    // Create Project
    const projects = await this.getProjects();
    const nextProjId = `PRJ-${(projects.length + 1).toString().padStart(3, '0')}`;
    const newProject: Project = {
      id: nextProjId,
      name: p.projectName,
      agency: p.agency,
      state: p.state,
      district: p.district,
      type: p.projectType,
      landRequired: p.landRequired,
      landAcquired: 0,
      landNotified: p.landRequired,
      acquisitionPct: 0,
      compensationPct: 0,
      possessionPct: 0,
      rrPct: 0,
      status: 'Notification Issued',
      stage: 'Notification',
      targetDate: p.targetDate,
      estimatedCost: p.estimatedCost,
      risk: 'LOW',
      riskScore: 20,
      lastUpdated: tsStr,
      description: p.purpose,
      parcels: [],
      affectedFamilies: Math.max(10, Math.round(p.landRequired * 2.5)),
      displacedFamilies: Math.round(p.landRequired * 0.8),
      compensationAssessed: Math.round(p.estimatedCost * 0.25),
      compensationDisbursed: 0,
    };
    p.projectId = nextProjId;

    const storedProjects = localStorage.getItem(STORAGE_PROJECTS_KEY);
    const pList: Project[] = storedProjects ? JSON.parse(storedProjects) : [...DATA.projects];
    pList.unshift(newProject);
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(pList));

    const notifs = getLocalSystemNotifs();
    notifs.unshift({
      id: `SYS-NOTIF-${(notifs.length + 1).toString().padStart(3, '0')}`,
      title: 'Proposal Approved – Project Created',
      message: `Proposal ${id} approved by State Government. Project ${nextProjId} created for Land Acquisition.`,
      type: 'success',
      recipientRole: 'pwd_agency',
      recipientEmail: p.submittedByEmail,
      targetModule: 'projects',
      targetId: nextProjId,
      isRead: false,
      timestamp: tsStr,
    });
    saveLocalSystemNotifs(notifs);
    addLocalAudit('APPROVE', 'Proposals', id, `Approved proposal ${id}, created project ${nextProjId}`);

    saveLocalProposals(list);
    return p;
  },

  // =========================================================================
  // Projects API
  // =========================================================================
  async getProjects(filters?: {
    state?: string;
    district?: string;
    type?: string;
    stage?: string;
    status?: string;
    risk?: string;
    search?: string;
  }): Promise<Project[]> {
    const params = new URLSearchParams();
    if (filters?.state) params.set('state', filters.state);
    if (filters?.district) params.set('district', filters.district);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.stage) params.set('stage', filters.stage);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.risk) params.set('risk', filters.risk);
    if (filters?.search) params.set('search', filters.search);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const apiData = await fetchFromApi<Project[]>(`/projects${queryStr}`);
    if (apiData) return apiData;

    const stored = localStorage.getItem(STORAGE_PROJECTS_KEY);
    let list: Project[] = stored ? JSON.parse(stored) : [...DATA.projects];

    if (filters?.state) list = list.filter((p) => p.state.toLowerCase() === filters.state?.toLowerCase());
    if (filters?.district) list = list.filter((p) => p.district.toLowerCase() === filters.district?.toLowerCase());
    if (filters?.type) list = list.filter((p) => p.type.toLowerCase() === filters.type?.toLowerCase());
    if (filters?.stage) list = list.filter((p) => p.stage.toLowerCase() === filters.stage?.toLowerCase());
    if (filters?.status) list = list.filter((p) => p.status.toLowerCase() === filters.status?.toLowerCase());
    if (filters?.risk) list = list.filter((p) => p.risk.toUpperCase() === filters.risk?.toUpperCase());
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
    }
    return list;
  },

  async getProjectById(projectId: string): Promise<Project | null> {
    const apiData = await fetchFromApi<Project>(`/projects/${projectId}`);
    if (apiData) return apiData;
    const list = await this.getProjects();
    return list.find((p) => p.id === projectId) || null;
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const apiData = await fetchFromApi<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (apiData) return apiData;

    const list = await this.getProjects();
    const nextNum = list.length + 1;
    const projId = data.id || `PRJ-${nextNum.toString().padStart(3, '0')}`;
    const now = new Date();
    const tsStr = `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const landReq = Number(data.landRequired || 50);
    const landAcq = Number(data.landAcquired || 0);

    const newProject: Project = {
      id: projId,
      name: data.name || 'New Infrastructure Project',
      agency: data.agency || 'PWD',
      state: data.state || 'Tamil Nadu',
      district: data.district || 'Coimbatore',
      type: data.type || 'Highways',
      landRequired: landReq,
      landAcquired: landAcq,
      landNotified: Number(data.landNotified || landReq),
      acquisitionPct: Math.round((landAcq / (landReq || 1)) * 100),
      compensationPct: Number(data.compensationPct || 0),
      possessionPct: Number(data.possessionPct || 0),
      rrPct: Number(data.rrPct || 0),
      status: data.status || 'Submitted',
      stage: data.stage || 'Proposal',
      targetDate: data.targetDate || '2028-12-31',
      estimatedCost: Number(data.estimatedCost || 1000),
      risk: data.risk || 'LOW',
      riskScore: Number(data.riskScore || 20),
      lastUpdated: tsStr,
      description: data.description || '',
      parcels: [],
      affectedFamilies: Number(data.affectedFamilies || Math.max(5, Math.round(landReq * 2))),
      displacedFamilies: Number(data.displacedFamilies || Math.round(landReq * 0.5)),
      compensationAssessed: Number(data.compensationAssessed || 200),
      compensationDisbursed: Number(data.compensationDisbursed || 0),
    };

    const stored = localStorage.getItem(STORAGE_PROJECTS_KEY);
    const pList: Project[] = stored ? JSON.parse(stored) : [...DATA.projects];
    pList.unshift(newProject);
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(pList));

    addLocalAudit('CREATE', 'Projects', projId, `Created project ${projId} (${newProject.name})`);
    return newProject;
  },

  // =========================================================================
  // System Notifications API
  // =========================================================================
  async getSystemNotifications(role?: string, email?: string): Promise<SystemNotification[]> {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (email) params.set('email', email);
    const queryStr = params.toString() ? `?${params.toString()}` : '';

    const apiData = await fetchFromApi<SystemNotification[]>(`/system-notifications${queryStr}`);
    if (apiData) return apiData;

    const notifs = getLocalSystemNotifs();
    if (!role && !email) return notifs;
    return notifs.filter((n) => n.recipientRole === 'all' || n.recipientRole === role || (email && n.recipientEmail === email));
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetchFromApi(`/notifications/${id}/read`, { method: 'POST' });
    const notifs = getLocalSystemNotifs();
    const item = notifs.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      saveLocalSystemNotifs(notifs);
    }
  },

  async markAllNotificationsRead(role?: string, email?: string): Promise<void> {
    await fetchFromApi('/notifications/read-all', {
      method: 'POST',
      body: JSON.stringify({ role, email }),
    });
    const notifs = getLocalSystemNotifs();
    for (const n of notifs) {
      if (role && n.recipientRole !== role && n.recipientRole !== 'all' && (!email || n.recipientEmail !== email)) {
        continue;
      }
      n.isRead = true;
    }
    saveLocalSystemNotifs(notifs);
  },

  // =========================================================================
  // Documents & Upload API
  // =========================================================================
  async getDocuments(projectId?: string): Promise<DocumentRecord[]> {
    const endpoint = projectId ? `/documents?projectId=${projectId}` : '/documents';
    const apiData = await fetchFromApi<DocumentRecord[]>(endpoint);
    if (apiData) return apiData;

    const s = localStorage.getItem(STORAGE_DOCS_KEY);
    const docs: DocumentRecord[] = s ? JSON.parse(s) : [...DATA.documents];
    if (projectId) return docs.filter((d) => d.projectId === projectId);
    return docs;
  },

  async uploadDocument(data: {
    projectId: string;
    projectName?: string;
    category: DocumentRecord['category'];
    fileName: string;
    size?: string;
    version?: string;
  }): Promise<DocumentRecord> {
    const apiData = await fetchFromApi<DocumentRecord>('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (apiData) return apiData;

    const s = localStorage.getItem(STORAGE_DOCS_KEY);
    const docs: DocumentRecord[] = s ? JSON.parse(s) : [...DATA.documents];
    const docId = `DOC-${(docs.length + 1).toString().padStart(5, '0')}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const newDoc: DocumentRecord = {
      id: docId,
      projectId: data.projectId,
      projectName: data.projectName || 'Infrastructure Project',
      category: data.category,
      fileName: data.fileName,
      uploadedBy: 'Authorized Officer',
      uploadDate: dateStr,
      version: data.version || 'v1.0',
      status: 'Verified',
      size: data.size || '2.4 MB',
    };

    docs.unshift(newDoc);
    localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify(docs));
    addLocalAudit('UPLOAD', 'Documents', docId, `Uploaded document ${newDoc.fileName} for ${newDoc.projectId}`);
    return newDoc;
  },

  // =========================================================================
  // Land Parcels
  // =========================================================================
  async getParcels(projectId?: string): Promise<LandParcel[]> {
    const endpoint = projectId ? `/parcels?projectId=${projectId}` : '/parcels';
    const apiData = await fetchFromApi<LandParcel[]>(endpoint);
    if (apiData) return apiData;
    if (projectId) return DATA.parcels.filter((p) => p.projectId === projectId);
    return DATA.parcels;
  },

  // =========================================================================
  // Statutory Notifications
  // =========================================================================
  async getNotifications(projectId?: string): Promise<Notification[]> {
    const endpoint = projectId ? `/notifications?projectId=${projectId}` : '/notifications';
    const apiData = await fetchFromApi<Notification[]>(endpoint);
    if (apiData) return apiData;
    if (projectId) return DATA.notifications.filter((n) => n.projectId === projectId);
    return DATA.notifications;
  },

  // =========================================================================
  // Awards, Compensation, Families, Milestones, Alerts, Workflow
  // =========================================================================
  async getAwards(projectId?: string): Promise<Award[]> {
    const endpoint = projectId ? `/awards?projectId=${projectId}` : '/awards';
    const apiData = await fetchFromApi<Award[]>(endpoint);
    if (apiData) return apiData;
    if (projectId) return DATA.awards.filter((a) => a.projectId === projectId);
    return DATA.awards;
  },

  async getCompensation(projectId?: string): Promise<CompensationRecord[]> {
    const endpoint = projectId ? `/compensation?projectId=${projectId}` : '/compensation';
    const apiData = await fetchFromApi<CompensationRecord[]>(endpoint);
    if (apiData) return apiData;
    if (projectId) return DATA.compensation.filter((c) => c.projectId === projectId);
    return DATA.compensation;
  },

  async getFamilies(projectId?: string): Promise<AffectedFamily[]> {
    const endpoint = projectId ? `/families?projectId=${projectId}` : '/families';
    const apiData = await fetchFromApi<AffectedFamily[]>(endpoint);
    if (apiData) return apiData;
    if (projectId) return DATA.families.filter((f) => f.projectId === projectId);
    return DATA.families;
  },

  async getMilestones(projectId?: string): Promise<Milestone[]> {
    const endpoint = projectId ? `/milestones?projectId=${projectId}` : '/milestones';
    const apiData = await fetchFromApi<Milestone[]>(endpoint);
    if (apiData) return apiData;
    if (projectId) return DATA.milestones.filter((m) => m.projectId === projectId);
    return DATA.milestones;
  },

  async getAlerts(projectId?: string): Promise<Alert[]> {
    const endpoint = projectId ? `/alerts?projectId=${projectId}` : '/alerts';
    const apiData = await fetchFromApi<Alert[]>(endpoint);
    if (apiData) return apiData;
    if (projectId) return DATA.alerts.filter((a) => a.projectId === projectId);
    return DATA.alerts;
  },

  async getWorkflowTasks(projectId?: string): Promise<WorkflowTask[]> {
    const endpoint = projectId ? `/workflow?projectId=${projectId}` : '/workflow';
    const apiData = await fetchFromApi<WorkflowTask[]>(endpoint);
    if (apiData) return apiData;
    if (projectId) return DATA.workflow.filter((w) => w.projectId === projectId);
    return DATA.workflow;
  },

  // =========================================================================
  // Audit Logs
  // =========================================================================
  async getAuditLogs(): Promise<AuditLog[]> {
    const apiData = await fetchFromApi<AuditLog[]>('/audit');
    if (apiData) return apiData;
    const s = localStorage.getItem(STORAGE_AUDIT_KEY);
    return s ? JSON.parse(s) : DATA.audit;
  },

  async createAuditLog(data: { action: string; module: string; recordId: string; description: string }): Promise<void> {
    await fetchFromApi('/audit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    addLocalAudit(data.action, data.module, data.recordId, data.description);
  },

  // =========================================================================
  // ML Risk Prediction
  // =========================================================================
  async predictRisk(input: RiskPredictionInput): Promise<RiskPrediction> {
    const apiData = await fetchFromApi<RiskPrediction>('/predict-risk', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (apiData) return apiData;
    return localPredictRisk(input);
  },

  // =========================================================================
  // Auth
  // =========================================================================
  async login(email: string, password?: string): Promise<{ token: string; user: User } | null> {
    const apiData = await fetchFromApi<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: password || 'demo@123' }),
    });
    if (apiData) return apiData;

    const user = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      return {
        token: `mock-token-${user.id}`,
        user,
      };
    }
    return null;
  },
};
