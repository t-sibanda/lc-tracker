import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { FolderKanban, Plus, Pencil, Trash2, X, Clock } from 'lucide-react';

const statusColors: Record<string, string> = { 'Complete': '#10b981', 'In Progress': '#f59e0b', 'Not Started': '#64748b' };

export default function PhasesPage() {
  const { phases, addPhase, updatePhase, deletePhase } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', owner: '', startDate: '', endDate: '' });
  const [editForm, setEditForm] = useState({ name: '', owner: '', startDate: '', endDate: '', status: 'Not Started' as Phase['status'], percentComplete: 0 });

  function handleAdd() {
    if (!form.name.trim()) return;
    addPhase({ ...form, status: 'Not Started', percentComplete: 0 });
    setForm({ name: '', owner: '', startDate: '', endDate: '' });
    setShowAdd(false);
  }

  function startEdit(phase: typeof phases[0]) {
    setEditForm({ name: phase.name, owner: phase.owner, startDate: phase.startDate, endDate: phase.endDate, status: phase.status, percentComplete: phase.percentComplete });
    setEditingId(phase.id);
  }

  function handleUpdate(id: string) {
    updatePhase(id, editForm);
    setEditingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FolderKanban size={16} style={{ color: '#22d3ee' }} />
          <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Phases</h1>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
          <Plus size={12} /> Add Phase
        </button>
      </div>

      {showAdd && (
        <div className="card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: '#22d3ee' }}>New Phase</span>
            <button onClick={() => setShowAdd(false)}><X size={14} style={{ color: '#64748b' }} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="input px-2 py-1 text-xs rounded" placeholder="Phase name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="input px-2 py-1 text-xs rounded" placeholder="Owner" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
            <input type="date" className="input px-2 py-1 text-xs rounded" placeholder="Start" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            <input type="date" className="input px-2 py-1 text-xs rounded" placeholder="End" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <button onClick={handleAdd} className="px-4 py-1.5 rounded text-[10px] font-medium" style={{ background: '#22d3ee', color: '#0f172a' }}>Add Phase</button>
        </div>
      )}

      <div className="space-y-2">
        {phases.map(phase => (
          <div key={phase.id} className="card p-4">
            {editingId === phase.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input className="input px-2 py-1 text-xs rounded" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                  <input className="input px-2 py-1 text-xs rounded" value={editForm.owner} onChange={e => setEditForm({ ...editForm, owner: e.target.value })} />
                  <input type="date" className="input px-2 py-1 text-xs rounded" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} />
                  <input type="date" className="input px-2 py-1 text-xs rounded" value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} />
                  <input type="number" className="input px-2 py-1 text-xs rounded" placeholder="%" value={editForm.percentComplete} onChange={e => setEditForm({ ...editForm, percentComplete: Number(e.target.value) })} />
                  <select className="input px-2 py-1 text-xs rounded" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value as Phase['status'] })}>
                    {['Not Started', 'In Progress', 'Complete'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(phase.id)} className="px-3 py-1 rounded text-[10px] font-medium" style={{ background: '#22d3ee', color: '#0f172a' }}>Save</button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-1 rounded text-[10px]" style={{ color: '#64748b' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(34,211,238,0.1)' }}>
                  <Clock size={16} style={{ color: '#22d3ee' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: '#e2e8f0' }}>{phase.name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(phase)} className="p-1 rounded hover:bg-white/5"><Pencil size={11} style={{ color: '#64748b' }} /></button>
                      <button onClick={() => deletePhase(phase.id)} className="p-1 rounded hover:bg-white/5"><Trash2 size={11} style={{ color: '#ef4444' }} /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px]" style={{ color: '#94a3b8' }}>{phase.owner}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${statusColors[phase.status]}20`, color: statusColors[phase.status] }}>{phase.status}</span>
                    {(phase.startDate || phase.endDate) && (
                      <span className="text-[10px]" style={{ color: '#64748b' }}>{phase.startDate} {phase.endDate ? `→ ${phase.endDate}` : ''}</span>
                    )}
                  </div>
                  <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(51,65,85,0.5)' }}>
                    <div className="h-full rounded-full" style={{ width: `${phase.percentComplete}%`, background: statusColors[phase.status] }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import type { Phase } from '@/types';
