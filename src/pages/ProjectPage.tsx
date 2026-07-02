import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Briefcase, Plus, Search, Pencil, Trash2, X, ChevronDown,
  MessageSquare, Send, CheckCircle2, PlayCircle, Circle, Clock
} from 'lucide-react';
import SidebarFilter from '@/components/SidebarFilter';

const statusColors: Record<string, string> = { 'Complete': '#10b981', 'In Progress': '#f59e0b', 'Not Started': '#64748b' };
const phaseOrder = ['Kickoff', 'Requirements', 'Design', 'Development', 'Test', 'Closeout'];

export default function ProjectPage() {
  const { tasks, phases, addTask, updateTask, deleteTask, addComment, deleteComment, addPhase, updatePhase, deletePhase } = useApp();
  const [activeTab, setActiveTab] = useState<'tasks' | 'phases'>('tasks');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  // Only project-scope tasks
  const projectTasks = useMemo(() => tasks.filter(t => t.scope === 'project'), [tasks]);

  const filteredTasks = useMemo(() => {
    let result = projectTasks;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(t => t.description.toLowerCase().includes(s) || t.owner.toLowerCase().includes(s));
    }
    if (filters['Phase']?.length) result = result.filter(t => filters['Phase'].includes(t.phase));
    if (filters['Status']?.length) result = result.filter(t => filters['Status'].includes(t.status));
    if (filters['Owner']?.length) result = result.filter(t => filters['Owner'].includes(t.owner));
    return result;
  }, [projectTasks, search, filters]);

  // Phase progress calculated from tasks
  const phaseProgress = useMemo(() => {
    return phaseOrder.map(p => {
      const phaseTasks = projectTasks.filter(t => t.phase === p);
      const pct = phaseTasks.length > 0 ? Math.round(phaseTasks.reduce((s, t) => s + t.percentComplete, 0) / phaseTasks.length) : 0;
      return { name: p, pct, total: phaseTasks.length, complete: phaseTasks.filter(t => t.status === 'Complete').length };
    });
  }, [projectTasks]);

  const overallPct = projectTasks.length > 0 ? Math.round(projectTasks.reduce((s, t) => s + t.percentComplete, 0) / projectTasks.length) : 0;

  const [newTask, setNewTask] = useState({ description: '', phase: 'Kickoff', owner: '', percentComplete: 0, startDate: '', endDate: '', notes: '' });

  function handleAdd() {
    if (!newTask.description.trim()) return;
    addTask({ ...newTask, zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', support: '', predecessors: '', deliverable: '', status: newTask.percentComplete === 100 ? 'Complete' : newTask.percentComplete > 0 ? 'In Progress' : 'Not Started', comments: [] });
    setNewTask({ description: '', phase: 'Kickoff', owner: '', percentComplete: 0, startDate: '', endDate: '', notes: '' });
    setShowAdd(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase size={16} style={{ color: '#22d3ee' }} />
          <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Project Management</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>{overallPct}%</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
          <Plus size={10} /> Add Task
        </button>
      </div>

      {/* Phase Progress Strip */}
      <div className="grid grid-cols-6 gap-1">
        {phaseProgress.map(p => (
          <div key={p.name} className="card p-2 text-center">
            <div className="text-[9px] font-medium" style={{ color: '#94a3b8' }}>{p.name}</div>
            <div className="text-sm font-bold" style={{ color: p.pct === 100 ? '#10b981' : p.pct > 0 ? '#f59e0b' : '#64748b' }}>{p.pct}%</div>
            <div className="text-[8px]" style={{ color: '#64748b' }}>{p.complete}/{p.total}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        <button onClick={() => setActiveTab('tasks')} className="px-3 py-1.5 rounded text-[11px] font-medium" style={{ background: activeTab === 'tasks' ? 'rgba(34,211,238,0.15)' : 'rgba(51,65,85,0.2)', color: activeTab === 'tasks' ? '#22d3ee' : '#94a3b8' }}>
          Tasks ({projectTasks.length})
        </button>
        <button onClick={() => setActiveTab('phases')} className="px-3 py-1.5 rounded text-[11px] font-medium" style={{ background: activeTab === 'phases' ? 'rgba(34,211,238,0.15)' : 'rgba(51,65,85,0.2)', color: activeTab === 'phases' ? '#22d3ee' : '#94a3b8' }}>
          Phases ({phases.length})
        </button>
      </div>

      {activeTab === 'tasks' && (
        <>
          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="input w-full pl-7 pr-3 py-1.5 text-[11px] rounded" />
            </div>
            <SidebarFilter filters={filters} setFilters={setFilters} options={{ Phase: phaseOrder, Status: ['Not Started', 'In Progress', 'Complete'], Owner: [...new Set(projectTasks.map(t => t.owner).filter(Boolean))] }} />
          </div>

          {/* Add Form */}
          {showAdd && (
            <div className="card p-3 space-y-2">
              <input value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Task description" className="input w-full px-2 py-1.5 text-[11px] rounded" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <select value={newTask.phase} onChange={e => setNewTask({ ...newTask, phase: e.target.value })} className="input px-2 py-1.5 text-[11px] rounded">
                  {phaseOrder.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input value={newTask.owner} onChange={e => setNewTask({ ...newTask, owner: e.target.value })} placeholder="Owner" className="input px-2 py-1.5 text-[11px] rounded" />
                <input type="date" value={newTask.startDate} onChange={e => setNewTask({ ...newTask, startDate: e.target.value })} className="input px-2 py-1.5 text-[11px] rounded" />
                <input type="date" value={newTask.endDate} onChange={e => setNewTask({ ...newTask, endDate: e.target.value })} className="input px-2 py-1.5 text-[11px] rounded" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} className="px-3 py-1.5 rounded text-[10px] font-medium" style={{ background: '#22d3ee', color: '#0f172a' }}>Add</button>
                <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded text-[10px]" style={{ color: '#94a3b8' }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Task List grouped by Phase */}
          {phaseOrder.map(phase => {
            const phaseTasks = filteredTasks.filter(t => t.phase === phase);
            if (phaseTasks.length === 0) return null;
            return (
              <div key={phase}>
                <div className="text-[10px] font-bold mb-1 px-1" style={{ color: '#94a3b8' }}>{phase} ({phaseTasks.length})</div>
                <div className="space-y-1">
                  {phaseTasks.map(task => (
                    <div key={task.id} className="card p-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {task.status === 'Complete' ? <CheckCircle2 size={11} style={{ color: '#10b981' }} /> :
                           task.status === 'In Progress' ? <PlayCircle size={11} style={{ color: '#f59e0b' }} /> :
                           <Circle size={11} style={{ color: '#64748b' }} />}
                          <span className="text-[11px] truncate" style={{ color: '#e2e8f0' }}>{task.description}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px]" style={{ color: statusColors[task.status] }}>{task.percentComplete}%</span>
                          {task.owner && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(51,65,85,0.4)', color: '#94a3b8' }}>{task.owner}</span>}
                          <button onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}><ChevronDown size={10} style={{ color: '#64748b' }} /></button>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-1.5 w-full h-1 rounded-full" style={{ background: 'rgba(51,65,85,0.5)' }}>
                        <div className="h-full rounded-full" style={{ width: `${task.percentComplete}%`, background: statusColors[task.status] }} />
                      </div>
                      {/* Expanded */}
                      {expandedId === task.id && (
                        <div className="mt-2 pt-2 space-y-2" style={{ borderTop: '1px solid rgba(51,65,85,0.3)' }}>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div><span style={{ color: '#64748b' }}>Start:</span> <span style={{ color: '#94a3b8' }}>{task.startDate || '—'}</span></div>
                            <div><span style={{ color: '#64748b' }}>End:</span> <span style={{ color: '#94a3b8' }}>{task.endDate || '—'}</span></div>
                            <div><span style={{ color: '#64748b' }}>Predecessors:</span> <span style={{ color: '#94a3b8' }}>{task.predecessors || '—'}</span></div>
                            <div><span style={{ color: '#64748b' }}>Deliverable:</span> <span style={{ color: '#94a3b8' }}>{task.deliverable || '—'}</span></div>
                          </div>
                          {task.notes && <div className="text-[10px]" style={{ color: '#94a3b8' }}>{task.notes}</div>}
                          {/* Quick edit */}
                          <div className="flex items-center gap-2">
                            <input type="range" min={0} max={100} step={5} value={task.percentComplete} onChange={e => updateTask(task.id, { percentComplete: +e.target.value, status: +e.target.value === 100 ? 'Complete' : +e.target.value > 0 ? 'In Progress' : 'Not Started' })} className="flex-1 h-1" />
                            <span className="text-[10px] w-8" style={{ color: '#22d3ee' }}>{task.percentComplete}%</span>
                            <button onClick={() => deleteTask(task.id)} className="p-1 rounded hover:bg-red-500/10"><Trash2 size={10} style={{ color: '#ef4444' }} /></button>
                          </div>
                          {/* Comments */}
                          <div className="space-y-1">
                            {task.comments.map(c => (
                              <div key={c.id} className="flex items-start gap-1.5 text-[9px]">
                                <MessageSquare size={8} style={{ color: '#64748b', marginTop: 2 }} />
                                <div><span style={{ color: '#94a3b8' }}>{c.text}</span> <span style={{ color: '#475569' }}>— {c.author}</span></div>
                                <button onClick={() => deleteComment(task.id, c.id)}><X size={8} style={{ color: '#64748b' }} /></button>
                              </div>
                            ))}
                            <div className="flex gap-1">
                              <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add comment..." className="input flex-1 px-2 py-1 text-[9px] rounded" onKeyDown={e => { if (e.key === 'Enter' && commentText.trim()) { addComment(task.id, { author: 'Me', text: commentText }); setCommentText(''); } }} />
                              <button onClick={() => { if (commentText.trim()) { addComment(task.id, { author: 'Me', text: commentText }); setCommentText(''); } }}><Send size={10} style={{ color: '#22d3ee' }} /></button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {activeTab === 'phases' && (
        <div className="space-y-2">
          {phaseProgress.map(p => (
            <div key={p.name} className="card p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium" style={{ color: '#e2e8f0' }}>{p.name}</span>
                <span className="text-[10px]" style={{ color: p.pct === 100 ? '#10b981' : p.pct > 0 ? '#f59e0b' : '#64748b' }}>{p.pct}%</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: 'rgba(51,65,85,0.5)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${p.pct}%`, background: p.pct === 100 ? '#10b981' : p.pct > 0 ? '#f59e0b' : '#64748b' }} />
              </div>
              <div className="text-[9px] mt-1" style={{ color: '#64748b' }}>{p.complete} of {p.total} tasks complete</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
