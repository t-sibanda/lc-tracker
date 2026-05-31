import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Zap, Plus, Search, Trash2, X, ChevronDown, ChevronUp, Camera } from 'lucide-react';
import CameraCapture from '@/components/CameraCapture';
import SidebarFilter from '@/components/SidebarFilter';

const statusOrder = ['Not Commissioned', 'L1 - Documentation', 'L2 - Factory Witness', 'L3 - Startup', 'L4 - Functional', 'L5 - Integrated'];
const statusColors: Record<string, string> = {
  'Not Commissioned': '#64748b', 'L1 - Documentation': '#94a3b8', 'L2 - Factory Witness': '#f59e0b',
  'L3 - Startup': '#22d3ee', 'L4 - Functional': '#3b82f6', 'L5 - Integrated': '#10b981',
};

export default function EquipmentPage() {
  const { equipment, addEquipment, updateEquipment, deleteEquipment } = useApp();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
          <Zap size={16} style={{ color: '#22d3ee' }} />
          <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Equipment</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>{filtered.length}</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
          <Plus size={12} /> Add Equipment
        </button>
      </div>

      {/* Overall Progress */}
      <div className="card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium" style={{ color: '#94a3b8' }}>Overall Commissioning Progress</span>
          <span className="text-sm font-bold" style={{ color: '#22d3ee' }}>{overallPct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(51,65,85,0.5)' }}>
          <div className="h-full rounded-full" style={{ width: `${overallPct}%`, background: overallPct === 100 ? '#10b981' : '#22d3ee' }} />
        </div>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search equipment..." className="input w-full pl-8 pr-3 py-2 text-xs rounded-lg" />
      </div>

      {showAdd && (
        <div className="card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: '#22d3ee' }}>New Equipment</span>
            <button onClick={() => setShowAdd(false)}><X size={14} style={{ color: '#64748b' }} /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <input className="input px-2 py-1 text-xs rounded" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <select className="input px-2 py-1 text-xs rounded" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {['CDU', 'Energy Valve', 'RPP', 'RIO Panel', 'Leak Detection Gateway', 'Sound Gateway', 'Aparian Router', 'Control Panel', 'CRAH', 'ATS'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="input px-2 py-1 text-xs rounded" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })}>
              {['POD 1','POD 2','POD 3','POD 4','POD 5','POD 6','POD 7','POD 8','Hospital POD','Visitor Lab','Machine Farm','Bench Lab','Chamber Lab'].map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            <input className="input px-2 py-1 text-xs rounded" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <button onClick={handleAdd} className="px-4 py-1.5 rounded text-[10px] font-medium" style={{ background: '#22d3ee', color: '#0f172a' }}>Add</button>
        </div>
      )}

      <div className="flex gap-3">
        <div className="hidden lg:block"><SidebarFilter groups={filterGroups} selected={filters} onToggle={toggleFilter} /></div>
        <div className="flex-1 min-w-0 space-y-2">
          {filtered.map(eq => (
            <div key={eq.id} className="card overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === eq.id ? null : eq.id)} className="w-full p-3 flex items-center gap-2 text-left">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: statusColors[eq.status] }} />
                <span className="text-xs font-medium flex-1 truncate" style={{ color: '#e2e8f0' }}>{eq.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ background: 'rgba(51,65,85,0.5)', color: '#94a3b8' }}>{eq.type}</span>
                <span className="text-[10px] shrink-0" style={{ color: statusColors[eq.status] }}>{eq.status}</span>
                {expandedId === eq.id ? <ChevronUp size={12} style={{ color: '#64748b' }} /> : <ChevronDown size={12} style={{ color: '#64748b' }} />}
              </button>
              {expandedId === eq.id && (
                <div className="px-3 pb-3 space-y-2" style={{ borderTop: '1px solid rgba(51,65,85,0.3)' }}>
                  <div className="pt-2 grid grid-cols-2 gap-2 text-[11px]">
                    <div><span style={{ color: '#64748b' }}>Zone:</span> <span style={{ color: '#e2e8f0' }}>{eq.zone}</span></div>
                    <div><span style={{ color: '#64748b' }}>Location:</span> <span style={{ color: '#e2e8f0' }}>{eq.location}</span></div>
                    <div><span style={{ color: '#64748b' }}>Discipline:</span> <span style={{ color: '#e2e8f0' }}>{eq.discipline}</span></div>
                    <div><span style={{ color: '#64748b' }}>Contractor:</span> <span style={{ color: '#e2e8f0' }}>{eq.contractor}</span></div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(51,65,85,0.5)' }}>
                    <div className="h-full rounded-full" style={{ width: `${eq.percentComplete}%`, background: statusColors[eq.status] }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setCameraTarget({ entityId: eq.id, entityName: eq.name, zone: eq.zone }); setShowCamera(true); }} className="flex items-center gap-1 px-2 py-1 rounded text-[10px]" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}><Camera size={10} /> Evidence</button>
                  </div>
                  <select
                    className="input w-full px-2 py-1 text-xs rounded"
                    value={eq.status}
                    onChange={e => {
                      const idx = statusOrder.indexOf(e.target.value);
                      updateEquipment(eq.id, {
                        status: e.target.value as Equipment['status'],
                        percentComplete: Math.round((idx / (statusOrder.length - 1)) * 100),
                      });
                    }}
                  >
                    {statusOrder.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {eq.notes && <p className="text-[10px]" style={{ color: '#94a3b8' }}>{eq.notes}</p>}
                  <button onClick={() => deleteEquipment(eq.id)} className="flex items-center gap-1 text-[10px] hover:text-red-400 transition-colors" style={{ color: '#ef4444' }}>
                    <Trash2 size={10} /> Remove
                  </button>
                </div>
              )}
            </div>
          ))}
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

import type { Equipment } from '@/types';
