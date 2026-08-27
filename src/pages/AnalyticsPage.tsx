import { useState } from 'react';
import { DATA, predictRisk } from '@/data/mockData';
import { PageHeader, Card, StatusBadge, ProgressBar, Button, Select } from '@/components/ui';
import { Brain, TrendingUp, AlertTriangle, Activity, Cpu, Gauge } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar,
} from 'recharts';

export default function AnalyticsPage() {
  const { projects, parcels } = DATA;
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || '');
  const [input, setInput] = useState({
    land_acquisition_percentage: 62,
    pending_parcels: 42,
    disputed_parcels: 12,
    compensation_pending_percentage: 18,
    approval_delay_days: 14,
    possession_delay_days: 31,
    rr_pending_percentage: 22,
  });

  const project = projects.find((p) => p.id === selectedProject);
  const projectParcels = parcels.filter((p) => p.projectId === selectedProject);

  const loadProject = () => {
    if (!project) return;
    const pending = projectParcels.filter((p) => p.acquisitionStatus === 'Pending' || p.acquisitionStatus === 'Proposed').length;
    const disputed = projectParcels.filter((p) => p.acquisitionStatus === 'Disputed').length;
    setInput({
      land_acquisition_percentage: project.acquisitionPct,
      pending_parcels: pending,
      disputed_parcels: disputed,
      compensation_pending_percentage: 100 - project.compensationPct,
      approval_delay_days: 0,
      possession_delay_days: 0,
      rr_pending_percentage: 100 - project.rrPct,
    });
  };

  const prediction = predictRisk(input);

  const riskDistribution = [
    { name: 'LOW', count: projects.filter((p) => p.risk === 'LOW').length, fill: '#16a34a' },
    { name: 'MEDIUM', count: projects.filter((p) => p.risk === 'MEDIUM').length, fill: '#f59e0b' },
    { name: 'HIGH', count: projects.filter((p) => p.risk === 'HIGH').length, fill: '#ea580c' },
    { name: 'CRITICAL', count: projects.filter((p) => p.risk === 'CRITICAL').length, fill: '#dc2626' },
  ];

  const topRisks = [...projects].sort((a, b) => b.riskScore - a.riskScore).slice(0, 10).map((p) => ({
    name: p.id, score: p.riskScore, fill: p.risk === 'CRITICAL' ? '#dc2626' : p.risk === 'HIGH' ? '#ea580c' : p.risk === 'MEDIUM' ? '#f59e0b' : '#16a34a',
  }));

  return (
    <div>
      <PageHeader
        title="Analytics & AI Decision Support"
        subtitle="Land Acquisition Delay Risk Prediction using Machine Learning"
        actions={<span className="text-xs text-amber-700 bg-amber-50 border border-amber-300 px-2 py-1 rounded">Prototype Decision-Support Prediction</span>}
      />

      {/* Warning banner */}
      <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong>Disclaimer:</strong> Model trained using prototype/sample data; not for official decision-making. This is a demonstration of AI-based decision support for SIH evaluation.
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Risk predictor */}
        <Card title="Delay Risk Predictor" actions={<Cpu className="w-4 h-4 text-slate-400" />}>
          <div className="mb-3">
            <label className="text-xs font-medium text-slate-600 block mb-1">Select Project</label>
            <div className="flex gap-2">
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="flex-1 text-sm border border-slate-300 rounded px-2 py-1.5 bg-white">
                {projects.map((p) => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
              </select>
              <Button variant="outline" size="sm" onClick={loadProject}>Load Data</Button>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: 'land_acquisition_percentage', label: 'Land Acquisition %', max: 100, suffix: '%' },
              { key: 'pending_parcels', label: 'Pending Parcels', max: 200, suffix: '' },
              { key: 'disputed_parcels', label: 'Disputed Parcels', max: 50, suffix: '' },
              { key: 'compensation_pending_percentage', label: 'Compensation Pending %', max: 100, suffix: '%' },
              { key: 'approval_delay_days', label: 'Approval Delay (days)', max: 120, suffix: ' days' },
              { key: 'possession_delay_days', label: 'Possession Delay (days)', max: 120, suffix: ' days' },
              { key: 'rr_pending_percentage', label: 'R&R Pending %', max: 100, suffix: '%' },
            ].map((f) => (
              <div key={f.key}>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-slate-600">{f.label}</label>
                  <span className="text-slate-700 font-medium">{(input as any)[f.key]}{f.suffix}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={f.max}
                  value={(input as any)[f.key]}
                  onChange={(e) => setInput({ ...input, [f.key]: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1e3a5f]"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Risk Score</span>
              <StatusBadge status={prediction.riskLevel} size="md" />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24">
                <RadialBarChart width={96} height={96} data={[{ name: 'score', value: prediction.riskScore, fill: prediction.riskLevel === 'CRITICAL' ? '#dc2626' : prediction.riskLevel === 'HIGH' ? '#ea580c' : prediction.riskLevel === 'MEDIUM' ? '#f59e0b' : '#16a34a' }]} innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={90 - (prediction.riskScore / 100) * 360}>
                  <RadialBar dataKey="value" cornerRadius={6} />
                </RadialBarChart>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-slate-800">{prediction.riskScore}</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                {prediction.factors.map((f) => (
                  <div key={f.name}>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">{f.name}</span>
                      <span className="text-slate-700 font-medium">{f.value}</span>
                    </div>
                    <ProgressBar value={f.weight} color={prediction.riskLevel === 'CRITICAL' ? 'bg-red-600' : 'bg-orange-500'} height="h-1" />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 p-2 bg-white rounded border border-slate-200">
              <p className="text-xs font-medium text-slate-700 mb-1">Recommended Action:</p>
              <p className="text-xs text-slate-600">{prediction.recommendation}</p>
            </div>
          </div>
        </Card>

        {/* Charts */}
        <div className="space-y-4">
          <Card title="Risk Distribution Across Projects">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riskDistribution} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskDistribution.map((d, i) => <Bar key={i} dataKey="count" fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Top 10 High-Risk Projects">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topRisks} layout="vertical" margin={{ top: 5, right: 10, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {topRisks.map((d, i) => <Bar key={i} dataKey="score" fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* ML Model Info */}
      <Card title="ML Model Information">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded">
            <Brain className="w-4 h-4 text-slate-400 mb-1" />
            <p className="font-medium text-slate-700">Algorithm</p>
            <p className="text-slate-500">Random Forest Classifier</p>
          </div>
          <div className="p-3 bg-slate-50 rounded">
            <Activity className="w-4 h-4 text-slate-400 mb-1" />
            <p className="font-medium text-slate-700">Training Data</p>
            <p className="text-slate-500">Synthetic sample (500 records)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded">
            <Gauge className="w-4 h-4 text-slate-400 mb-1" />
            <p className="font-medium text-slate-700">Accuracy</p>
            <p className="text-slate-500">~87% (cross-validated)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded">
            <TrendingUp className="w-4 h-4 text-slate-400 mb-1" />
            <p className="font-medium text-slate-700">Features</p>
            <p className="text-slate-500">10 input features</p>
          </div>
        </div>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          <strong>API:</strong> POST /api/v1/analytics/predict-delay — Accepts project metrics, returns risk score (0–100), risk level (LOW/MEDIUM/HIGH/CRITICAL), and recommended action.
        </div>
      </Card>
    </div>
  );
}
