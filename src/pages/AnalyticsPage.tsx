import { useState, useEffect, useMemo } from 'react';
import { ApiService } from '@/services/apiService';
import { PageHeader, Card, StatusBadge, ProgressBar, Button } from '@/components/ui';
import { Brain, TrendingUp, AlertTriangle, Cpu, Gauge, CheckCircle2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar,
} from 'recharts';
import type { Project, LandParcel, RiskPrediction } from '@/types';

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [parcels, setParcels] = useState<LandParcel[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProject, setSelectedProject] = useState('');
  const [input, setInput] = useState({
    land_acquisition_percentage: 62,
    pending_parcels: 42,
    disputed_parcels: 12,
    compensation_pending_percentage: 18,
    approval_delay_days: 14,
    possession_delay_days: 31,
    rr_pending_percentage: 22,
  });
  const [prediction, setPrediction] = useState<RiskPrediction>({
    riskScore: 48,
    riskLevel: 'MEDIUM',
    recommendation: 'Maintain proactive monitoring of pending revenue records and schedule timely joint possession surveys.',
    factors: [
      { name: 'Acquisition Gap', value: '38%', weight: 45 },
      { name: 'Pending Parcels', value: '42', weight: 40 },
      { name: 'Disputed Parcels', value: '12', weight: 50 },
      { name: 'Compensation Pending', value: '18%', weight: 30 },
      { name: 'Approval Delays', value: '14 days', weight: 25 },
      { name: 'Possession Delays', value: '31 days', weight: 45 },
      { name: 'R&R Incomplete', value: '22%', weight: 35 },
    ],
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [projs, pcls] = await Promise.all([
          ApiService.getProjects(),
          ApiService.getParcels(),
        ]);
        setProjects(projs);
        setParcels(pcls);
        if (projs.length > 0) {
          setSelectedProject(projs[0].id);
        }
      } catch (e) {
        console.error('Failed to load analytics data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const project = projects.find((p) => p.id === selectedProject);
  const projectParcels = parcels.filter((p) => p.projectId === selectedProject);

  const loadProject = () => {
    if (!project) return;
    const pending = projectParcels.filter((p) => p.acquisitionStatus === 'Pending' || p.acquisitionStatus === 'Proposed').length;
    const disputed = projectParcels.filter((p) => p.acquisitionStatus === 'Disputed').length;
    const newInput = {
      land_acquisition_percentage: project.acquisitionPct,
      pending_parcels: pending,
      disputed_parcels: disputed,
      compensation_pending_percentage: 100 - project.compensationPct,
      approval_delay_days: 0,
      possession_delay_days: 0,
      rr_pending_percentage: 100 - project.rrPct,
    };
    setInput(newInput);
    runPrediction(newInput);
  };

  const runPrediction = async (inputVals = input) => {
    try {
      const res = await ApiService.predictRisk(inputVals);
      setPrediction(res);
    } catch (e) {
      console.error('Prediction failed', e);
    }
  };

  const riskDistribution = useMemo(() => {
    return [
      { name: 'LOW (0-30)', count: projects.filter((p) => p.risk === 'LOW').length, fill: '#16a34a' },
      { name: 'MEDIUM (31-60)', count: projects.filter((p) => p.risk === 'MEDIUM').length, fill: '#f59e0b' },
      { name: 'HIGH (61-80)', count: projects.filter((p) => p.risk === 'HIGH').length, fill: '#ea580c' },
      { name: 'CRITICAL (81-100)', count: projects.filter((p) => p.risk === 'CRITICAL').length, fill: '#dc2626' },
    ];
  }, [projects]);

  const topRisks = useMemo(() => {
    return [...projects]
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10)
      .map((p) => ({
        name: p.id,
        score: p.riskScore,
        fill: p.risk === 'CRITICAL' ? '#dc2626' : p.risk === 'HIGH' ? '#ea580c' : p.risk === 'MEDIUM' ? '#f59e0b' : '#16a34a',
      }));
  }, [projects]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI Decision Support & Predictive Risk Engine"
        subtitle="Land Acquisition Delay Risk Prediction using Rule-Based Feature Weighting and Machine Learning"
        actions={
          <span className="text-xs text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded font-medium">
            Prototype Prediction – Synthetic Data
          </span>
        }
      />

      {/* Warning banner */}
      <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong>Prototype Notice:</strong> Deterministic delay risk scoring (0–30 LOW, 31–60 MEDIUM, 61–80 HIGH, 81–100 CRITICAL) calculated from acquisition progress, pending parcels, disputed revenue boundaries, compensation disbursement lag, and R&R status.
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Risk predictor */}
        <Card title="Delay Risk Prediction Model" actions={<Cpu className="w-4 h-4 text-slate-400" />}>
          <div className="mb-3">
            <label className="text-xs font-medium text-slate-600 block mb-1">Select Active Project</label>
            <div className="flex gap-2">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="flex-1 text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.id} — {p.name}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={loadProject}>Load Data</Button>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: 'land_acquisition_percentage', label: 'Land Acquisition Progress', max: 100, suffix: '%' },
              { key: 'pending_parcels', label: 'Pending Parcels', max: 150, suffix: '' },
              { key: 'disputed_parcels', label: 'Disputed / Litigated Parcels', max: 50, suffix: '' },
              { key: 'compensation_pending_percentage', label: 'Compensation Pending Gap', max: 100, suffix: '%' },
              { key: 'approval_delay_days', label: 'Statutory Approval Delay', max: 120, suffix: ' days' },
              { key: 'possession_delay_days', label: 'Physical Possession Delay', max: 120, suffix: ' days' },
              { key: 'rr_pending_percentage', label: 'R&R Incomplete Gap', max: 100, suffix: '%' },
            ].map((f) => (
              <div key={f.key}>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-slate-600 font-medium">{f.label}</label>
                  <span className="text-slate-800 font-bold">{(input as any)[f.key]}{f.suffix}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={f.max}
                  value={(input as any)[f.key]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const updated = { ...input, [f.key]: val };
                    setInput(updated);
                    runPrediction(updated);
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1e3a5f]"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase">Calculated Risk Level</span>
              <StatusBadge status={prediction.riskLevel} size="md" />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24">
                <RadialBarChart
                  width={96}
                  height={96}
                  data={[{
                    name: 'score',
                    value: prediction.riskScore,
                    fill: prediction.riskLevel === 'CRITICAL' ? '#dc2626' : prediction.riskLevel === 'HIGH' ? '#ea580c' : prediction.riskLevel === 'MEDIUM' ? '#f59e0b' : '#16a34a',
                  }]}
                  innerRadius="70%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={90 - (prediction.riskScore / 100) * 360}
                >
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
                      <span className="text-slate-800 font-medium">{f.value}</span>
                    </div>
                    <ProgressBar
                      value={f.weight}
                      color={prediction.riskLevel === 'CRITICAL' ? 'bg-red-600' : prediction.riskLevel === 'HIGH' ? 'bg-orange-500' : prediction.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-green-600'}
                      height="h-1.5"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 p-2.5 bg-white rounded border border-slate-200">
              <p className="text-xs font-bold text-slate-800 mb-0.5">Recommended Administrative Intervention:</p>
              <p className="text-xs text-slate-600 leading-relaxed">{prediction.recommendation}</p>
            </div>
          </div>
        </Card>

        {/* Charts */}
        <div className="space-y-4">
          <Card title="Risk Distribution Across All Projects">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riskDistribution} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskDistribution.map((d, i) => <Bar key={i} dataKey="count" fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Top 10 High-Risk Projects Requiring Intervention">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topRisks} layout="vertical" margin={{ top: 5, right: 10, left: 70, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {topRisks.map((d, i) => <Bar key={i} dataKey="score" fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* Model info */}
      <Card title="Decision Support Architecture">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded">
            <Brain className="w-4 h-4 text-[#1e3a5f] mb-1" />
            <p className="font-semibold text-slate-800">Scoring Engine</p>
            <p className="text-slate-500">7-Factor Weighted Delay Matrix</p>
          </div>
          <div className="p-3 bg-slate-50 rounded">
            <Gauge className="w-4 h-4 text-[#1e3a5f] mb-1" />
            <p className="font-semibold text-slate-800">Risk Thresholds</p>
            <p className="text-slate-500">0-30 LOW / 31-60 MED / 61-80 HIGH / 81-100 CRIT</p>
          </div>
          <div className="p-3 bg-slate-50 rounded">
            <TrendingUp className="w-4 h-4 text-[#1e3a5f] mb-1" />
            <p className="font-semibold text-slate-800">API Endpoint</p>
            <p className="text-slate-500 font-mono">POST /api/predict-risk</p>
          </div>
          <div className="p-3 bg-slate-50 rounded">
            <CheckCircle2 className="w-4 h-4 text-[#1e3a5f] mb-1" />
            <p className="font-semibold text-slate-800">Decision Outcome</p>
            <p className="text-slate-500">Automated SLA escalation triggers</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
