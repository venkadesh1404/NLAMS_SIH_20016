/**
 * NLAMS (National Land Acquisition Management System) - API Service Client
 * Connects frontend to the Python Backend API (http://localhost:8000/api)
 * with transparent fallback to local datasets when offline.
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
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function fetchFromApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    // Backend offline or error -> Fallback gracefully
    console.debug(`Backend API (${endpoint}) offline or unreachable, using local dataset fallback.`, err);
    return null;
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

    // Fallback analytics calculation
    const projects = DATA.projects;
    const totalLandReq = projects.reduce((sum, p) => sum + p.landRequired, 0);
    const totalLandAcq = projects.reduce((sum, p) => sum + p.landAcquired, 0);
    const totalCost = projects.reduce((sum, p) => sum + p.estimatedCost, 0);
    const totalAssessed = projects.reduce((sum, p) => sum + p.compensationAssessed, 0);
    const totalDisbursed = projects.reduce((sum, p) => sum + p.compensationDisbursed, 0);

    return {
      totalProjects: projects.length,
      totalLandRequired: totalLandReq,
      totalLandAcquired: totalLandAcq,
      overallAcquisitionPct: Math.round((totalLandAcq / (totalLandReq || 1)) * 100),
      totalEstimatedCost: totalCost,
      totalCompensationAssessed: totalAssessed,
      totalCompensationDisbursed: totalDisbursed,
      compensationDisbursementPct: Math.round((totalDisbursed / (totalAssessed || 1)) * 100),
      alertsCount: DATA.alerts.length,
      pendingTasksCount: DATA.workflow.filter((w) => w.status === 'Pending').length,
    };
  },

  // Projects
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

    // Fallback: local filtering
    let list = [...DATA.projects];
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
    return DATA.projects.find((p) => p.id === projectId) || null;
  },

  // Land Parcels
  async getParcels(projectId?: string): Promise<LandParcel[]> {
    const endpoint = projectId ? `/parcels?projectId=${projectId}` : '/parcels';
    const apiData = await fetchFromApi<LandParcel[]>(endpoint);
    if (apiData) return apiData;
    if (projectId) return DATA.parcels.filter((p) => p.projectId === projectId);
    return DATA.parcels;
  },

  // Notifications
  async getNotifications(projectId?: string): Promise<Notification[]> {
    const endpoint = projectId ? `/notifications?projectId=${projectId}` : '/notifications';
    const apiData = await fetchFromApi<Notification[]>(endpoint);
    if (apiData) return apiData;
    if (projectId) return DATA.notifications.filter((n) => n.projectId === projectId);
    return DATA.notifications;
  },

  // Awards
  async getAwards(projectId?: string): Promise<Award[]> {
    const endpoint = projectId ? `/awards?projectId=${projectId}` : '/awards';
    const apiData = await fetchFromApi<Award[]>(endpoint);
    if (apiData) return apiData;
    if (projectId) return DATA.awards.filter((a) => a.projectId === projectId);
    return DATA.awards;
  },

  // Compensation Records
  async getCompensation(projectId?: string): Promise<CompensationRecord[]> {
    const endpoint = projectId ? `/compensation?projectId=${projectId}` : '/compensation';
    const apiData = await fetchFromApi<CompensationRecord[]>(endpoint);
    if (apiData) return apiData;
    if (projectId) return DATA.compensation.filter((c) => c.projectId === projectId);
    return DATA.compensation;
  },

  // Affected Families
  async getFamilies(projectId?: string): Promise<AffectedFamily[]> {
    const endpoint = projectId ? `/families?projectId=${projectId}` : '/families';
    const apiData = await fetchFromApi<AffectedFamily[]>(endpoint);
    if (apiData) return apiData;
    if (projectId) return DATA.families.filter((f) => f.projectId === projectId);
    return DATA.families;
  },

  // Milestones
  async getMilestones(projectId?: string): Promise<Milestone[]> {
    const endpoint = projectId ? `/milestones?projectId=${projectId}` : '/milestones';
    const apiData = await fetchFromApi<Milestone[]>(endpoint);
    if (apiData) return apiData;
    if (projectId) return DATA.milestones.filter((m) => m.projectId === projectId);
    return DATA.milestones;
  },

  // Alerts
  async getAlerts(projectId?: string): Promise<Alert[]> {
    const endpoint = projectId ? `/alerts?projectId=${projectId}` : '/alerts';
    const apiData = await fetchFromApi<Alert[]>(endpoint);
    if (apiData) return apiData;
    if (projectId) return DATA.alerts.filter((a) => a.projectId === projectId);
    return DATA.alerts;
  },

  // Workflow Tasks
  async getWorkflowTasks(projectId?: string): Promise<WorkflowTask[]> {
    const endpoint = projectId ? `/workflow?projectId=${projectId}` : '/workflow';
    const apiData = await fetchFromApi<WorkflowTask[]>(endpoint);
    if (apiData) return apiData;
    if (projectId) return DATA.workflow.filter((w) => w.projectId === projectId);
    return DATA.workflow;
  },

  // Documents
  async getDocuments(projectId?: string): Promise<DocumentRecord[]> {
    const endpoint = projectId ? `/documents?projectId=${projectId}` : '/documents';
    const apiData = await fetchFromApi<DocumentRecord[]>(endpoint);
    if (apiData) return apiData;
    if (projectId) return DATA.documents.filter((d) => d.projectId === projectId);
    return DATA.documents;
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const apiData = await fetchFromApi<AuditLog[]>('/audit');
    if (apiData) return apiData;
    return DATA.audit;
  },

  // ML Risk Prediction
  async predictRisk(input: RiskPredictionInput): Promise<RiskPrediction> {
    const apiData = await fetchFromApi<RiskPrediction>('/predict-risk', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (apiData) return apiData;
    return localPredictRisk(input);
  },

  // Authentication Login
  async login(email: string, password?: string): Promise<{ token: string; user: User } | null> {
    const apiData = await fetchFromApi<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: password || 'demo@123' }),
    });
    if (apiData) return apiData;

    // Fallback authentication
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
