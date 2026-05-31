import { useApp } from '@/context/AppContext';
import { Activity, Wrench, Zap, AlertTriangle, ClipboardCheck, Users, FolderKanban, Map, Database } from 'lucide-react';

const entityIcons: Record<string, React.ElementType> = {
  task: Wrench, equipment: Zap, issue: AlertTriangle, checklist: ClipboardCheck,
  owner: Users, phase: FolderKanban, zone: Map, project: Database,
};

const actionColors: Record<string, string> = {
  create: '#10b981', update: '#22d3ee', delete: '#ef4444', status_change: '#f59e0b',
  import: '#a855f7', export: '#3b82f6', sync: '#22d3ee', reset: '#ef4444',
};

export default function ActivityPage() {
  const { activity } = useApp();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity size={16} style={{ color: '#22d3ee' }} />
        <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Activity Log</h1>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>{activity.length}</span>
      </div>

      <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
        {activity.length === 0 && (
          <div className="card p-8 text-center text-[11px]" style={{ color: '#64748b' }}>No activity recorded yet. Actions you take will appear here.</div>
        )}
        {activity.map(entry => {
          const Icon = entityIcons[entry.entityType] || Activity;
          return (
            <div key={entry.id} className="card p-3 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${actionColors[entry.action]}15` }}>
                <Icon size={13} style={{ color: actionColors[entry.action] }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${actionColors[entry.action]}15`, color: actionColors[entry.action] }}>
                    {entry.action}
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: '#e2e8f0' }}>{entry.entityType}</span>
                  <span className="text-[10px] ml-auto" style={{ color: '#475569' }}>{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-[11px] mt-1" style={{ color: '#94a3b8' }}>{entry.details}</p>
                <span className="text-[9px]" style={{ color: '#475569' }}>by {entry.user}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
