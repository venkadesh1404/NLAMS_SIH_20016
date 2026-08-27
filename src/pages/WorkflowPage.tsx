import { useState, useMemo } from 'react';
import { DATA, STATES } from '@/data/mockData';
import { PageHeader, Card, FilterBar, Select, StatusBadge, Button, EmptyState } from '@/components/ui';
import { GitBranch, Download, CheckCircle2, XCircle, RotateCcw, ChevronRight } from 'lucide-react';

export default function WorkflowPage() {
  const { workflow, projects } = DATA;
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const filtered = useMemo(() => {
    return workflow.filter((w) => {
      if (statusFilter && w.status !== statusFilter) return false;
      if (priorityFilter && w.priority !== priorityFilter) return false;
      return true;
    });
  }, [workflow, statusFilter, priorityFilter]);

  return (
    <div>
      <PageHeader title="Workflow Engine" subtitle="Pending actions, approvals, and task routing across the acquisition lifecycle" actions={<Button variant="outline" size="sm" icon={Download}>Export</Button>} />

      {/* Workflow flow */}
      <Card className="mb-4">
        <p className="text-xs font-medium text-slate-600 mb-3">Acquisition Workflow Stages</p>
        <div className="flex items-center gap-1 text-xs flex-wrap">
          {['Proposal Submitted', 'District Scrutiny', 'State Review', 'Central Approval', 'Notification', 'Award', 'Compensation', 'Possession', 'R&R', 'Completion'].map((stage, i, arr) => (
            <div key={stage} className="flex items-center">
              <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">{stage}</span>
              {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-slate-400 mx-0.5" />}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card><p className="text-xs text-slate-500">Pending Tasks</p><p className="text-xl font-bold text-slate-800">{workflow.filter((w) => w.status === 'Pending').length}</p></Card>
        <Card><p className="text-xs text-slate-500">Urgent Priority</p><p className="text-xl font-bold text-slate-800">{workflow.filter((w) => w.priority === 'Urgent').length}</p></Card>
        <Card><p className="text-xs text-slate-500">High Priority</p><p className="text-xl font-bold text-slate-800">{workflow.filter((w) => w.priority === 'High').length}</p></Card>
        <Card><p className="text-xs text-slate-500">Total Tasks</p><p className="text-xl font-bold text-slate-800">{workflow.length}</p></Card>
      </div>

      <FilterBar>
        <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: 'Pending', label: 'Pending' }, { value: 'Approved', label: 'Approved' }, { value: 'Rejected', label: 'Rejected' }, { value: 'Returned', label: 'Returned' }, { value: 'Forwarded', label: 'Forwarded' }]} />
        <Select label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={[{ value: 'Urgent', label: 'Urgent' }, { value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]} />
      </FilterBar>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No tasks found" message="No workflow tasks match the current filters." icon={GitBranch} />
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded hover:bg-slate-50">
                <GitBranch className="w-5 h-5 text-[#1e3a5f] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-700">{task.currentStage} — {task.projectName}</p>
                    <StatusBadge status={task.priority} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Assigned to: {task.assignedTo} · Created: {task.createdDate}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button className="p-1.5 rounded text-green-600 hover:bg-green-50" title="Approve"><CheckCircle2 className="w-4 h-4" /></button>
                  <button className="p-1.5 rounded text-red-600 hover:bg-red-50" title="Reject"><XCircle className="w-4 h-4" /></button>
                  <button className="p-1.5 rounded text-orange-600 hover:bg-orange-50" title="Return"><RotateCcw className="w-4 h-4" /></button>
                  <button className="p-1.5 rounded text-blue-600 hover:bg-blue-50" title="Forward"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-2">API: GET /api/v1/workflow/tasks · POST /api/v1/workflow/{'{id}'}/approve · /reject · /return · /forward</p>
    </div>
  );
}
