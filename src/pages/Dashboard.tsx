import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard, Wrench, AlertTriangle, Zap, ClipboardCheck,
  TrendingUp, Clock, CheckCircle2, BarChart3, FileText, Download
} from 'lucide-react';
import DueDateAlerts from '@/components/DueDateAlerts';

function KPICard({ icon: Icon, label, value, sub, color, onClick }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="card p-4 text-left w-full transition-all hover:scale-[1.01] hover:shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium" style={{ color: '#94a3b8' }}>{label}</span>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] mt-1" style={{ color: '#64748b' }}>{sub}</div>}
    </button>
  );
}

export default function Dashboard() {
  const { tasks, equipment, issues, checklists } = useApp();
  const navigate = useNavigate();

  const projectTasks = tasks.filter(t => t.scope === 'project');
  const zoneTasks = tasks.filter(t => t.scope === 'zone');

  const taskComplete = projectTasks.filter(t => t.status === 'Complete').length;
  const taskInProgress = projectTasks.filter(t => t.status === 'In Progress').length;
  const taskNotStarted = projectTasks.filter(t => t.status === 'Not Started').length;
  const taskPercent = projectTasks.length > 0 ? Math.round(projectTasks.reduce((s, t) => s + t.percentComplete, 0) / projectTasks.length) : 0;

  const zonePercent = zoneTasks.length > 0 ? Math.round(zoneTasks.reduce((s, t) => s + t.percentComplete, 0) / zoneTasks.length) : 0;

  const eqCommissioned = equipment.filter(e => e.status === 'L5 - Integrated').length;
  const eqPercent = equipment.length > 0 ? Math.round(equipment.reduce((s, e) => s + e.percentComplete, 0) / equipment.length) : 0;

  const openIssues = issues.filter(i => i.status !== 'Closed-Cx Verified' && i.status !== 'Rejected').length;
  const highIssues = issues.filter(i => (i.priority === 'High' || i.priority === 'Critical') && i.status !== 'Closed-Cx Verified').length;

  const clComplete = checklists.filter(c => c.status === 'Complete').length;
  const clPercent = checklists.length > 0 ? Math.round(checklists.reduce((s, c) => s + c.percentComplete, 0) / checklists.length) : 0;

  const overallPercent = Math.round((taskPercent + zonePercent + eqPercent) / 3);

  const phaseBreakdown = [
    { name: 'Kickoff', pct: 100 },
    { name: 'Requirements', pct: 100 },
    { name: 'Design', pct: 100 },
    { name: 'Development', pct: 65 },
    { name: 'Test', pct: 30 },
    { name: 'Closeout', pct: 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={16} style={{ color: '#22d3ee' }} />
          <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Project Overview</h1>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>21-0488 Comstock</span>
      </div>

      <DueDateAlerts />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard icon={TrendingUp} label="Overall" value={`${overallPercent}%`} sub={`${tasks.length} total tasks`} color="#22d3ee" onClick={() => navigate('/tasks')} />
        <KPICard icon={Wrench} label="Project Tasks" value={`${taskPercent}%`} sub={`${taskComplete}/${projectTasks.length} complete`} color="#22d3ee" onClick={() => navigate('/tasks')} />
        <KPICard icon={Zap} label="Equipment" value={`${eqPercent}%`} sub={`${eqCommissioned}/${equipment.length} commissioned`} color="#22d3ee" onClick={() => navigate('/equipment')} />
        <KPICard icon={AlertTriangle} label="Issues" value={`${openIssues}`} sub={`${highIssues} high priority`} color="#ef4444" onClick={() => navigate('/issues')} />
        <KPICard icon={ClipboardCheck} label="Checklists" value={`${clPercent}%`} sub={`${clComplete}/${checklists.length} complete`} color="#22d3ee" onClick={() => navigate('/checklists')} />
        <KPICard icon={BarChart3} label="Zone Tests" value={`${zonePercent}%`} sub={`${zoneTasks.length} zone tests`} color="#22d3ee" onClick={() => navigate('/zones')} />
      </div>

      {/* Task Status + Phase Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Task Status */}
        <div className="card p-4">
          <h3 className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: '#22d3ee' }}>
            <CheckCircle2 size={13} /> Task Status
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <div className="text-lg font-bold" style={{ color: '#10b981' }}>{taskComplete}</div>
              <div className="text-[10px]" style={{ color: '#6ee7b7' }}>Complete</div>
            </div>
            <div className="text-center p-2.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <div className="text-lg font-bold" style={{ color: '#f59e0b' }}>{taskInProgress}</div>
              <div className="text-[10px]" style={{ color: '#fcd34d' }}>In Progress</div>
            </div>
            <div className="text-center p-2.5 rounded-lg" style={{ background: 'rgba(100,116,139,0.1)' }}>
              <div className="text-lg font-bold" style={{ color: '#94a3b8' }}>{taskNotStarted}</div>
              <div className="text-[10px]" style={{ color: '#cbd5e1' }}>Not Started</div>
            </div>
          </div>
        </div>

        {/* Phase Progress */}
        <div className="card p-4">
          <h3 className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: '#22d3ee' }}>
            <Clock size={13} /> Phase Progress
          </h3>
          <div className="space-y-2">
            {phaseBreakdown.map(p => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="text-[10px] w-24 shrink-0 truncate" style={{ color: '#94a3b8' }}>{p.name}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(51,65,85,0.5)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${p.pct}%`, background: p.pct === 100 ? '#10b981' : p.pct > 0 ? '#22d3ee' : '#334155' }} />
                </div>
                <span className="text-[10px] w-8 text-right" style={{ color: '#64748b' }}>{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Reports */}
      <div className="card p-4">
        <h3 className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: '#22d3ee' }}>
          <FileText size={13} /> Quick Exports
        </h3>
        <div className="flex flex-wrap gap-2">
          <ExportButton label="Tasks CSV" onClick={() => downloadCSV(tasks.map(t => ({ ...t } as Record<string, unknown>)), 'tasks')} />
          <ExportButton label="Equipment CSV" onClick={() => downloadCSV(equipment.map(e => ({ ...e } as Record<string, unknown>)), 'equipment')} />
          <ExportButton label="Issues CSV" onClick={() => downloadCSV(issues.map(i => ({ ...i } as Record<string, unknown>)), 'issues')} />
          <ExportButton label="Full Backup" onClick={() => navigate('/data')} />
        </div>
      </div>
    </div>
  );
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors hover:bg-cyan-400/20" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>
      <Download size={11} /> {label}
    </button>
  );
}

function downloadCSV(data: Array<Record<string, unknown>>, filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => {
    const val = row[h];
    return typeof val === 'string' && val.includes(',') ? `"${val}"` : String(val ?? '');
  }).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
