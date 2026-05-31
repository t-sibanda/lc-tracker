import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Wrench, Plus, Search, Pencil, Trash2, X, ChevronDown,
  MessageSquare, Send, CheckCircle2, PlayCircle, Circle, Camera
} from 'lucide-react';
import CameraCapture from '@/components/CameraCapture';
import SidebarFilter from '@/components/SidebarFilter';

const statusColors: Record<string, string> = {
  'Complete': '#10b981',
  'In Progress': '#f59e0b',
  'Not Started': '#64748b',
};

export default function Tasks() {
  const { tasks, addTask, updateTask, deleteTask, addComment, deleteComment } = useApp();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<{ entityId: string; entityName: string } | null>(null);

  const projectTasks = tasks.filter(t => t.scope === 'project');

  const filterGroups = useMemo(() => [
    {
      label: 'Phase',
      options: [...new Set(projectTasks.map(t => t.phase))].map(p => ({ value: p, count: projectTasks.filter(t => t.phase === p).length })),
    },
    {
      label: 'Status',
      options: ['Complete', 'In Progress', 'Not Started'].map(s => ({ value: s, count: projectTasks.filter(t => t.status === s).length, color: statusColors[s] })),
    },
    {
      label: 'Owner',
      options: [...new Set(projectTasks.map(t => t.owner))].filter(Boolean).map(o => ({ value: o, count: projectTasks.filter(t => t.owner === o).length })),
    },
  ], [projectTasks]);

  const filtered = useMemo(() => {
    return projectTasks.filter(t => {
      if (search && !t.description.toLowerCase().includes(search.toLowerCase()) && !t.owner.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters['Phase']?.length && !filters['Phase'].includes(t.phase)) return false;
      if (filters['Status']?.length && !filters['Status'].includes(t.status)) return false;
      if (filters['Owner']?.length && !filters['Owner'].includes(t.owner)) return false;
      return true;
    });
  }, [projectTasks, search, filters]);

  const toggleFilter = (group: string, value: string) => {
    setFilters(prev => {
      const curr = prev[group] || [];
      const next = curr.includes(value) ? curr.filter(v => v !== value) : [...curr, value];
      return { ...prev, [group]: next };
    });
  };

  const [form, setForm] = useState({
    description: '', phase: 'Development', owner: '', percentComplete: 0,
    status: 'Not Started' as Task['status'], startDate: '', endDate: '', notes: '',
  });

  function handleAdd() {
    if (!form.description.trim()) return;
    addTask({
      ...form,
      zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project',
      support: '', predecessors: '', deliverable: '', comments: [],
    });
    setForm({ description: '', phase: 'Development', owner: '', percentComplete: 0, status: 'Not Started', startDate: '', endDate: '', notes: '' });
    setShowAdd(false);
  }

  function handleUpdate(id: string) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    updateTask(id, t);
    setEditingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Wrench size={16} style={{ color: '#22d3ee' }} />
          <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Project Tasks</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>{filtered.length}</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
          <Plus size={12} /> Add Task
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search project tasks..."
          className="input w-full pl-8 pr-3 py-2 text-xs rounded-lg"
        />
      </div>

      {showAdd && (
        <div className="card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: '#22d3ee' }}>New Task</span>
            <button onClick={() => setShowAdd(false)}><X size={14} style={{ color: '#64748b' }} /></button>
          </div>
          <input className="input w-full px-3 py-2 text-xs rounded-lg" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <select className="input w-full px-2 py-1.5 text-xs rounded-lg" value={form.phase} onChange={e => setForm({ ...form, phase: e.target.value })}>
              {['Kickoff', 'Requirements', 'Design', 'Development', 'Test', 'Closeout'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input className="input w-full px-2 py-1.5 text-xs rounded-lg" placeholder="Owner" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
            <input type="number" className="input w-full px-2 py-1.5 text-xs rounded-lg" placeholder="%" value={form.percentComplete} onChange={e => setForm({ ...form, percentComplete: Number(e.target.value) })} />
            <select className="input w-full px-2 py-1.5 text-xs rounded-lg" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Task['status'] })}>
              {['Not Started', 'In Progress', 'Complete'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="input w-full px-2 py-1.5 text-xs rounded-lg" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            <input type="date" className="input w-full px-2 py-1.5 text-xs rounded-lg" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <button onClick={handleAdd} className="px-4 py-1.5 rounded-md text-[11px] font-medium" style={{ background: '#22d3ee', color: '#0f172a' }}>Add Task</button>
        </div>
      )}

      <div className="flex gap-3">
        <div className="hidden lg:block">
          <SidebarFilter groups={filterGroups} selected={filters} onToggle={toggleFilter} />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              isEditing={editingId === task.id}
              isExpanded={expandedId === task.id}
              onEdit={() => setEditingId(editingId === task.id ? null : task.id)}
              onExpand={() => setExpandedId(expandedId === task.id ? null : task.id)}
              onUpdate={handleUpdate}
              onDelete={deleteTask}
              onUpdateTask={updateTask}
              onAddComment={addComment}
              onDeleteComment={deleteComment}
              commentText={commentText}
              setCommentText={setCommentText}
              onCamera={() => { setCameraTarget({ entityId: task.id, entityName: task.description }); setShowCamera(true); }}
            />
          ))}
          {filtered.length === 0 && (
            <div className="card p-8 text-center text-[11px]" style={{ color: '#64748b' }}>No tasks match your filters.</div>
          )}
        </div>
      </div>
      {showCamera && cameraTarget && (
        <CameraCapture
          onClose={() => setShowCamera(false)}
          entityType="task"
          entityId={cameraTarget.entityId}
          entityName={cameraTarget.entityName}
          zone="All"
        />
      )}
    </div>
  );
}

import type { Task } from '@/types';

function TaskCard({ task, isEditing, isExpanded, onEdit, onExpand, onDelete, onUpdateTask, onAddComment, onDeleteComment, commentText, setCommentText, onCamera }: {
  task: Task; isEditing: boolean; isExpanded: boolean;
  onEdit: () => void; onExpand: () => void; onUpdate: (id: string) => void;
  onDelete: (id: string) => void; onUpdateTask: (id: string, u: Partial<Task>) => void;
  onAddComment: (taskId: string, c: { author: string; text: string }) => void;
  onDeleteComment: (taskId: string, commentId: string) => void;
  commentText: string; setCommentText: (v: string) => void;
  onCamera?: () => void;
}) {
  const [editForm, setEditForm] = useState({ ...task });

  const statusIcon = task.status === 'Complete' ? <CheckCircle2 size={12} style={{ color: '#10b981' }} /> :
    task.status === 'In Progress' ? <PlayCircle size={12} style={{ color: '#f59e0b' }} /> :
    <Circle size={12} style={{ color: '#64748b' }} />;

  return (
    <div className="card overflow-hidden">
      <div className="p-3 flex items-start gap-2">
        {statusIcon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium truncate" style={{ color: '#e2e8f0' }}>{task.description}</span>
            <div className="flex items-center gap-1 shrink-0">
              {onCamera && <button onClick={onCamera} className="p-1 rounded hover:bg-white/5 transition-colors" title="Capture evidence"><Camera size={11} style={{ color: '#64748b' }} /></button>}
              <button onClick={onEdit} className="p-1 rounded hover:bg-white/5 transition-colors"><Pencil size={11} style={{ color: '#64748b' }} /></button>
              <button onClick={() => onDelete(task.id)} className="p-1 rounded hover:bg-white/5 transition-colors"><Trash2 size={11} style={{ color: '#ef4444' }} /></button>
              <button onClick={onExpand} className="p-1 rounded hover:bg-white/5 transition-colors"><ChevronDown size={11} style={{ color: '#64748b', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} /></button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>{task.phase}</span>
            {task.owner && <span className="text-[10px]" style={{ color: '#94a3b8' }}>{task.owner}</span>}
            {task.endDate && <span className="text-[10px]" style={{ color: '#64748b' }}>{task.endDate}</span>}
            <span className="text-[10px] ml-auto" style={{ color: statusColors[task.status] }}>{task.percentComplete}%</span>
          </div>
          <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(51,65,85,0.5)' }}>
            <div className="h-full rounded-full" style={{ width: `${task.percentComplete}%`, background: statusColors[task.status] }} />
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="px-3 pb-3 space-y-2" style={{ borderTop: '1px solid rgba(51,65,85,0.3)' }}>
          <div className="pt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
            <select className="input w-full px-2 py-1 text-xs rounded" value={editForm.phase} onChange={e => setEditForm({ ...editForm, phase: e.target.value })}>
              {['Kickoff', 'Requirements', 'Design', 'Development', 'Test', 'Closeout'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input className="input w-full px-2 py-1 text-xs rounded" placeholder="Owner" value={editForm.owner} onChange={e => setEditForm({ ...editForm, owner: e.target.value })} />
            <input type="number" className="input w-full px-2 py-1 text-xs rounded" value={editForm.percentComplete} onChange={e => setEditForm({ ...editForm, percentComplete: Number(e.target.value) })} />
            <select className="input w-full px-2 py-1 text-xs rounded" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value as Task['status'] })}>
              {['Not Started', 'In Progress', 'Complete'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <textarea className="input w-full px-2 py-1 text-xs rounded" placeholder="Notes" rows={2} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={() => { onUpdateTask(task.id, editForm); onEdit(); }} className="px-3 py-1 rounded text-[10px] font-medium" style={{ background: '#22d3ee', color: '#0f172a' }}>Save</button>
            <button onClick={onEdit} className="px-3 py-1 rounded text-[10px]" style={{ color: '#64748b' }}>Cancel</button>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2" style={{ borderTop: '1px solid rgba(51,65,85,0.3)' }}>
          {task.notes && <div className="pt-2 text-[11px]" style={{ color: '#94a3b8' }}>{task.notes}</div>}
          {/* Comments */}
          <div className="pt-2">
            <div className="flex items-center gap-1 mb-1.5">
              <MessageSquare size={11} style={{ color: '#22d3ee' }} />
              <span className="text-[10px] font-medium" style={{ color: '#22d3ee' }}>Comments ({task.comments.length})</span>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto mb-2">
              {task.comments.map(c => (
                <div key={c.id} className="p-1.5 rounded" style={{ background: 'rgba(51,65,85,0.3)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium" style={{ color: '#22d3ee' }}>{c.author}</span>
                    <button onClick={() => onDeleteComment(task.id, c.id)} className="text-[8px] hover:text-red-400" style={{ color: '#64748b' }}>x</button>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: '#e2e8f0' }}>{c.text}</p>
                  <span className="text-[8px]" style={{ color: '#475569' }}>{new Date(c.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add comment..."
                className="input flex-1 px-2 py-1 text-[11px] rounded"
                onKeyDown={e => {
                  if (e.key === 'Enter' && commentText.trim()) {
                    onAddComment(task.id, { author: 'User', text: commentText });
                    setCommentText('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (commentText.trim()) {
                    onAddComment(task.id, { author: 'User', text: commentText });
                    setCommentText('');
                  }
                }}
                className="p-1 rounded hover:bg-white/5 transition-colors"
              >
                <Send size={12} style={{ color: '#22d3ee' }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
