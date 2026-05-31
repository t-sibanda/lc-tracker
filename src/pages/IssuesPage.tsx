import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { AlertTriangle, Plus, Search, X, Pencil, Trash2, Camera } from 'lucide-react';
import CameraCapture from '@/components/CameraCapture';
import SidebarFilter from '@/components/SidebarFilter';
import type { Issue } from '@/types';

const priorityColors: Record<string, string> = { Low: '#64748b', Medium: '#f59e0b', High: '#ef4444', Critical: '#dc2626' };
const statusColors: Record<string, string> = { New: '#3b82f6', 'In Progress': '#f59e0b', Completed: '#22d3ee', 'Closed-Cx Verified': '#10b981', Rejected: '#ef4444' };
const statusOrder = ['New', 'In Progress', 'Completed', 'Closed-Cx Verified', 'Rejected'];

export default function IssuesPage() {
  const { issues, addIssue, updateIssue, deleteIssue } = useApp();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<{ entityId: string; entityName: string; zone: string } | null>(null);

  const kpi = useMemo(() => ({
    new: issues.filter(i => i.status === 'New').length,
    inProgress: issues.filter(i => i.status === 'In Progress').length,
    completed: issues.filter(i => i.status === 'Completed').length,
    closed: issues.filter(i => i.status === 'Closed-Cx Verified').length,
    rejected: issues.filter(i => i.status === 'Rejected').length,
  }), [issues]);

  const filterGroups = useMemo(() => [
    { label: 'Status', options: statusOrder.map(s => ({ value: s, count: issues.filter(i => i.status === s).length, color: statusColors[s] })) },
    { label: 'Priority', options: ['Low', 'Medium', 'High', 'Critical'].map(p => ({ value: p, count: issues.filter(i => i.priority === p).length, color: priorityColors[p] })) },
  ], [issues]);

  const filtered = useMemo(() => {
    return issues.filter(i => {
      if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters['Status']?.length && !filters['Status'].includes(i.status)) return false;
      if (filters['Priority']?.length && !filters['Priority'].includes(i.priority)) return false;
      return true;
    });
  }, [issues, search, filters]);

  const toggleFilter = (group: string, value: string) => {
    setFilters(prev => {
      const curr = prev[group] || [];
      return { ...prev, [group]: curr.includes(value) ? curr.filter(v => v !== value) : [...curr, value] };
    });
  };

  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium' as Issue['priority'], zone: 'All', system: 'Liquid Cooling', discipline: 'Controls', responsibleParty: '' });

  function handleAdd() {
    if (!form.title.trim()) return;
    addIssue({ ...form, status: 'New', reportedBy: 'User', reportedAt: new Date().toISOString(), resolvedAt: '', resolutionNotes: '' });
    setForm({ title: '', description: '', priority: 'Medium', zone: 'All', system: 'Liquid Cooling', discipline: 'Controls', responsibleParty: '' });
    setShowAdd(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} style={{ color: '#22d3ee' }} />
          <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Issues</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>{filtered.length}</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
          <Plus size={12} /> Log Issue
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'New', value: kpi.new, color: '#3b82f6' },
          { label: 'In Progress', value: kpi.inProgress, color: '#f59e0b' },
          { label: 'Completed', value: kpi.completed, color: '#22d3ee' },
          { label: 'Closed', value: kpi.closed, color: '#10b981' },
          { label: 'Rejected', value: kpi.rejected, color: '#ef4444' },
        ].map(k => (
          <div key={k.label} className="card p-2 text-center">
            <div className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-sm font-bold" style={{ border: `2px solid ${k.color}`, color: k.color }}>{k.value}</div>
            <div className="text-[9px]" style={{ color: '#94a3b8' }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search issues..." className="input w-full pl-8 pr-3 py-2 text-xs rounded-lg" />
      </div>

      {showAdd && (
        <div className="card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: '#22d3ee' }}>New Issue</span>
            <button onClick={() => setShowAdd(false)}><X size={14} style={{ color: '#64748b' }} /></button>
          </div>
          <input className="input w-full px-2 py-1 text-xs rounded" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea className="input w-full px-2 py-1 text-xs rounded" placeholder="Description" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <select className="input px-2 py-1 text-xs rounded" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Issue['priority'] })}>
              {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input className="input px-2 py-1 text-xs rounded" placeholder="Zone" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} />
            <input className="input px-2 py-1 text-xs rounded" placeholder="Responsible" value={form.responsibleParty} onChange={e => setForm({ ...form, responsibleParty: e.target.value })} />
          </div>
          <button onClick={handleAdd} className="px-4 py-1.5 rounded text-[10px] font-medium" style={{ background: '#22d3ee', color: '#0f172a' }}>Log Issue</button>
        </div>
      )}

      <div className="flex gap-3">
        <div className="hidden lg:block"><SidebarFilter groups={filterGroups} selected={filters} onToggle={toggleFilter} /></div>
        <div className="flex-1 min-w-0 space-y-2">
          {filtered.map(issue => (
            <div key={issue.id} className="card p-3">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: priorityColors[issue.priority] }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: '#e2e8f0' }}>{issue.title}</span>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setCameraTarget({ entityId: issue.id, entityName: issue.title, zone: issue.zone }); setShowCamera(true); }} title="Add evidence"><Camera size={11} style={{ color: '#64748b' }} /></button>
                      <button onClick={() => setEditingId(editingId === issue.id ? null : issue.id)}><Pencil size={11} style={{ color: '#64748b' }} /></button>
                      <button onClick={() => deleteIssue(issue.id)}><Trash2 size={11} style={{ color: '#ef4444' }} /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${statusColors[issue.status]}20`, color: statusColors[issue.status] }}>{issue.status}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${priorityColors[issue.priority]}20`, color: priorityColors[issue.priority] }}>{issue.priority}</span>
                    {issue.zone && <span className="text-[9px]" style={{ color: '#64748b' }}>{issue.zone}</span>}
                    <span className="text-[9px]" style={{ color: '#475569' }}>{issue.responsibleParty}</span>
                  </div>
                  {issue.description && <p className="text-[10px] mt-1" style={{ color: '#94a3b8' }}>{issue.description}</p>}
                  {editingId === issue.id && (
                    <div className="mt-2 pt-2 space-y-1.5" style={{ borderTop: '1px solid rgba(51,65,85,0.3)' }}>
                      <select className="input w-full px-2 py-1 text-xs rounded" value={issue.status} onChange={e => updateIssue(issue.id, { status: e.target.value as Issue['status'] })}>
                        {statusOrder.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <textarea className="input w-full px-2 py-1 text-xs rounded" placeholder="Resolution notes" rows={2} value={issue.resolutionNotes} onChange={e => updateIssue(issue.id, { resolutionNotes: e.target.value })} />
                      {issue.status === 'Closed-Cx Verified' && (
                        <button onClick={() => updateIssue(issue.id, { resolvedAt: new Date().toISOString() })} className="text-[10px] px-2 py-1 rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Mark Resolved</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCamera && cameraTarget && (
        <CameraCapture onClose={() => setShowCamera(false)} entityType="issue" entityId={cameraTarget.entityId} entityName={cameraTarget.entityName} zone={cameraTarget.zone} />
      )}
    </div>
  );
}
