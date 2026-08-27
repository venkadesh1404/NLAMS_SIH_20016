export const ROLE_LABELS: Record<string, string> = {
  central_ministry: 'Central Ministry Officer',
  state_gov: 'State Government Officer',
  district_authority: 'District Authority',
  pwd_agency: 'PWD / Implementing Agency',
  land_acquisition_officer: 'Land Acquisition Officer',
  rr_officer: 'R&R Officer',
  system_admin: 'System Administrator',
};

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  // Generic
  Completed: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-600' },
  'In Progress': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-600' },
  Pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500' },
  Delayed: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-600' },
  // Project statuses
  Submitted: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-500' },
  'Under Scrutiny': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' },
  Approved: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-600' },
  'Notification Issued': { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300', dot: 'bg-cyan-600' },
  'Award Declared': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300', dot: 'bg-indigo-600' },
  'Compensation Pending': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500' },
  'Compensation Completed': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-600' },
  'Possession Pending': { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
  'Possession Completed': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-600' },
  'R&R In Progress': { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300', dot: 'bg-teal-600' },
  // Acquisition
  Proposed: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-500' },
  Notified: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' },
  Acquired: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-600' },
  Disputed: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-600' },
  // Compensation
  'Not Started': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-400' },
  Assessed: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' },
  'Assessment Pending': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500' },
  'Payment Pending': { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
  'Partially Paid': { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300', dot: 'bg-cyan-600' },
  'Fully Paid': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-600' },
  // Possession
  Scheduled: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' },
  Taken: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300', dot: 'bg-teal-600' },
  'Handover Completed': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-600' },
  // R&R
  Eligible: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' },
  'Not Displaced': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-400' },
  'Partially Displaced': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500' },
  'Fully Displaced': { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-600' },
  // Risk
  LOW: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-600' },
  MEDIUM: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500' },
  HIGH: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
  CRITICAL: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-600' },
  // Alert severity
  Critical: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-600' },
  High: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
  Medium: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500' },
  Low: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' },
  // Sync
  Synchronizing: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' },
  Synchronized: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-600' },
  Failed: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-600' },
  Conflict: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
  Open: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-600' },
  Acknowledged: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500' },
  Resolved: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-600' },
  // Doc
  Verified: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-600' },
  Rejected: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-600' },
  // Award
  Draft: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-400' },
  'Under Review': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' },
  Declared: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-600' },
  Issued: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' },
  Published: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-600' },
  Expired: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-400' },
  Returned: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
  Forwarded: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300', dot: 'bg-cyan-600' },
};

export function getStatusStyle(status: string) {
  return STATUS_COLORS[status] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-500' };
}
