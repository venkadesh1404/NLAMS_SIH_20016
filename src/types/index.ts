export type UserRole =
  | 'central_ministry'
  | 'state_gov'
  | 'district_authority'
  | 'pwd_agency'
  | 'land_acquisition_officer'
  | 'rr_officer'
  | 'system_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  state?: string;
  district?: string;
  avatarColor: string;
}

export type ProjectType =
  | 'Highways'
  | 'Railways'
  | 'Irrigation'
  | 'Industrial Corridor'
  | 'Urban Development'
  | 'Renewable Energy'
  | 'Public Infrastructure'
  | 'Other';

export type ProjectStage =
  | 'Proposal'
  | 'Scrutiny'
  | 'Approval'
  | 'Notification'
  | 'Award'
  | 'Compensation'
  | 'Possession'
  | 'R&R'
  | 'Completion';

export type ProjectStatus =
  | 'Submitted'
  | 'Under Scrutiny'
  | 'Approved'
  | 'Notification Issued'
  | 'Award Declared'
  | 'Compensation Pending'
  | 'Compensation Completed'
  | 'Possession Pending'
  | 'Possession Completed'
  | 'R&R In Progress'
  | 'Completed'
  | 'Delayed';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Project {
  id: string;
  name: string;
  agency: string;
  state: string;
  district: string;
  type: ProjectType;
  landRequired: number;
  landAcquired: number;
  landNotified: number;
  acquisitionPct: number;
  compensationPct: number;
  possessionPct: number;
  rrPct: number;
  status: ProjectStatus;
  stage: ProjectStage;
  targetDate: string;
  estimatedCost: number;
  risk: RiskLevel;
  riskScore: number;
  lastUpdated: string;
  description: string;
  parcels: string[];
  affectedFamilies: number;
  displacedFamilies: number;
  compensationAssessed: number;
  compensationDisbursed: number;
}

export type AcquisitionStatus =
  | 'Proposed'
  | 'Notified'
  | 'Acquired'
  | 'Disputed'
  | 'Pending';

export type CompensationStatus =
  | 'Not Started'
  | 'Assessed'
  | 'Approved'
  | 'Partially Paid'
  | 'Fully Paid';

export type PossessionStatus =
  | 'Pending'
  | 'Scheduled'
  | 'Taken'
  | 'Handover Completed';

export interface LandParcel {
  id: string;
  surveyNumber: string;
  village: string;
  taluk: string;
  district: string;
  state: string;
  area: number;
  landType: string;
  ownershipType: string;
  lat: number;
  lng: number;
  acquisitionStatus: AcquisitionStatus;
  compensationStatus: CompensationStatus;
  possessionStatus: PossessionStatus;
  rrStatus: 'Not Started' | 'Eligible' | 'In Progress' | 'Completed' | 'Disputed';
  projectId: string;
  ownerCount: number;
}

export interface Notification {
  id: string;
  projectId: string;
  projectName: string;
  type: 'Preliminary Notification' | 'Declaration' | 'Award Notification' | 'Possession Notice' | 'Other Statutory Notice';
  number: string;
  issueDate: string;
  publicationDate: string;
  status: 'Draft' | 'Issued' | 'Published' | 'Expired';
  remarks: string;
}

export interface Award {
  id: string;
  projectId: string;
  district: string;
  village: string;
  surveyNumber: string;
  awardDate: string;
  landArea: number;
  awardAmount: number;
  beneficiaryCount: number;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Declared';
}

export interface CompensationRecord {
  id: string;
  projectId: string;
  projectName: string;
  district: string;
  beneficiaryId: string;
  landArea: number;
  assessedAmount: number;
  approvedAmount: number;
  paidAmount: number;
  paymentDate: string | null;
  status: 'Assessment Pending' | 'Assessed' | 'Approved' | 'Payment Pending' | 'Partially Paid' | 'Fully Paid';
}

export interface AffectedFamily {
  id: string;
  projectId: string;
  district: string;
  village: string;
  category: 'Title Holder' | 'Occupant' | 'Tenant' | 'Agricultural Labour' | 'Artisan' | 'Other';
  landAffected: number;
  displacementStatus: 'Not Displaced' | 'Partially Displaced' | 'Fully Displaced';
  compensationStatus: CompensationStatus;
  rrEligibility: boolean;
  rrBenefit: string;
  rrStatus: 'Not Started' | 'Eligible' | 'In Progress' | 'Completed' | 'Disputed';
}

export interface Milestone {
  id: string;
  projectId: string;
  stage: ProjectStage;
  plannedDate: string;
  actualDate: string | null;
  authority: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Delayed';
  delayDays: number;
  remarks: string;
}

export interface Alert {
  id: string;
  type: 'Delayed Approval' | 'Pending Verification' | 'Compensation Delay' | 'Possession Delay' | 'R&R Delay' | 'Missing Document' | 'Expiring Deadline' | 'Long Pending Case';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  projectId: string;
  projectName: string;
  description: string;
  createdDate: string;
  escalationLevel: 'District' | 'State' | 'Central';
  status: 'Open' | 'Acknowledged' | 'Resolved';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  module: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'FORWARD' | 'LOGIN' | 'LOGOUT';
  recordId: string;
  description: string;
  origin: 'ONLINE' | 'OFFLINE';
  syncTimestamp: string | null;
}

export interface WorkflowTask {
  id: string;
  projectId: string;
  projectName: string;
  currentStage: ProjectStage;
  assignedTo: string;
  assignedRole: UserRole;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Returned' | 'Forwarded';
  createdDate: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}

export interface SyncQueueRecord {
  id: string;
  module: string;
  recordId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  createdTime: string;
  retryCount: number;
  status: 'Pending' | 'Synchronizing' | 'Synchronized' | 'Failed' | 'Conflict';
  lastError: string | null;
}

export interface DocumentRecord {
  id: string;
  projectId: string;
  projectName: string;
  category: 'Project Proposal' | 'DPR' | 'Land Records' | 'Survey Documents' | 'Notifications' | 'Awards' | 'Compensation Documents' | 'Possession Records' | 'R&R Documents' | 'Government Orders';
  fileName: string;
  uploadedBy: string;
  uploadDate: string;
  version: string;
  status: 'Verified' | 'Pending' | 'Rejected';
  size: string;
}

export interface RiskPrediction {
  riskScore: number;
  riskLevel: RiskLevel;
  recommendation: string;
  factors: { name: string; value: string; weight: number }[];
}

export interface RiskPredictionInput {
  land_acquisition_percentage: number;
  pending_parcels: number;
  disputed_parcels: number;
  compensation_pending_percentage: number;
  approval_delay_days: number;
  possession_delay_days: number;
  rr_pending_percentage: number;
}

export type ProposalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_VERIFICATION'
  | 'VERIFIED'
  | 'UNDER_SCRUTINY'
  | 'APPROVED'
  | 'REJECTED'
  | 'SENT_BACK'
  | 'COMPLETED';

export interface ProposalTimelineEvent {
  action: string;
  by: string;
  role: string;
  timestamp: string;
  notes?: string;
}

export interface Proposal {
  id: string; // e.g. NLAMS-PROP-2026-001
  projectName: string;
  submittedBy: string;
  submittedByEmail?: string;
  department: string;
  agency: string;
  projectType: ProjectType;
  state: string;
  district: string;
  landRequired: number;
  estimatedCost: number;
  purpose: string;
  targetDate: string;
  documents: { id: string; name: string; type: string; size: string; uploadDate: string }[];
  createdDate: string;
  updatedDate: string;
  status: ProposalStatus;
  currentStage: ProjectStage;
  assignedAuthority: string;
  assignedRole: UserRole;
  remarks?: string;
  rejectionReason?: string;
  sendBackReason?: string;
  timeline: ProposalTimelineEvent[];
  projectId?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  recipientRole?: UserRole | 'all';
  recipientEmail?: string;
  targetModule: 'proposals' | 'projects' | 'compensation' | 'possession' | 'rehabilitation' | 'alerts' | 'documents';
  targetId?: string;
  isRead: boolean;
  timestamp: string;
}

