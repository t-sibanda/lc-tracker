import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  TestTubes, Search, ChevronDown, ChevronRight, CheckCircle2, PlayCircle, Circle,
  ClipboardCheck, Plus, X, Trash2, Pencil
} from 'lucide-react';
import SidebarFilter from '@/components/SidebarFilter';

const statusColors: Record<string, string> = { 'Complete': '#10b981', 'In Progress': '#f59e0b', 'Not Started': '#64748b' };

export default function CommissioningPage() {
  const { tasks, checklists, updateTask, deleteTask, addChecklist, updateChecklist, deleteChecklist } = useApp();
  const [activeTab, setActiveTab] = useState<'tasks' | 'checklists'>('tasks');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [expandedZone, setExpandedZone] = useState<string | null>(null);

  // Only commissioning tasks (zone + pre-install scope)
  const cxTasks = useMemo(() => tasks.filter(t => t.scope === 'zone' || t.scope === 'pre-install'), [tasks]);

  const zones = useMemo(() => [...new Set(cxTasks.map(t => t.zone))].sort(), [cxTasks]);
  const systems = useMemo(() => [...new Set(cxTasks.map(t => t.system))].sort(), [cxTasks]);

  const filteredTasks = useMemo(() => {
    let result = cxTasks;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(t => t.description.toLowerCase().includes(s) || t.zone.toLowerCase().includes(s) || t.system.toLowerCase().includes(s));
    }
    if (filters['Zone']?.length) result = result.filter(t => filters['Zone'].includes(t.zone));
    if (filters['System']?.length) result = result.filter(t => filters['System'].includes(t.system));
    if (filters['Status']?.length) result = result.filter(t => filters['Status'].includes(t.status));
    if (filters['Scope']?.length) result = result.filter(t => filters['Scope'].includes(t.scope));
    return result;
  }, [cxTasks, search, filters]);

  // Group by zone
  const tasksByZone = useMemo(() => {
    const map = new Map<string, typeof filteredTasks>();
    filteredTasks.forEach(t => {
      if (!map.has(t.zone)) map.set(t.zone, []);
      map.get(t.zone)!.push(t);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredTasks]);

  const overallPct = cxTasks.length > 0 ? Math.round(cxTasks.reduce((s, t) => s + t.percentComplete, 0) / cxTasks.length) : 0;
  const completeTasks = cxTasks.filter(t => t.status === 'Complete').length;

  // Zone summary cards
  const zoneSummary = useMemo(() => {
    return zones.map(z => {
      const zt = cxTasks.filter(t => t.zone === z);
      const pct = zt.length > 0 ? Math.round(zt.reduce((s, t) => s + t.percentComplete, 0) / zt.length) : 0;
      return { name: z, pct, total: zt.length, complete: zt.filter(t => t.status === 'Complete').length };
    });
  }, [zones, cxTasks]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TestTubes size={16} style={{ color: '#a855f7' }} />
          <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Commissioning</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>{overallPct}% · {completeTasks}/{cxTasks.length}</span>
        </div>
      </div>

      {/* Zone Progress Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {zoneSummary.slice(0, 12).map(z => (
          <button key={z.name} onClick={() => { setExpandedZone(expandedZone === z.name ? null : z.name); setFilters({ ...filters, Zone: [z.name] }); }} className="card p-2 text-center hover:bg-white/5 transition-colors">
            <div className="text-[9px] font-medium truncate" style={{ color: '#94a3b8' }}>{z.name}</div>
            <div className="text-sm font-bold" style={{ color: z.pct === 100 ? '#10b981' : z.pct > 0 ? '#a855f7' : '#64748b' }}>{z.pct}%</div>
            <div className="w-full h-1 rounded-full mt-1" style={{ background: 'rgba(51,65,85,0.5)' }}>
              <div className="h-full rounded-full" style={{ width: `${z.pct}%`, background: z.pct === 100 ? '#10b981' : '#a855f7' }} />
            </div>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        <button onClick={() => setActiveTab('tasks')} className="px-3 py-1.5 rounded text-[11px] font-medium" style={{ background: activeTab === 'tasks' ? 'rgba(168,85,247,0.15)' : 'rgba(51,65,85,0.2)', color: activeTab === 'tasks' ? '#a855f7' : '#94a3b8' }}>
          Test Procedures ({cxTasks.length})
        </button>
        <button onClick={() => setActiveTab('checklists')} className="px-3 py-1.5 rounded text-[11px] font-medium" style={{ background: activeTab === 'checklists' ? 'rgba(168,85,247,0.15)' : 'rgba(51,65,85,0.2)', color: activeTab === 'checklists' ? '#a855f7' : '#94a3b8' }}>
          Checklists ({checklists.length})
        </button>
        <button onClick={() => setFilters({})} className="ml-auto px-2 py-1 rounded text-[9px]" style={{ color: '#64748b' }}>Clear Filters</button>
      </div>

      {activeTab === 'tasks' && (
        <>
          {/* Search + Filters */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by task, zone, system..." className="input w-full pl-7 pr-3 py-1.5 text-[11px] rounded" />
            </div>
            <SidebarFilter filters={filters} setFilters={setFilters} options={{ Zone: zones, System: systems, Status: ['Not Started', 'In Progress', 'Complete'], Scope: ['zone', 'pre-install'] }} />
          </div>

          {/* Tasks grouped by zone */}
          <div className="space-y-2">
            {tasksByZone.map(([zone, zoneTasks]) => {
              const zonePct = Math.round(zoneTasks.reduce((s, t) => s + t.percentComplete, 0) / zoneTasks.length);
              const isExpanded = expandedZone === zone;
              return (
                <div key={zone} className="card overflow-hidden">
                  <button onClick={() => setExpandedZone(isExpanded ? null : zone)} className="w-full flex items-center justify-between p-2.5 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown size={11} style={{ color: '#94a3b8' }} /> : <ChevronRight size={11} style={{ color: '#94a3b8' }} />}
                      <span className="text-[11px] font-medium" style={{ color: '#e2e8f0' }}>{zone}</span>
                      <span className="text-[9px]" style={{ color: '#64748b' }}>{zoneTasks.length} tasks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full" style={{ background: 'rgba(51,65,85,0.5)' }}>
                        <div className="h-full rounded-full" style={{ width: `${zonePct}%`, background: zonePct === 100 ? '#10b981' : '#a855f7' }} />
                      </div>
                      <span className="text-[10px] w-7 text-right" style={{ color: '#a855f7' }}>{zonePct}%</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-2.5 pb-2.5 space-y-1" style={{ borderTop: '1px solid rgba(51,65,85,0.3)' }}>
                      {zoneTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid rgba(51,65,85,0.15)' }}>
                          {task.status === 'Complete' ? <CheckCircle2 size={10} style={{ color: '#10b981' }} /> :
                           task.status === 'In Progress' ? <PlayCircle size={10} style={{ color: '#f59e0b' }} /> :
                           <Circle size={10} style={{ color: '#64748b' }} />}
                          <span className="text-[10px] flex-1 truncate" style={{ color: '#e2e8f0' }}>{task.description}</span>
                          <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(51,65,85,0.3)', color: '#94a3b8' }}>{task.system}</span>
                          <input type="range" min={0} max={100} step={5} value={task.percentComplete}
                            onChange={e => updateTask(task.id, { percentComplete: +e.target.value, status: +e.target.value === 100 ? 'Complete' : +e.target.value > 0 ? 'In Progress' : 'Not Started' })}
                            className="w-16 h-1" />
                          <span className="text-[9px] w-7 text-right" style={{ color: statusColors[task.status] }}>{task.percentComplete}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'checklists' && (
        <div className="space-y-2">
          {checklists.length === 0 && (
            <div className="card p-6 text-center text-[11px]" style={{ color: '#64748b' }}>No checklists yet.</div>
          )}
          {checklists.map(cl => (
            <div key={cl.id} className="card p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-medium" style={{ color: '#e2e8f0' }}>{cl.title}</div>
                  <div className="text-[9px]" style={{ color: '#64748b' }}>{cl.type} · {cl.equipmentName || 'Unassigned'} · {cl.assignedTo || 'Unassigned'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full" style={{ background: 'rgba(51,65,85,0.5)' }}>
                    <div className="h-full rounded-full" style={{ width: `${cl.percentComplete}%`, background: statusColors[cl.status] }} />
                  </div>
                  <span className="text-[10px]" style={{ color: statusColors[cl.status] }}>{cl.percentComplete}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
