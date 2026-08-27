import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DATA, predictRisk } from '@/data/mockData';
import { PageHeader, Card, StatusBadge, ProgressBar, EmptyState } from '@/components/ui';
import { Building2, ArrowLeft, Map, FileText, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';

const TABS = ['Overview', 'Acquisition', 'Land Parcels', 'Notifications', 'Awards', 'Compensation', 'Possession', 'R&R', 'Documents', 'GIS', 'Timeline', 'Audit History'];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { projects, parcels, notifications, awards, compensation, families, milestones, documents, audit } = DATA;
  const [activeTab, setActiveTab] = useState('Overview');

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);

  if (!project) {
    return (
      <Card><EmptyState title="Project not found" message="The requested project could not be found." icon={Building2} /></Card>
    );
  }

  const projectParcels = parcels.filter((p) => p.projectId === project.id);
  const projectNotifs = notifications.filter((n) => n.projectId === project.id);
  const projectAwards = awards.filter((a) => a.projectId === project.id);
  const projectComp = compensation.filter((c) => c.projectId === project.id);
  const projectFamilies = families.filter((f) => f.projectId === project.id);
  const projectMilestones = milestones.filter((m) => m.projectId === project.id);
  const projectDocs = documents.filter((d) => d.projectId === project.id);
  const projectAudit = audit.filter((a) => a.recordId === project.id);

  const risk = predictRisk({
    land_acquisition_percentage: project.acquisitionPct,
    pending_parcels: projectParcels.filter((p) => p.acquisitionStatus === 'Pending' || p.acquisitionStatus === 'Proposed').length,
    disputed_parcels: projectParcels.filter((p) => p.acquisitionStatus === 'Disputed').length,
    compensation_pending_percentage: 100 - project.compensationPct,
    approval_delay_days: projectMilestones.find((m) => m.stage === 'Approval')?.delayDays || 0,
    possession_delay_days: projectMilestones.find((m) => m.stage === 'Possession')?.delayDays || 0,
    rr_pending_percentage: 100 - project.rrPct,
  });

  return (
    <div>
      <Link to="/projects" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-2">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
      </Link>
      <PageHeader
        title={project.name}
        subtitle={`${project.id} · ${project.agency} · ${project.district}, ${project.state}`}
        actions={<StatusBadge status={project.status} size="md" />}
      />

      {/* Progress summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card>
          <p className="text-xs text-slate-500 font-medium">Acquisition</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{project.acquisitionPct}%</p>
          <ProgressBar value={project.acquisitionPct} color="bg-blue-600" />
          <p className="text-xs text-slate-500 mt-1">{project.landAcquired} / {project.landRequired} ha</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500 font-medium">Compensation</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{project.compensationPct}%</p>
          <ProgressBar value={project.compensationPct} color="bg-amber-500" />
          <p className="text-xs text-slate-500 mt-1">₹{project.compensationDisbursed} / ₹{project.compensationAssessed} Cr</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500 font-medium">Possession</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{project.possessionPct}%</p>
          <ProgressBar value={project.possessionPct} color="bg-teal-600" />
        </Card>
        <Card>
          <p className="text-xs text-slate-500 font-medium">R&R</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{project.rrPct}%</p>
          <ProgressBar value={project.rrPct} color="bg-green-600" />
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-4 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card title="Project Information" className="lg:col-span-2">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div><dt className="text-xs text-slate-500">Project ID</dt><dd className="font-mono text-slate-700">{project.id}</dd></div>
              <div><dt className="text-xs text-slate-500">Implementing Agency</dt><dd className="text-slate-700">{project.agency}</dd></div>
              <div><dt className="text-xs text-slate-500">Project Type</dt><dd className="text-slate-700">{project.type}</dd></div>
              <div><dt className="text-xs text-slate-500">State / District</dt><dd className="text-slate-700">{project.state} / {project.district}</dd></div>
              <div><dt className="text-xs text-slate-500">Estimated Cost</dt><dd className="text-slate-700">₹{project.estimatedCost.toLocaleString()} Cr</dd></div>
              <div><dt className="text-xs text-slate-500">Target Date</dt><dd className="text-slate-700">{project.targetDate}</dd></div>
              <div><dt className="text-xs text-slate-500">Affected Families</dt><dd className="text-slate-700">{project.affectedFamilies}</dd></div>
              <div><dt className="text-xs text-slate-500">Displaced Families</dt><dd className="text-slate-700">{project.displacedFamilies}</dd></div>
              <div className="col-span-2"><dt className="text-xs text-slate-500">Description</dt><dd className="text-slate-700 mt-1">{project.description}</dd></div>
            </dl>
          </Card>
          <Card title="AI Risk Prediction">
            <div className="text-center mb-3">
              <p className="text-3xl font-bold text-slate-800">{risk.riskScore}</p>
              <p className="text-xs text-slate-500">Risk Score (0–100)</p>
              <div className="mt-2"><StatusBadge status={risk.riskLevel} size="md" /></div>
            </div>
            <div className="space-y-2">
              {risk.factors.map((f) => (
                <div key={f.name}>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">{f.name}</span>
                    <span className="text-slate-700 font-medium">{f.value}</span>
                  </div>
                  <ProgressBar value={f.weight} color={risk.riskLevel === 'CRITICAL' ? 'bg-red-600' : risk.riskLevel === 'HIGH' ? 'bg-orange-500' : 'bg-amber-500'} height="h-1.5" />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-3 p-2 bg-slate-50 rounded">{risk.recommendation}</p>
            <p className="text-[10px] text-slate-400 mt-2">Prototype Decision-Support Prediction — Model trained using sample data; not for official decision-making.</p>
          </Card>
        </div>
      )}

      {activeTab === 'Acquisition' && (
        <Card title="Acquisition Progress">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded"><p className="text-xs text-slate-500">Land Required</p><p className="text-xl font-bold text-slate-800">{project.landRequired} ha</p></div>
            <div className="p-3 bg-cyan-50 rounded"><p className="text-xs text-slate-500">Land Notified</p><p className="text-xl font-bold text-slate-800">{project.landNotified} ha</p></div>
            <div className="p-3 bg-green-50 rounded"><p className="text-xs text-slate-500">Land Acquired</p><p className="text-xl font-bold text-slate-800">{project.landAcquired} ha</p></div>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Stage', 'Status', 'Progress'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {projectMilestones.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2 text-slate-700">{m.stage}</td>
                  <td className="px-3 py-2"><StatusBadge status={m.status} /></td>
                  <td className="px-3 py-2">{m.status === 'Completed' ? '100%' : m.status === 'In Progress' ? '50%' : '0%'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'Land Parcels' && (
        <Card title={`Land Parcels (${projectParcels.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Parcel ID', 'Survey No.', 'Village', 'Area (ha)', 'Land Type', 'Acquisition', 'Compensation', 'Possession', 'R&R'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {projectParcels.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-slate-600">{p.id}</td>
                    <td className="px-3 py-2 text-slate-600">{p.surveyNumber}</td>
                    <td className="px-3 py-2 text-slate-600">{p.village}</td>
                    <td className="px-3 py-2 text-slate-600 text-right">{p.area}</td>
                    <td className="px-3 py-2 text-slate-600">{p.landType}</td>
                    <td className="px-3 py-2"><StatusBadge status={p.acquisitionStatus} /></td>
                    <td className="px-3 py-2"><StatusBadge status={p.compensationStatus} /></td>
                    <td className="px-3 py-2"><StatusBadge status={p.possessionStatus} /></td>
                    <td className="px-3 py-2"><StatusBadge status={p.rrStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'Notifications' && (
        <Card title={`Notifications (${projectNotifs.length})`}>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200"><tr>{['ID', 'Type', 'Number', 'Issue Date', 'Publication Date', 'Status', 'Remarks'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {projectNotifs.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-slate-600">{n.id}</td>
                  <td className="px-3 py-2 text-slate-600">{n.type}</td>
                  <td className="px-3 py-2 text-slate-600">{n.number}</td>
                  <td className="px-3 py-2 text-slate-600">{n.issueDate}</td>
                  <td className="px-3 py-2 text-slate-600">{n.publicationDate}</td>
                  <td className="px-3 py-2"><StatusBadge status={n.status} /></td>
                  <td className="px-3 py-2 text-slate-600">{n.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'Awards' && (
        <Card title={`Awards (${projectAwards.length})`}>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Award ID', 'Village', 'Survey No.', 'Award Date', 'Land Area (ha)', 'Award Amount (₹ Cr)', 'Beneficiaries', 'Status'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {projectAwards.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-slate-600">{a.id}</td>
                  <td className="px-3 py-2 text-slate-600">{a.village}</td>
                  <td className="px-3 py-2 text-slate-600">{a.surveyNumber}</td>
                  <td className="px-3 py-2 text-slate-600">{a.awardDate}</td>
                  <td className="px-3 py-2 text-slate-600 text-right">{a.landArea}</td>
                  <td className="px-3 py-2 text-slate-600 text-right">{a.awardAmount}</td>
                  <td className="px-3 py-2 text-slate-600 text-right">{a.beneficiaryCount}</td>
                  <td className="px-3 py-2"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'Compensation' && (
        <Card title={`Compensation Records (${projectComp.length})`}>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Case ID', 'Beneficiary', 'Land Area (ha)', 'Assessed (₹)', 'Approved (₹)', 'Paid (₹)', 'Payment Date', 'Status'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {projectComp.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-slate-600">{c.id}</td>
                  <td className="px-3 py-2 text-slate-600">{c.beneficiaryId}</td>
                  <td className="px-3 py-2 text-slate-600 text-right">{c.landArea}</td>
                  <td className="px-3 py-2 text-slate-600 text-right">{c.assessedAmount}</td>
                  <td className="px-3 py-2 text-slate-600 text-right">{c.approvedAmount}</td>
                  <td className="px-3 py-2 text-slate-600 text-right">{c.paidAmount}</td>
                  <td className="px-3 py-2 text-slate-600">{c.paymentDate || '—'}</td>
                  <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'Possession' && (
        <Card title="Possession Status">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Parcel ID', 'Village', 'Area (ha)', 'Compensation', 'Possession Status'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {projectParcels.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-slate-600">{p.id}</td>
                    <td className="px-3 py-2 text-slate-600">{p.village}</td>
                    <td className="px-3 py-2 text-slate-600 text-right">{p.area}</td>
                    <td className="px-3 py-2"><StatusBadge status={p.compensationStatus} /></td>
                    <td className="px-3 py-2"><StatusBadge status={p.possessionStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'R&R' && (
        <Card title={`Affected Families (${projectFamilies.length})`}>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Family ID', 'Village', 'Category', 'Land Affected (ha)', 'Displacement', 'R&R Eligible', 'R&R Benefit', 'R&R Status'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {projectFamilies.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-slate-600">{f.id}</td>
                  <td className="px-3 py-2 text-slate-600">{f.village}</td>
                  <td className="px-3 py-2 text-slate-600">{f.category}</td>
                  <td className="px-3 py-2 text-slate-600 text-right">{f.landAffected}</td>
                  <td className="px-3 py-2"><StatusBadge status={f.displacementStatus} /></td>
                  <td className="px-3 py-2 text-slate-600">{f.rrEligibility ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2 text-slate-600">{f.rrBenefit}</td>
                  <td className="px-3 py-2"><StatusBadge status={f.rrStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'Documents' && (
        <Card title={`Documents (${projectDocs.length})`}>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Document ID', 'Category', 'File Name', 'Uploaded By', 'Upload Date', 'Version', 'Size', 'Status'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {projectDocs.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-slate-600">{d.id}</td>
                  <td className="px-3 py-2 text-slate-600">{d.category}</td>
                  <td className="px-3 py-2 text-slate-600"><span className="inline-flex items-center gap-1"><FileText className="w-3 h-3" />{d.fileName}</span></td>
                  <td className="px-3 py-2 text-slate-600">{d.uploadedBy}</td>
                  <td className="px-3 py-2 text-slate-600">{d.uploadDate}</td>
                  <td className="px-3 py-2 text-slate-600">{d.version}</td>
                  <td className="px-3 py-2 text-slate-600">{d.size}</td>
                  <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'GIS' && (
        <Card title="GIS Location" actions={<Link to={`/gis?project=${project.id}`} className="text-xs text-blue-600 hover:underline">Open in GIS →</Link>}>
          <div className="bg-slate-100 rounded p-6 text-center">
            <Map className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">{projectParcels.length} parcels mapped in {project.district}, {project.state}</p>
            <p className="text-xs text-slate-500 mt-1">Coordinates range: {projectParcels.length > 0 ? `${projectParcels[0].lat}, ${projectParcels[0].lng}` : 'N/A'}</p>
            <Link to={`/gis?project=${project.id}`} className="inline-block mt-3 text-xs text-blue-600 hover:underline">View on interactive map</Link>
          </div>
        </Card>
      )}

      {activeTab === 'Timeline' && (
        <Card title="Project Timeline & Milestones">
          <div className="relative">
            {projectMilestones.map((m, i) => {
              const Icon = m.status === 'Completed' ? CheckCircle2 : m.status === 'Delayed' ? XCircle : m.status === 'In Progress' ? Clock : AlertTriangle;
              const color = m.status === 'Completed' ? 'text-green-600' : m.status === 'Delayed' ? 'text-red-600' : m.status === 'In Progress' ? 'text-blue-600' : 'text-slate-400';
              return (
                <div key={m.id} className="flex gap-3 pb-4 relative">
                  {i < projectMilestones.length - 1 && <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-200" />}
                  <div className={`w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">{m.stage}</p>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Planned: {m.plannedDate} · Actual: {m.actualDate || 'Pending'}</p>
                    <p className="text-xs text-slate-500">Authority: {m.authority}</p>
                    {m.delayDays > 0 && <p className="text-xs text-red-600 mt-0.5">Delayed by {m.delayDays} days</p>}
                    <p className="text-xs text-slate-500 mt-0.5">{m.remarks}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {activeTab === 'Audit History' && (
        <Card title={`Audit History (${projectAudit.length} entries)`}>
          {projectAudit.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No audit records for this project.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200"><tr>{['Timestamp', 'User', 'Role', 'Module', 'Action', 'Origin', 'Sync'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {projectAudit.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{a.timestamp}</td>
                    <td className="px-3 py-2 text-slate-600">{a.user}</td>
                    <td className="px-3 py-2 text-slate-600">{a.role}</td>
                    <td className="px-3 py-2 text-slate-600">{a.module}</td>
                    <td className="px-3 py-2"><StatusBadge status={a.action} /></td>
                    <td className="px-3 py-2"><StatusBadge status={a.origin} /></td>
                    <td className="px-3 py-2 text-slate-600">{a.syncTimestamp || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
