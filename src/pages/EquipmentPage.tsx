import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Zap, Plus, Search, Trash2, X, ChevronDown, ChevronUp, Camera, Save, Pencil } from 'lucide-react';
import CameraCapture from '@/components/CameraCapture';
import SidebarFilter from '@/components/SidebarFilter';

const statusOrder = ['Not Commissioned', 'L1 - Documentation', 'L2 - Factory Witness', 'L3 - Startup', 'L4 - Functional', 'L5 - Integrated'];
const statusColors: Record<string, string> = {
  'Not Commissioned': '#64748b', 'L1 - Documentation': '#94a3b8', 'L2 - Factory Witness': '#f59e0b',
  'L3 - Startup': '#22d3ee', 'L4 - Functional': '#3b82f6', 'L5 - Integrated': '#10b981',
};

const EQUIPMENT_TYPES = ['CDU', 'Energy Valve', 'RPP', 'RIO Panel', 'Leak Detection Gateway', 'Sound Gateway', 'Aparian Router', 'Control Panel', 'CRAH', 'ATS'];
const ZONES = ['POD 1','POD 2','POD 3','POD 4','POD 5','POD 6','POD 7','POD 8','Hospital POD','Visitor Lab','Machine Farm','Bench Lab','Chamber Lab'];
const DISCIPLINES = ['Controls', 'Mechanical', 'Electrical', 'Plumbing', 'Fire Safety', 'BMS'];

export default function EquipmentPage() {
  const { equipment, addEquipment, updateEquipment, deleteEquipment } = useApp();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<{ entityId: string; entityName: string; zone: string } | null>(null);

  const filterGroups = useMemo(() => [
    { label: 'Status', options: statusOrder.map(s => ({ value: s, count: equipment.filter(e => e.status === s).length, color: statusColors[s] })) },
    { label: 'Type', options: [...new Set(equipment.map(e => e.type))].map(t => ({ value: t, count: equipment.filter(e => e.type === t).length })) },
    { label: 'Zone', options: [...new Set(equipment.map(e => e.zone))].map(z => ({ value: z, count: equipment.filter(e => e.zone === z).length })) },
  ], [equipment]);

  const filtered = useMemo(() => {
    return equipment.filter(e => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.type.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters['Status']?.length && !filters['Status'].includes(e.status)) return false;
      if (filters['Type']?.length && !filters['Type'].includes(e.type)) return false;
      if (filters['Zone']?.length && !filters['Zone'].includes(e.zone)) return false;
      return true;
    });
  }, [equipment, search, filters]);

  const toggleFilter = (group: string, value: string) => {
    setFilters(prev => {
      const curr = prev[group] || [];
      return { ...prev, [group]: curr.includes(value) ? curr.filter(v => v !== value) : [...curr, value] };
    });
  };

  const [form, setForm] = useState({ name: '', type: 'CDU', zone: 'POD 1', location: '', discipline: 'Controls', contractor: 'ETG', status: 'Not Commissioned' as Equipment['status'], notes: '' });

  function handleAdd() {
    if (!form.name.trim()) return;
    addEquipment({ ...form, percentComplete: 0 });
    setForm({ name: '', type: 'CDU', zone: 'POD 1', location: '', discipline: 'Controls', contractor: 'ETG', status: 'Not Commissioned', notes: '' });
    setShowAdd(false);
  }

  const overallPct = equipment.length > 0 ? Math.round(equipment.reduce((s, e) => s + e.percentComplete, 0) / equipment.length) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Zap size={16} style={{ color: 'var(--app-accent)' }} />
          <h1 className="text-sm font-bold" style={{ color: 'var(--app-text-primary)' }}>Equipment</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--app-accent-bg)', color: 'var(--app-accent)' }}>{filtered.length}</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium" style={{ background: 'var(--app-accent-bg)', color: 'var(--app-accent)' }}>
          <Plus size={12} /> Add Equipment
        </button>
      </div>

      {/* Overall Progress */}
      <div className="card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium" style={{ color: 'var(--app-text-muted)' }}>Overall Commissioning Progress</span>
          <span className="text-sm font-bold" style={{ color: 'var(--app-accent)' }}>{overallPct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(51,65,85,0.5)' }}>
          <div className="h-full rounded-full" style={{ width: `${overallPct}%`, background: overallPct === 100 ? 'var(--app-success)' : 'var(--app-accent)' }} />
        </div>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--app-text-dim)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search equipment..." className="input w-full pl-8 pr-3 py-2 text-xs rounded-lg" />
      </div>

      {showAdd && (
        <div className="card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--app-accent)' }}>New Equipment</span>
            <button onClick={() => setShowAdd(false)}><X size={14} style={{ color: 'var(--app-text-dim)' }} /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <input className="input px-2 py-1 text-xs rounded" placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <select className="input px-2 py-1 text-xs rounded" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="input px-2 py-1 text-xs rounded" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })}>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            <input className="input px-2 py-1 text-xs rounded" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <button onClick={handleAdd} className="px-4 py-1.5 rounded text-[10px] font-medium" style={{ background: 'var(--app-accent)', color: '#fff' }}>Add</button>
        </div>
      )}

      <div className="flex gap-3">
        <div className="hidden lg:block"><SidebarFilter groups={filterGroups} selected={filters} onToggle={toggleFilter} /></div>
        <div className="flex-1 min-w-0 space-y-2">
          {filtered.map(eq => (
            <EquipmentCard
              key={eq.id}
              eq={eq}
              isExpanded={expandedId === eq.id}
              isEditing={editingId === eq.id}
              onToggle={() => setExpandedId(expandedId === eq.id ? null : eq.id)}
              onEdit={() => setEditingId(editingId === eq.id ? null : eq.id)}
              onUpdate={updateEquipment}
              onDelete={deleteEquipment}
              onCamera={() => { setCameraTarget({ entityId: eq.id, entityName: eq.name, zone: eq.zone }); setShowCamera(true); }}
            />
          ))}
          {filtered.length === 0 && (
            <div className="card p-6 text-center text-[11px]" style={{ color: 'var(--app-text-dim)' }}>
              No equipment found. <button onClick={() => setShowAdd(true)} className="underline" style={{ color: 'var(--app-accent)' }}>Add equipment</button>
            </div>
          )}
        </div>
      </div>

      {showCamera && cameraTarget && (
        <CameraCapture
          onClose={() => setShowCamera(false)}
          entityType="equipment"
          entityId={cameraTarget.entityId}
          entityName={cameraTarget.entityName}
          zone={cameraTarget.zone}
        />
      )}
    </div>
  );
}

function EquipmentCard({ eq, isExpanded, isEditing, onToggle, onEdit, onUpdate, onDelete, onCamera }: {
  eq: import('@/types').Equipment; isExpanded: boolean; isEditing: boolean;
  onToggle: () => void; onEdit: () => void; onUpdate: (id: string, u: Partial<import('@/types').Equipment>) => void;
  onDelete: (id: string) => void; onCamera: () => void;
}) {
  const color = statusColors[eq.status] || '#64748b';
  const [editForm, setEditForm] = useState({ name: eq.name, type: eq.type, zone: eq.zone, location: eq.location || '', discipline: eq.discipline, contractor: eq.contractor || '', notes: eq.notes || '', percentComplete: eq.percentComplete });

  function saveEdit() {
    if (!editForm.name.trim()) return;
    onUpdate(eq.id, { ...editForm, updatedAt: new Date().toISOString() });
    onEdit(); // close edit mode
  }

  if (isEditing) {
    return (
      <div className="card p-3 space-y-2" style={{ border: '1px solid var(--app-accent)' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: 'var(--app-accent)' }}>Edit Equipment</span>
          <button onClick={onEdit}><X size={14} style={{ color: 'var(--app-text-dim)' }} /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="input px-2 py-1 text-xs rounded" placeholder="Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
          <select className="input px-2 py-1 text-xs rounded" value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
            {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="input px-2 py-1 text-xs rounded" value={editForm.zone} onChange={e => setEditForm({ ...editForm, zone: e.target.value })}>
            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
          <input className="input px-2 py-1 text-xs rounded" placeholder="Location" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
          <select className="input px-2 py-1 text-xs rounded" value={editForm.discipline} onChange={e => setEditForm({ ...editForm, discipline: e.target.value })}>
            {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input className="input px-2 py-1 text-xs rounded" placeholder="Contractor" value={editForm.contractor} onChange={e => setEditForm({ ...editForm, contractor: e.target.value })} />
        </div>
        <textarea className="input w-full px-2 py-1 text-xs rounded" placeholder="Notes" rows={2} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: 'var(--app-text-muted)' }}>Progress: {editForm.percentComplete}%</span>
          <input type="range" min="0" max="100" value={editForm.percentComplete} onChange={e => setEditForm({ ...editForm, percentComplete: Number(e.target.value) })} className="flex-1" />
        </div>
        <button onClick={saveEdit} className="flex items-center gap-1 px-4 py-1.5 rounded text-[10px] font-medium" style={{ background: 'var(--app-success)', color: '#fff' }}>
          <Save size={10} /> Save Changes
        </button>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <button onClick={onToggle} className="w-full p-3 flex items-center gap-2 text-left">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-xs font-medium flex-1 truncate" style={{ color: 'var(--app-text-primary)' }}>{eq.name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ background: 'var(--app-bg-elevated)', color: 'var(--app-text-muted)' }}>{eq.type}</span>
        <span className="text-[10px] shrink-0 hidden sm:block" style={{ color }}>{eq.status}</span>
        {isExpanded ? <ChevronUp size={12} style={{ color: 'var(--app-text-dim)' }} /> : <ChevronDown size={12} style={{ color: 'var(--app-text-dim)' }} />}
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2" style={{ borderTop: '1px solid var(--app-border)' }}>
          <div className="pt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div><span style={{ color: 'var(--app-text-dim)' }}>Zone:</span> <span style={{ color: 'var(--app-text-primary)' }}>{eq.zone}</span></div>
            <div><span style={{ color: 'var(--app-text-dim)' }}>Location:</span> <span style={{ color: 'var(--app-text-primary)' }}>{eq.location || '—'}</span></div>
            <div><span style={{ color: 'var(--app-text-dim)' }}>Discipline:</span> <span style={{ color: 'var(--app-text-primary)' }}>{eq.discipline}</span></div>
            <div><span style={{ color: 'var(--app-text-dim)' }}>Contractor:</span> <span style={{ color: 'var(--app-text-primary)' }}>{eq.contractor || '—'}</span></div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(51,65,85,0.5)' }}>
            <div className="h-full rounded-full" style={{ width: `${eq.percentComplete}%`, background: color }} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onEdit} className="flex items-center gap-1 px-2 py-1 rounded text-[10px]" style={{ background: 'var(--app-accent-bg)', color: 'var(--app-accent)' }}><Pencil size={10} /> Edit</button>
            <button onClick={onCamera} className="flex items-center gap-1 px-2 py-1 rounded text-[10px]" style={{ background: 'var(--app-accent-bg)', color: 'var(--app-accent)' }}><Camera size={10} /> Evidence</button>
          </div>
          <select
            className="input w-full px-2 py-1 text-xs rounded"
            value={eq.status}
            onChange={e => {
              const idx = statusOrder.indexOf(e.target.value);
              onUpdate(eq.id, {
                status: e.target.value as Equipment['status'],
                percentComplete: Math.round((idx / (statusOrder.length - 1)) * 100),
              });
            }}
          >
            {statusOrder.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {eq.notes && <p className="text-[10px]" style={{ color: 'var(--app-text-muted)' }}>{eq.notes}</p>}
          <button onClick={() => onDelete(eq.id)} className="flex items-center gap-1 text-[10px] hover:opacity-80 transition-opacity" style={{ color: 'var(--app-danger)' }}>
            <Trash2 size={10} /> Remove
          </button>
        </div>
      )}
    </div>
  );
}

import type { Equipment } from '@/types';
