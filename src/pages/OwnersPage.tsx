import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Users, Plus, Pencil, Trash2, X, Wrench, CheckCircle2 } from 'lucide-react';

export default function OwnersPage() {
  const { owners, tasks, addOwner, updateOwner, deleteOwner } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', role: '', email: '', phone: '' });
  const [editForm, setEditForm] = useState({ name: '', role: '', email: '', phone: '' });

  function handleAdd() {
    if (!form.name.trim()) return;
    addOwner(form);
    setForm({ name: '', role: '', email: '', phone: '' });
    setShowAdd(false);
  }

  function startEdit(owner: typeof owners[0]) {
    setEditForm({ name: owner.name, role: owner.role, email: owner.email, phone: owner.phone });
    setEditingId(owner.id);
  }

  function handleUpdate(id: string) {
    updateOwner(id, editForm);
    setEditingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Users size={16} style={{ color: '#22d3ee' }} />
          <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Team Members</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>{owners.length}</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
          <Plus size={12} /> Add Member
        </button>
      </div>

      {showAdd && (
        <div className="card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: '#22d3ee' }}>New Member</span>
            <button onClick={() => setShowAdd(false)}><X size={14} style={{ color: '#64748b' }} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="input px-2 py-1 text-xs rounded" placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="input px-2 py-1 text-xs rounded" placeholder="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
            <input className="input px-2 py-1 text-xs rounded" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <input className="input px-2 py-1 text-xs rounded" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <button onClick={handleAdd} className="px-4 py-1.5 rounded text-[10px] font-medium" style={{ background: '#22d3ee', color: '#0f172a' }}>Add Member</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {owners.map(owner => {
          const ownerTasks = tasks.filter(t => t.owner === owner.name);
          const complete = ownerTasks.filter(t => t.status === 'Complete').length;
          const pct = ownerTasks.length > 0 ? Math.round((complete / ownerTasks.length) * 100) : 0;

          return (
            <div key={owner.id} className="card p-4">
              {editingId === owner.id ? (
                <div className="space-y-2">
                  <input className="input w-full px-2 py-1 text-xs rounded" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                  <input className="input w-full px-2 py-1 text-xs rounded" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} />
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(owner.id)} className="px-3 py-1 rounded text-[10px] font-medium" style={{ background: '#22d3ee', color: '#0f172a' }}>Save</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 rounded text-[10px]" style={{ color: '#64748b' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
                      {owner.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(owner)} className="p-1 rounded hover:bg-white/5"><Pencil size={11} style={{ color: '#64748b' }} /></button>
                      <button onClick={() => deleteOwner(owner.id)} className="p-1 rounded hover:bg-white/5"><Trash2 size={11} style={{ color: '#ef4444' }} /></button>
                    </div>
                  </div>
                  <h3 className="text-xs font-bold" style={{ color: '#e2e8f0' }}>{owner.name}</h3>
                  <p className="text-[11px]" style={{ color: '#94a3b8' }}>{owner.role}</p>
                  <div className="mt-2 pt-2 space-y-1" style={{ borderTop: '1px solid rgba(51,65,85,0.3)' }}>
                    <div className="flex items-center justify-between text-[10px]">
                      <span style={{ color: '#64748b' }}><Wrench size={10} className="inline mr-1" />{ownerTasks.length} tasks</span>
                      <span style={{ color: '#64748b' }}><CheckCircle2 size={10} className="inline mr-1" />{complete} done</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(51,65,85,0.5)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : '#22d3ee' }} />
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
