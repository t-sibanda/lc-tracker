import { useApp } from '@/context/AppContext';
import { AlertTriangle, Clock } from 'lucide-react';

export default function DueDateAlerts() {
  const { tasks } = useApp();
  const today = new Date().toISOString().split('T')[0];

  const overdue = tasks.filter(t => {
    if (!t.endDate || t.status === 'Complete') return false;
    return t.endDate < today;
  }).slice(0, 5);

  const dueThisWeek = tasks.filter(t => {
    if (!t.endDate || t.status === 'Complete') return false;
    const end = new Date(t.endDate);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return end >= now && end <= weekFromNow;
  }).slice(0, 5);

  if (overdue.length === 0 && dueThisWeek.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {overdue.length > 0 && (
        <div className="card p-3" style={{ borderLeft: '3px solid #ef4444' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={13} style={{ color: '#ef4444' }} />
            <span className="text-[11px] font-bold" style={{ color: '#ef4444' }}>Overdue ({overdue.length})</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {overdue.map(t => (
              <div key={t.id} className="flex items-center justify-between text-[10px] p-1.5 rounded" style={{ background: 'rgba(239,68,68,0.05)' }}>
                <span className="truncate flex-1" style={{ color: '#e2e8f0' }}>{t.description}</span>
                <span className="shrink-0 ml-2" style={{ color: '#ef4444' }}>{t.endDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {dueThisWeek.length > 0 && (
        <div className="card p-3" style={{ borderLeft: '3px solid #f59e0b' }}>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={13} style={{ color: '#f59e0b' }} />
            <span className="text-[11px] font-bold" style={{ color: '#f59e0b' }}>Due This Week ({dueThisWeek.length})</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {dueThisWeek.map(t => (
              <div key={t.id} className="flex items-center justify-between text-[10px] p-1.5 rounded" style={{ background: 'rgba(245,158,11,0.05)' }}>
                <span className="truncate flex-1" style={{ color: '#e2e8f0' }}>{t.description}</span>
                <span className="shrink-0 ml-2" style={{ color: '#f59e0b' }}>{t.endDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
