import type {
  Project, LandParcel, Notification, Award, CompensationRecord,
  AffectedFamily, Milestone, Alert, AuditLog, WorkflowTask,
  SyncQueueRecord, DocumentRecord, User, UserRole, ProjectStage,
} from '@/types';

export const STATES = [
  { id: 'TN', name: 'Tamil Nadu' },
  { id: 'KA', name: 'Karnataka' },
  { id: 'KL', name: 'Kerala' },
  { id: 'MH', name: 'Maharashtra' },
  { id: 'AP', name: 'Andhra Pradesh' },
  { id: 'TG', name: 'Telangana' },
  { id: 'GJ', name: 'Gujarat' },
  { id: 'RJ', name: 'Rajasthan' },
];

export const DISTRICTS: Record<string, string[]> = {
  'Tamil Nadu': ['Chennai', 'Tirunelveli', 'Madurai', 'Coimbatore', 'Tiruchirappalli'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Belagavi', 'Dakshina Kannada'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Kurnool'],
  'Telangana': ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad', 'Khammam'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
};

const PROJECT_TYPES = ['Highways', 'Railways', 'Irrigation', 'Industrial Corridor', 'Urban Development', 'Renewable Energy', 'Public Infrastructure', 'Other'] as const;
const AGENCIES = ['PWD Tamil Nadu', 'PWD Karnataka', 'PWD Kerala', 'PWD Maharashtra', 'National Highways Authority', 'Railway Board', 'State Irrigation Dept'];

const VILLAGES = ['Melmaruvathur', 'Keezhkattalai', 'Therkku Poigainallur', 'Vadakkukarai', 'Thenkudi', 'Keeladi', 'Pazhaverkadu', 'Kodiveri', 'Alampatti', 'Sulthanpet'];

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const round = (n: number, d = 0) => Math.round(n * Math.pow(10, d)) / Math.pow(10, d);

const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const rng = seededRandom(42);

function riskFromScore(score: number): { level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' } {
  if (score >= 80) return { level: 'CRITICAL' };
  if (score >= 60) return { level: 'HIGH' };
  if (score >= 35) return { level: 'MEDIUM' };
  return { level: 'LOW' };
}

const STAGES: ProjectStage[] = ['Proposal', 'Scrutiny', 'Approval', 'Notification', 'Award', 'Compensation', 'Possession', 'R&R', 'Completion'];

function generateProjects(): Project[] {
  const projects: Project[] = [];
  const demoProject: Project = {
    id: 'PWD-TN-2026-001',
    name: 'Chennai-Tirunelveli Infrastructure Corridor',
    agency: 'PWD Tamil Nadu',
    state: 'Tamil Nadu',
    district: 'Tirunelveli',
    type: 'Highways',
    landRequired: 842,
    landAcquired: 524,
    landNotified: 712,
    acquisitionPct: 62,
    compensationPct: 48,
    possessionPct: 41,
    rrPct: 35,
    status: 'Compensation Pending',
    stage: 'Compensation',
    targetDate: '2027-03-15',
    estimatedCost: 12400,
    risk: 'HIGH',
    riskScore: 78,
    lastUpdated: '2026-08-27 09:42',
    description: '6-lane access-controlled highway corridor connecting Chennai and Tirunelveli spanning 607 km, including service roads, flyovers, and toll plazas. Acquiring land across 4 districts with 142 affected parcels.',
    parcels: ['LP-001-TN', 'LP-002-TN', 'LP-003-TN', 'LP-004-TN', 'LP-005-TN', 'LP-006-TN', 'LP-007-TN', 'LP-008-TN'],
    affectedFamilies: 312,
    displacedFamilies: 87,
    compensationAssessed: 286,
    compensationDisbursed: 142,
  };
  projects.push(demoProject);

  const stateCodes = ['TN', 'KA', 'KL', 'MH', 'AP', 'TG', 'GJ', 'RJ'];
  let counter = 2;
  for (const code of stateCodes) {
    const count = rand(2, 3);
    for (let i = 0; i < count; i++) {
      const stateName = STATES.find((s) => s.id === code)!.name;
      const district = pick(DISTRICTS[stateName]);
      const landReq = rand(120, 950);
      const acqPct = rand(15, 95);
      const landAcq = round((landReq * acqPct) / 100);
      const notPct = Math.min(100, acqPct + rand(5, 20));
      const landNot = round((landReq * notPct) / 100);
      const compPct = rand(10, 95);
      const possPct = rand(5, 90);
      const rrPct = rand(5, 80);
      const stageIdx = Math.floor((acqPct + compPct + possPct) / 33);
      const stage = STAGES[Math.min(stageIdx, STAGES.length - 1)];
      const riskScore = rand(15, 88);
      const { level } = riskFromScore(riskScore);
      const statuses: Project['status'][] = ['Submitted', 'Under Scrutiny', 'Approved', 'Notification Issued', 'Award Declared', 'Compensation Pending', 'Compensation Completed', 'Possession Pending', 'Possession Completed', 'R&R In Progress', 'Completed', 'Delayed'];
      const status = stage === 'Completion' ? 'Completed' : pick(statuses.filter((s) => s !== 'Completed'));
      const id = `PWD-${code}-2026-${String(counter).padStart(3, '0')}`;
      projects.push({
        id,
        name: generateProjectName(pick(PROJECT_TYPES), stateName, district),
        agency: pick(AGENCIES),
        state: stateName,
        district,
        type: pick(PROJECT_TYPES),
        landRequired: landReq,
        landAcquired: landAcq,
        landNotified: landNot,
        acquisitionPct: acqPct,
        compensationPct: compPct,
        possessionPct: possPct,
        rrPct: rrPct,
        status,
        stage,
        targetDate: `2027-${String(rand(1, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`,
        estimatedCost: rand(500, 18000),
        risk: level,
        riskScore,
        lastUpdated: `2026-08-${String(rand(20, 27)).padStart(2, '0')} ${String(rand(8, 18)).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}`,
        description: `${pick(PROJECT_TYPES)} project in ${district}, ${stateName}. Total land requirement: ${landReq} hectares across multiple villages.`,
        parcels: [],
        affectedFamilies: rand(20, 400),
        displacedFamilies: rand(5, 120),
        compensationAssessed: rand(50, 500),
        compensationDisbursed: rand(10, 300),
      });
      counter++;
    }
  }
  return projects;
}

function generateProjectName(type: string, state: string, district: string): string {
  const prefixes: Record<string, string[]> = {
    'Highways': ['Expressway', 'Bypass', 'Ring Road', 'Highway Widening'],
    'Railways': ['Metro Line', 'Railway Doubling', 'High-Speed Rail', 'Suburban Rail'],
    'Irrigation': ['Canal Project', 'Dam Modernization', 'Lift Irrigation', 'Reservoir Expansion'],
    'Industrial Corridor': ['Industrial Park', 'SEZ Development', 'Logistics Hub', 'Manufacturing Zone'],
    'Urban Development': ['Smart City Phase', 'Township', 'Urban Renewal', 'Civic Infrastructure'],
    'Renewable Energy': ['Solar Park', 'Wind Farm', 'Green Energy Hub', 'Pumped Storage'],
    'Public Infrastructure': ['Medical College', 'Administrative Complex', 'Water Treatment', 'Bus Terminal'],
    'Other': ['Multi-Purpose Project', 'Public Utility', 'Infrastructure Upgrade'],
  };
  const opts = prefixes[type] || prefixes['Other'];
  return `${district} ${pick(opts)}`;
}

function generateParcels(projects: Project[]): LandParcel[] {
  const parcels: LandParcel[] = [];
  const landTypes = ['Wetland', 'Dry Land', 'Garden Land', 'Poramboke', 'Residential', 'Commercial'];
  const ownershipTypes = ['Private Patta', 'Government', 'Inam', 'Temple Land', 'Assigned', 'Wakf'];
  let id = 1;
  for (const project of projects) {
    const numParcels = project.id === 'PWD-TN-2026-001' ? 8 : rand(2, 6);
    const projectParcels: string[] = [];
    for (let i = 0; i < numParcels; i++) {
      const parcelId = `LP-${String(id).padStart(3, '0')}-${project.state.split(' ')[0].slice(0, 2).toUpperCase()}`;
      const acqStatuses: LandParcel['acquisitionStatus'][] = ['Proposed', 'Notified', 'Acquired', 'Disputed', 'Pending'];
      const acqStatus = pick(acqStatuses);
      const compStatus: LandParcel['compensationStatus'] = acqStatus === 'Acquired' ? pick(['Assessed', 'Approved', 'Partially Paid', 'Fully Paid']) : 'Not Started';
      const possStatus: LandParcel['possessionStatus'] = acqStatus === 'Acquired' ? pick(['Pending', 'Scheduled', 'Taken', 'Handover Completed']) : 'Pending';
      const rrStatus: LandParcel['rrStatus'] = pick(['Not Started', 'Eligible', 'In Progress', 'Completed', 'Disputed']);
      const baseLat: Record<string, number> = { 'Tamil Nadu': 8.0883, 'Karnataka': 12.9716, 'Kerala': 10.1632, 'Maharashtra': 18.5204, 'Andhra Pradesh': 15.9129, 'Telangana': 17.385, 'Gujarat': 23.0225, 'Rajasthan': 26.9129 };
      const baseLng: Record<string, number> = { 'Tamil Nadu': 77.5385, 'Karnataka': 77.5946, 'Kerala': 76.6413, 'Maharashtra': 73.8567, 'Andhra Pradesh': 79.7400, 'Telangana': 78.4867, 'Gujarat': 72.5714, 'Rajasthan': 75.7873 };
      const lat = (baseLat[project.state] || 20) + (rng() - 0.5) * 2;
      const lng = (baseLng[project.state] || 78) + (rng() - 0.5) * 2;
      const parcel: LandParcel = {
        id: parcelId,
        surveyNumber: `${rand(1, 999)}/${rand(1, 99)}`,
        village: pick(VILLAGES),
        taluk: project.district,
        district: project.district,
        state: project.state,
        area: round(rand(2, 45), 2),
        landType: pick(landTypes),
        ownershipType: pick(ownershipTypes),
        lat: round(lat, 4),
        lng: round(lng, 4),
        acquisitionStatus: acqStatus,
        compensationStatus: compStatus,
        possessionStatus: possStatus,
        rrStatus,
        projectId: project.id,
        ownerCount: rand(1, 8),
      };
      parcels.push(parcel);
      projectParcels.push(parcelId);
      id++;
    }
    if (project.parcels.length === 0) project.parcels = projectParcels;
  }
  return parcels;
}

function generateNotifications(projects: Project[]): Notification[] {
  const notifications: Notification[] = [];
  const types: Notification['type'][] = ['Preliminary Notification', 'Declaration', 'Award Notification', 'Possession Notice', 'Other Statutory Notice'];
  let id = 1;
  for (const project of projects) {
    const count = rand(1, 3);
    for (let i = 0; i < count; i++) {
      notifications.push({
        id: `NOT-${String(id).padStart(4, '0')}`,
        projectId: project.id,
        projectName: project.name,
        type: pick(types),
        number: `${project.id.split('-')[1]}-${String(rand(100, 999))}/${rand(2025, 2026)}`,
        issueDate: `2026-0${rand(1, 8)}-${String(rand(1, 28)).padStart(2, '0')}`,
        publicationDate: `2026-0${rand(1, 8)}-${String(rand(1, 28)).padStart(2, '0')}`,
        status: pick(['Draft', 'Issued', 'Published', 'Published']),
        remarks: 'Published in official gazette and local newspapers.',
      });
      id++;
    }
  }
  return notifications;
}

function generateAwards(projects: Project[]): Award[] {
  const awards: Award[] = [];
  let id = 1;
  for (const project of projects) {
    if (project.acquisitionPct < 30) continue;
    const count = rand(1, 2);
    for (let i = 0; i < count; i++) {
      awards.push({
        id: `AWD-${String(id).padStart(4, '0')}`,
        projectId: project.id,
        district: project.district,
        village: pick(VILLAGES),
        surveyNumber: `${rand(1, 999)}/${rand(1, 99)}`,
        awardDate: `2026-0${rand(1, 8)}-${String(rand(1, 28)).padStart(2, '0')}`,
        landArea: round(rand(5, 80), 2),
        awardAmount: rand(20, 800),
        beneficiaryCount: rand(3, 45),
        status: pick(['Draft', 'Under Review', 'Approved', 'Declared']),
      });
      id++;
    }
  }
  return awards;
}

function generateCompensation(projects: Project[]): CompensationRecord[] {
  const records: CompensationRecord[] = [];
  let id = 1;
  for (const project of projects) {
    if (project.compensationPct < 10) continue;
    const count = rand(2, 6);
    for (let i = 0; i < count; i++) {
      const assessed = rand(5, 200);
      const approved = rand(0, assessed);
      const paid = rand(0, approved);
      let status: CompensationRecord['status'];
      if (paid === 0 && approved === 0) status = pick(['Assessment Pending', 'Assessed']);
      else if (paid === 0) status = 'Payment Pending';
      else if (paid < approved) status = 'Partially Paid';
      else status = 'Fully Paid';
      records.push({
        id: `CMP-${String(id).padStart(5, '0')}`,
        projectId: project.id,
        projectName: project.name,
        district: project.district,
        beneficiaryId: `BEN-${String(rand(10000, 99999))}`,
        landArea: round(rand(1, 25), 2),
        assessedAmount: assessed,
        approvedAmount: approved,
        paidAmount: paid,
        paymentDate: paid > 0 ? `2026-0${rand(1, 8)}-${String(rand(1, 28)).padStart(2, '0')}` : null,
        status,
      });
      id++;
    }
  }
  return records;
}

function generateFamilies(projects: Project[]): AffectedFamily[] {
  const families: AffectedFamily[] = [];
  const categories: AffectedFamily['category'][] = ['Title Holder', 'Occupant', 'Tenant', 'Agricultural Labour', 'Artisan', 'Other'];
  let id = 1;
  for (const project of projects) {
    const count = rand(3, 12);
    for (let i = 0; i < count; i++) {
      families.push({
        id: `FAM-${String(id).padStart(5, '0')}`,
        projectId: project.id,
        district: project.district,
        village: pick(VILLAGES),
        category: pick(categories),
        landAffected: round(rand(0.5, 15), 2),
        displacementStatus: pick(['Not Displaced', 'Partially Displaced', 'Fully Displaced']),
        compensationStatus: pick(['Not Started', 'Assessed', 'Approved', 'Partially Paid', 'Fully Paid']),
        rrEligibility: rng() > 0.4,
        rrBenefit: pick(['Housing Plot', 'Employment', 'Financial Assistance', 'Land Allotment', 'Skill Training', 'Multiple Benefits']),
        rrStatus: pick(['Not Started', 'Eligible', 'In Progress', 'Completed', 'Disputed']),
      });
      id++;
    }
  }
  return families;
}

function generateMilestones(projects: Project[]): Milestone[] {
  const milestones: Milestone[] = [];
  const authorities = ['PWD Agency', 'District Authority', 'State Government', 'Central Ministry', 'Land Acquisition Officer', 'R&R Officer'];
  let id = 1;
  for (const project of projects) {
    const stageIdx = STAGES.indexOf(project.stage);
    for (let i = 0; i < STAGES.length; i++) {
      const planned = `2026-0${rand(1, 9)}-${String(rand(1, 28)).padStart(2, '0')}`;
      let status: Milestone['status'];
      let actual: string | null = null;
      let delay = 0;
      if (i < stageIdx) {
        status = 'Completed';
        actual = `2026-0${rand(1, 9)}-${String(rand(1, 28)).padStart(2, '0')}`;
        delay = rng() > 0.6 ? rand(5, 40) : 0;
        if (delay > 0) status = 'Delayed';
      } else if (i === stageIdx) {
        status = 'In Progress';
      } else {
        status = 'Pending';
      }
      milestones.push({
        id: `MS-${String(id).padStart(5, '0')}`,
        projectId: project.id,
        stage: STAGES[i],
        plannedDate: planned,
        actualDate: actual,
        authority: authorities[Math.min(i, authorities.length - 1)],
        status,
        delayDays: delay,
        remarks: delay > 0 ? `Delayed by ${delay} days due to pending documentation.` : 'On schedule.',
      });
      id++;
    }
  }
  return milestones;
}

function generateAlerts(projects: Project[]): Alert[] {
  const alerts: Alert[] = [];
  const types: Alert['type'][] = ['Delayed Approval', 'Pending Verification', 'Compensation Delay', 'Possession Delay', 'R&R Delay', 'Missing Document', 'Expiring Deadline', 'Long Pending Case'];
  let id = 1;
  for (const project of projects) {
    if (project.risk === 'LOW' && rng() > 0.3) continue;
    const count = project.risk === 'CRITICAL' || project.risk === 'HIGH' ? rand(1, 3) : rand(0, 1);
    for (let i = 0; i < count; i++) {
      const sev = project.risk === 'CRITICAL' ? 'Critical' : project.risk === 'HIGH' ? pick(['High', 'Critical']) : pick(['Medium', 'Low']);
      alerts.push({
        id: `ALT-${String(id).padStart(4, '0')}`,
        type: pick(types),
        severity: sev,
        projectId: project.id,
        projectName: project.name,
        description: `${pick(types)} detected for ${project.name}. Requires immediate attention.`,
        createdDate: `2026-08-${String(rand(20, 27)).padStart(2, '0')} ${String(rand(8, 18)).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}`,
        escalationLevel: pick(['District', 'State', 'Central']),
        status: pick(['Open', 'Open', 'Acknowledged', 'Resolved']),
      });
      id++;
    }
  }
  return alerts;
}

function generateAuditLogs(): AuditLog[] {
  const logs: AuditLog[] = [];
  const users = ['District Officer Ramesh', 'State Officer Sunita', 'Central Officer Arjun', 'Field Officer Kavya', 'LAO Thomas', 'R&R Officer Meera'];
  const roles = ['District Authority', 'State Government', 'Central Ministry', 'PWD Agency', 'Land Acquisition Officer', 'R&R Officer'];
  const modules = ['Projects', 'Compensation', 'Land Verification', 'Notifications', 'Awards', 'Possession', 'R&R', 'Workflow', 'Documents'];
  const actions: AuditLog['action'][] = ['CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'FORWARD', 'LOGIN'];
  const recordIds = ['PWD-TN-2026-001', 'CMP-10231', 'PARCEL-1092', 'AWD-0034', 'NOT-0067', 'FAM-04521'];
  for (let i = 0; i < 40; i++) {
    const isOffline = rng() > 0.7;
    logs.push({
      id: `AUD-${String(i + 1).padStart(5, '0')}`,
      timestamp: `27-Aug-2026 ${String(rand(9, 18)).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}`,
      user: pick(users),
      role: pick(roles),
      module: pick(modules),
      action: pick(actions),
      recordId: pick(recordIds),
      description: 'Record accessed via authorized session.',
      origin: isOffline ? 'OFFLINE' : 'ONLINE',
      syncTimestamp: isOffline ? `27-Aug-2026 ${String(rand(15, 18)).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}` : null,
    });
  }
  return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function generateWorkflowTasks(projects: Project[]): WorkflowTask[] {
  const tasks: WorkflowTask[] = [];
  const roles: UserRole[] = ['district_authority', 'state_gov', 'land_acquisition_officer', 'rr_officer'];
  const roleNames: Record<string, string> = { district_authority: 'District Authority', state_gov: 'State Government', land_acquisition_officer: 'Land Acquisition Officer', rr_officer: 'R&R Officer' };
  let id = 1;
  for (const project of projects) {
    if (project.stage === 'Completion') continue;
    tasks.push({
      id: `WF-${String(id).padStart(4, '0')}`,
      projectId: project.id,
      projectName: project.name,
      currentStage: project.stage,
      assignedTo: roleNames[pick(roles)],
      assignedRole: pick(roles),
      status: 'Pending',
      createdDate: `2026-08-${String(rand(20, 27)).padStart(2, '0')}`,
      description: `Review and action required for ${project.stage} stage of ${project.name}.`,
      priority: project.risk === 'CRITICAL' || project.risk === 'HIGH' ? 'High' : 'Medium',
    });
    id++;
  }
  return tasks;
}

function generateSyncQueue(): SyncQueueRecord[] {
  const queue: SyncQueueRecord[] = [];
  const modules = ['Land Verification', 'Compensation', 'Possession', 'Field Inspection'];
  for (let i = 0; i < 12; i++) {
    const status = pick(['Pending', 'Pending', 'Synchronizing', 'Synchronized', 'Failed', 'Conflict']);
    queue.push({
      id: `SYN-${String(i + 1).padStart(4, '0')}`,
      module: pick(modules),
      recordId: `PARCEL-${String(rand(1000, 2000))}`,
      action: pick(['CREATE', 'UPDATE']),
      createdTime: `2026-08-27 ${String(rand(8, 16)).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}`,
      retryCount: rand(0, 3),
      status,
      lastError: status === 'Failed' ? 'Authentication token expired.' : status === 'Conflict' ? 'Server record modified by another user.' : null,
    });
  }
  return queue;
}

function generateDocuments(projects: Project[]): DocumentRecord[] {
  const docs: DocumentRecord[] = [];
  const categories: DocumentRecord['category'][] = ['Project Proposal', 'DPR', 'Land Records', 'Survey Documents', 'Notifications', 'Awards', 'Compensation Documents', 'Possession Records', 'R&R Documents', 'Government Orders'];
  let id = 1;
  for (const project of projects) {
    const count = rand(2, 5);
    for (let i = 0; i < count; i++) {
      const cat = pick(categories);
      docs.push({
        id: `DOC-${String(id).padStart(5, '0')}`,
        projectId: project.id,
        projectName: project.name,
        category: cat,
        fileName: `${cat.replace(/\s/g, '_')}_${project.id}.pdf`,
        uploadedBy: pick(['Field Officer Kavya', 'District Officer Ramesh', 'PWD Agency']),
        uploadDate: `2026-0${rand(1, 8)}-${String(rand(1, 28)).padStart(2, '0')}`,
        version: `v${rand(1, 3)}.${rand(0, 9)}`,
        status: pick(['Verified', 'Verified', 'Pending', 'Rejected']),
        size: `${rand(120, 4500)} KB`,
      });
      id++;
    }
  }
  return docs;
}

export const DEMO_USERS: (User & { password: string })[] = [
  { id: 'U001', name: 'Arjun Mehta', email: 'central@nlams.gov.in', role: 'central_ministry', department: 'Ministry of Road Transport', designation: 'Joint Secretary', avatarColor: '#1e3a5f' },
  { id: 'U002', name: 'Sunita Rao', email: 'state@nlams.gov.in', role: 'state_gov', department: 'PWD Tamil Nadu', designation: 'State Project Director', state: 'Tamil Nadu', avatarColor: '#2b6cb0' },
  { id: 'U003', name: 'Ramesh Iyer', email: 'district@nlams.gov.in', role: 'district_authority', department: 'District Collector Office', designation: 'District Collector', state: 'Tamil Nadu', district: 'Tirunelveli', avatarColor: '#2c7a7b' },
  { id: 'U004', name: 'Kavya Krishnan', email: 'pwd@nlams.gov.in', role: 'pwd_agency', department: 'PWD Tamil Nadu', designation: 'Project Engineer', state: 'Tamil Nadu', avatarColor: '#2d3748' },
  { id: 'U005', name: 'Thomas Joseph', email: 'lao@nlams.gov.in', role: 'land_acquisition_officer', department: 'Land Acquisition Unit', designation: 'Special Officer', state: 'Tamil Nadu', district: 'Tirunelveli', avatarColor: '#744210' },
  { id: 'U006', name: 'Meera Nair', email: 'rr@nlams.gov.in', role: 'rr_officer', department: 'R&R Division', designation: 'R&R Officer', state: 'Tamil Nadu', avatarColor: '#22543d' },
  { id: 'U007', name: 'Vikram Singh', email: 'admin@nlams.gov.in', role: 'system_admin', department: 'NLAMS IT Cell', designation: 'System Administrator', avatarColor: '#4a5568' },
].map((u) => ({ ...u, password: 'demo@123' }));

const _projects = generateProjects();
const _parcels = generateParcels(_projects);
const _notifications = generateNotifications(_projects);
const _awards = generateAwards(_projects);
const _compensation = generateCompensation(_projects);
const _families = generateFamilies(_projects);
const _milestones = generateMilestones(_projects);
const _alerts = generateAlerts(_projects);
const _audit = generateAuditLogs();
const _workflow = generateWorkflowTasks(_projects);
const _sync = generateSyncQueue();
const _docs = generateDocuments(_projects);

export const DATA = {
  projects: _projects,
  parcels: _parcels,
  notifications: _notifications,
  awards: _awards,
  compensation: _compensation,
  families: _families,
  milestones: _milestones,
  alerts: _alerts,
  audit: _audit,
  workflow: _workflow,
  sync: _sync,
  documents: _docs,
};

export function predictRisk(input: {
  land_acquisition_percentage: number;
  pending_parcels: number;
  disputed_parcels: number;
  compensation_pending_percentage: number;
  approval_delay_days: number;
  possession_delay_days: number;
  rr_pending_percentage: number;
}): { riskScore: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; recommendation: string; factors: { name: string; value: string; weight: number }[] } {
  const acqGap = Math.max(0, 100 - input.land_acquisition_percentage);
  const parcelRisk = Math.min(40, input.pending_parcels * 0.5 + input.disputed_parcels * 1.5);
  const compRisk = Math.min(25, input.compensation_pending_percentage * 0.5);
  const delayRisk = Math.min(20, input.approval_delay_days * 0.3 + input.possession_delay_days * 0.2);
  const rrRisk = Math.min(15, input.rr_pending_percentage * 0.3);
  const score = Math.round(Math.min(100, parcelRisk + compRisk + delayRisk + rrRisk + acqGap * 0.1));
  const level = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';
  let recommendation: string;
  if (level === 'CRITICAL') recommendation = 'Immediate escalation required. Prioritize compensation processing, dispute resolution, and milestone recovery plan.';
  else if (level === 'HIGH') recommendation = 'Prioritize compensation processing and district-level dispute resolution. Review milestone delays.';
  else if (level === 'MEDIUM') recommendation = 'Monitor pending parcels and expedite verification. Address compensation delays proactively.';
  else recommendation = 'Project progressing satisfactorily. Continue routine monitoring.';
  return {
    riskScore: score,
    riskLevel: level,
    recommendation,
    factors: [
      { name: 'Compensation Pending', value: `${input.compensation_pending_percentage}%`, weight: Math.round(compRisk) },
      { name: 'Land Disputes', value: `${input.disputed_parcels}`, weight: Math.round(input.disputed_parcels * 1.5) },
      { name: 'Possession Delay', value: `${input.possession_delay_days} days`, weight: Math.round(input.possession_delay_days * 0.2) },
      { name: 'R&R Pending', value: `${input.rr_pending_percentage}%`, weight: Math.round(rrRisk) },
    ],
  };
}
