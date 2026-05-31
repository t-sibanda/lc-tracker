import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { ClipboardCheck, Plus, Search, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import SidebarFilter from '@/components/SidebarFilter';

const statusColors: Record<string, string> = { 'Complete': '#10b981', 'In Progress': '#f59e0b', 'Not Started': '#64748b' };

export default function ChecklistsPage() {
  const { checklists, addChecklist, updateChecklist, deleteChecklist } = useApp();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const perPage = 25;

  const filterGroups = useMemo(() => [
    { label: 'Status', options: ['Complete', 'In Progress', 'Not Started'].map(s => ({ value: s, count: checklists.filter(c => c.status === s).length, color: statusColors[s] })) },
    { label: 'Type', options: [...new Set(checklists.map(c => c.type))].map(t => ({ value: t, count: checklists.filter(c => c.type === t).length })) },
  ], [checklists]);

  const filtered = useMemo(() => {
    return checklists.filter(c => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters['Status']?.length && !filters['Status'].includes(c.status)) return false;
      if (filters['Type']?.length && !filters['Type'].includes(c.type)) return false;
      return true;
    });
  }, [checklists, search, filters]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const toggleFilter = (group: string, value: string) => {
    setFilters(prev => {
      const curr = prev[group] || [];
      return { ...prev, [group]: curr.includes(value) ? curr.filter(v => v !== value) : [...curr, value] };
    });
    setPage(1);
  };

  const [form, setForm] = useState({ title: '', type: 'Pre-Functional', equipmentName: '', assignedTo: '', discipline: 'Controls' });

  function handleAdd() {
    if (!form.title.trim()) return;
    addChecklist({ ...form, status: 'Not Started', equipmentId: '', percentComplete: 0 });
    setForm({ title: '', type: 'Pre-Functional', equipmentName: '', assignedTo: '', discipline: 'Controls' });
    setShowAdd(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={16} style={{ color: '#22d3ee' }} />
          <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Checklists</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>{filtered.length}</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
          <Plus size={12} /> Add Checklist
        </button>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search checklists..." className="input w-full pl-8 pr-3 py-2 text-xs rounded-lg" />
      </div>

      {showAdd && (
        <div className="card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: '#22d3ee' }}>New Checklist</span>
            <button onClick={() => setShowAdd(false)}><X size={14} style={{ color: '#64748b' }} /></button>
          </div>
          <input className="input w-full px-2 py-1 text-xs rounded" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <select className="input px-2 py-1 text-xs rounded" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {['Receipt Inspection', 'Pre-Functional', 'Visual Inspection', 'Functional', 'Test', 'Startup'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input className="input px-2 py-1 text-xs rounded" placeholder="Equipment" value={form.equipmentName} onChange={e => setForm({ ...form, equipmentName: e.target.value })} />
            <input className="input px-2 py-1 text-xs rounded" placeholder="Assigned To" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} />
          </div>
          <button onClick={handleAdd} className="px-4 py-1.5 rounded text-[10px] font-medium" style={{ background: '#22d3ee', color: '#0f172a' }}>Add</button>
        </div>
      )}

      <div className="flex gap-3">
        <div className="hidden lg:block"><SidebarFilter groups={filterGroups} selected={filters} onToggle={toggleFilter} /></div>
        <div className="flex-1 min-w-0">
          <div className="space-y-2">
            {paged.map(cl => (
              <div key={cl.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${statusColors[cl.status]}20`, color: statusColors[cl.status] }}>{cl.status}</span>
                    <span className="text-xs font-medium" style={{ color: '#e2e8f0' }}>{cl.title}</span>
                  </div>
                  <div className="flex gap-1">
                    <select
                      className="input text-[10px] px-1 py-0.5 rounded"
                      value={cl.status}
                      onChange={e => updateChecklist(cl.id, { status: e.target.value as Checklist['status'], percentComplete: e.target.value === 'Complete' ? 100 : e.target.value === 'In Progress' ? 50 : 0 })}
                    >
                      {['Not Started', 'In Progress', 'Complete'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => deleteChecklist(cl.id)}><Trash2 size={11} style={{ color: '#ef4444' }} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[10px]" style={{ color: '#94a3b8' }}>{cl.type}</span>
                  {cl.equipmentName && <span className="text-[10px]" style={{ color: '#64748b' }}>{cl.equipmentName}</span>}
                  {cl.assignedTo && <span className="text-[10px]" style={{ color: '#64748b' }}>· {cl.assignedTo}</span>}
                  <span className="text-[10px] ml-auto" style={{ color: '#64748b' }}>{cl.percentComplete}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(51,65,85,0.5)' }}>
                  <div className="h-full rounded-full" style={{ width: `${cl.percentComplete}%`, background: statusColors[cl.status] }} />
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded disabled:opacity-30"><ChevronLeft size={14} style={{ color: '#94a3b8' }} /></button>
              <span className="text-[11px]" style={{ color: '#94a3b8' }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded disabled:opacity-30"><ChevronRight size={14} style={{ color: '#94a3b8' }} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import type { Checklist } from '@/types';
