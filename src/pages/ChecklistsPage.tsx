import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { ClipboardCheck, Plus, Search, X, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, Upload, FolderOpen, Camera } from 'lucide-react';
import CameraCapture from '@/components/CameraCapture';
import SidebarFilter from '@/components/SidebarFilter';
import type { ChecklistItem, ChecklistDocument } from '@/types';

let nextId = 1;
function uid(prefix: string): string { return `${prefix}-${Date.now()}-${nextId++}`; }

const statusColors: Record<string, string> = { 'Complete': '#10b981', 'In Progress': '#f59e0b', 'Not Started': '#64748b' };

const checklistTemplates: Record<string, { description: string; expectedResult: string }[]> = {
  'Pre-Functional': [
    { description: 'Verify equipment nameplate matches submittal.', expectedResult: 'Nameplate data matches approved submittal.' },
    { description: 'Inspect for physical damage during shipping.', expectedResult: 'No visible damage to equipment or packaging.' },
    { description: 'Verify all accessories and loose parts are included.', expectedResult: 'All items on packing list are present.' },
    { description: 'Check for proper equipment anchoring and leveling.', expectedResult: 'Equipment is properly anchored and level.' },
  ],
  'Functional': [
    { description: 'Verify control power is properly connected.', expectedResult: 'Control power is on and stable.' },
    { description: 'Test all local control functions.', expectedResult: 'All local controls operate correctly.' },
    { description: 'Verify remote control signals are received.', expectedResult: 'Remote commands execute properly.' },
    { description: 'Test all safety interlocks and shutdowns.', expectedResult: 'All safety functions operate as designed.' },
    { description: 'Verify analog input signals read correctly.', expectedResult: 'All AI points read within tolerance.' },
    { description: 'Verify discrete output commands execute.', expectedResult: 'All DO points respond correctly.' },
  ],
  'Startup': [
    { description: 'Complete pre-startup checklist.', expectedResult: 'All pre-startup items verified.' },
    { description: 'Energize main power with qualified electrician present.', expectedResult: 'No faults or trips on energization.' },
    { description: 'Run equipment unloaded for minimum 30 minutes.', expectedResult: 'No abnormal vibration, noise, or temperatures.' },
    { description: 'Verify all alarms and warnings functional.', expectedResult: 'All alarms activate at setpoints.' },
    { description: 'Record baseline operating parameters.', expectedResult: 'All parameters within design range.' },
  ],
  'Visual Inspection': [
    { description: 'Inspect equipment for physical damage.', expectedResult: 'No visible damage.' },
    { description: 'Verify labels and nameplates are legible.', expectedResult: 'All labels readable and accurate.' },
    { description: 'Check piping/ductwork connections.', expectedResult: 'All connections secure and leak-free.' },
    { description: 'Verify gauges and indicators are functional.', expectedResult: 'All indicators read correctly.' },
  ],
};

function generateItems(type: string): ChecklistItem[] {
  const template = checklistTemplates[type] || checklistTemplates['Pre-Functional'];
  return template.map(t => ({
    id: uid('cl-item'),
    description: t.description,
    expectedResult: t.expectedResult,
    verified: false,
    actualReading: '',
    notes: '',
  }));
}

export default function ChecklistsPage() {
  const { checklists, addChecklist, updateChecklist, deleteChecklist } = useApp();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
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
    const items = generateItems(form.type);
    addChecklist({ ...form, status: 'Not Started', equipmentId: '', percentComplete: 0, items, documents: [] });
    setForm({ title: '', type: 'Pre-Functional', equipmentName: '', assignedTo: '', discipline: 'Controls' });
    setShowAdd(false);
  }

  const detailChecklist = checklists.find(c => c.id === detailId);

  if (detailId && detailChecklist) {
    return (
      <ChecklistDetail
        checklist={detailChecklist}
        onBack={() => setDetailId(null)}
        onUpdate={updateChecklist}
        onCamera={() => setShowCamera(true)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={16} style={{ color: 'var(--app-accent)' }} />
          <h1 className="text-sm font-bold" style={{ color: 'var(--app-text-primary)' }}>Checklists</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--app-accent-bg)', color: 'var(--app-accent)' }}>{filtered.length}</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium" style={{ background: 'var(--app-accent-bg)', color: 'var(--app-accent)' }}>
          <Plus size={12} /> Add Checklist
        </button>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--app-text-dim)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search checklists..." className="input w-full pl-8 pr-3 py-2 text-xs rounded-lg" />
      </div>

      {showAdd && (
        <div className="card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--app-accent)' }}>New Checklist</span>
            <button onClick={() => setShowAdd(false)}><X size={14} style={{ color: 'var(--app-text-dim)' }} /></button>
          </div>
          <input className="input w-full px-2 py-1 text-xs rounded" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <select className="input px-2 py-1 text-xs rounded" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {['Receipt Inspection', 'Pre-Functional', 'Visual Inspection', 'Functional', 'Test', 'Startup'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input className="input px-2 py-1 text-xs rounded" placeholder="Equipment" value={form.equipmentName} onChange={e => setForm({ ...form, equipmentName: e.target.value })} />
            <input className="input px-2 py-1 text-xs rounded" placeholder="Assigned To" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} />
          </div>
          <button onClick={handleAdd} className="px-4 py-1.5 rounded text-[10px] font-medium" style={{ background: 'var(--app-accent)', color: '#fff' }}>Add</button>
        </div>
      )}

      <div className="flex gap-3">
        <div className="hidden lg:block"><SidebarFilter groups={filterGroups} selected={filters} onToggle={toggleFilter} /></div>
        <div className="flex-1 min-w-0">
          <div className="space-y-2">
            {paged.map(cl => {
              const items = cl.items || [];
              const verifiedCount = items.filter(i => i.verified).length;
              const totalItems = items.length;
              return (
                <div key={cl.id} className="card p-3 cursor-pointer" onClick={() => setDetailId(cl.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${statusColors[cl.status]}20`, color: statusColors[cl.status] }}>{cl.status}</span>
                      <span className="text-xs font-medium" style={{ color: 'var(--app-text-primary)' }}>{cl.title}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteChecklist(cl.id); }}>
                      <Trash2 size={11} style={{ color: 'var(--app-danger)' }} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px]" style={{ color: 'var(--app-text-muted)' }}>{cl.type}</span>
                    {cl.equipmentName && <span className="text-[10px]" style={{ color: 'var(--app-text-dim)' }}>{cl.equipmentName}</span>}
                    {cl.assignedTo && <span className="text-[10px]" style={{ color: 'var(--app-text-dim)' }}>· {cl.assignedTo}</span>}
                    <span className="text-[10px] ml-auto" style={{ color: 'var(--app-text-dim)' }}>{verifiedCount}/{totalItems} items</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(51,65,85,0.5)' }}>
                    <div className="h-full rounded-full" style={{ width: `${totalItems > 0 ? (verifiedCount / totalItems) * 100 : 0}%`, background: statusColors[cl.status] }} />
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded disabled:opacity-30"><ChevronLeft size={14} style={{ color: 'var(--app-text-muted)' }} /></button>
              <span className="text-[11px]" style={{ color: 'var(--app-text-muted)' }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded disabled:opacity-30"><ChevronRight size={14} style={{ color: 'var(--app-text-muted)' }} /></button>
            </div>
          )}
        </div>
      </div>

      {showCamera && (
        <CameraCapture
          onClose={() => setShowCamera(false)}
          entityType="checklist"
          entityId={detailId || ''}
          entityName={detailChecklist?.title || ''}
          zone="General"
        />
      )}
    </div>
  );
}

function ChecklistDetail({ checklist, onBack, onUpdate, onCamera }: {
  checklist: import('@/types').Checklist;
  onBack: () => void;
  onUpdate: (id: string, u: Partial<import('@/types').Checklist>) => void;
  onCamera: () => void;
}) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showDocUpload, setShowDocUpload] = useState(false);

  const items = checklist.items || [];
  const documents = checklist.documents || [];
  const verifiedCount = items.filter(i => i.verified).length;
  const totalItems = items.length;
  const completionPct = totalItems > 0 ? Math.round((verifiedCount / totalItems) * 100) : 0;

  const status: import('@/types').Checklist['status'] = completionPct === 100 ? 'Complete' : completionPct > 0 ? 'In Progress' : 'Not Started';

  function toggleItem(itemId: string) {
    const updated = items.map(i => i.id === itemId ? { ...i, verified: !i.verified } : i);
    onUpdate(checklist.id, { items: updated, status });
  }

  function updateItemField(itemId: string, field: 'actualReading' | 'notes', value: string) {
    const updated = items.map(i => i.id === itemId ? { ...i, [field]: value } : i);
    onUpdate(checklist.id, { items: updated });
  }

  function toggleExpanded(itemId: string) {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const type: ChecklistDocument['type'] = file.name.endsWith('.pdf') ? 'pdf' : file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : file.name.match(/\.(doc|docx)$/i) ? 'doc' : 'other';
      const doc: ChecklistDocument = {
        id: uid('doc'),
        name: file.name,
        type,
        url: reader.result as string,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'User',
      };
      onUpdate(checklist.id, { documents: [...documents, doc] });
      setShowDocUpload(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-1.5 rounded" style={{ color: 'var(--app-text-dim)' }}><ChevronLeft size={16} /></button>
        <div>
          <h1 className="text-sm font-bold" style={{ color: 'var(--app-text-primary)' }}>{checklist.title}</h1>
          <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--app-text-muted)' }}>
            <span>{checklist.type}</span>
            {checklist.equipmentName && <span>· {checklist.equipmentName}</span>}
            {checklist.assignedTo && <span>· {checklist.assignedTo}</span>}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium" style={{ color: 'var(--app-text-muted)' }}>Completion</span>
          <span className="text-sm font-bold" style={{ color: statusColors[status] }}>{completionPct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(51,65,85,0.5)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${completionPct}%`, background: statusColors[status] }} />
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={onCamera} className="flex items-center gap-1 px-2 py-1 rounded text-[10px]" style={{ background: 'var(--app-accent-bg)', color: 'var(--app-accent)' }}><Camera size={10} /> Photo Evidence</button>
          <button onClick={() => setShowDocUpload(!showDocUpload)} className="flex items-center gap-1 px-2 py-1 rounded text-[10px]" style={{ background: 'var(--app-accent-bg)', color: 'var(--app-accent)' }}><Upload size={10} /> Document</button>
        </div>
        {showDocUpload && (
          <div className="mt-2">
            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg" onChange={handleDocUpload} className="text-[10px]" style={{ color: 'var(--app-text-muted)' }} />
          </div>
        )}
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium" style={{ color: 'var(--app-accent)' }}>Checklist Items</span>
          <span className="text-[10px]" style={{ color: 'var(--app-text-dim)' }}>{verifiedCount}/{totalItems} verified</span>
        </div>

        {items.map((item, idx) => {
          const isExpanded = expandedItems.has(item.id);
          return (
            <div
              key={item.id}
              className="card p-2.5 transition-colors"
              style={{
                background: item.verified ? 'rgba(16,185,129,0.05)' : 'var(--app-bg-card)',
                border: `1px solid ${item.verified ? 'rgba(16,185,129,0.2)' : 'var(--app-border)'}`,
              }}
            >
              <div className="flex items-start gap-2">
                <button
                  onClick={() => toggleItem(item.id)}
                  className="mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    background: item.verified ? 'var(--app-success)' : 'transparent',
                    border: `1.5px solid ${item.verified ? 'var(--app-success)' : 'var(--app-text-dim)'}`,
                  }}
                >
                  {item.verified && <Check size={10} style={{ color: '#fff' }} />}
                </button>
                <div className="flex-1 min-w-0">
                  <button onClick={() => toggleExpanded(item.id)} className="text-left w-full">
                    <span className="text-[11px]" style={{ color: item.verified ? 'var(--app-text-muted)' : 'var(--app-text-primary)', textDecoration: item.verified ? 'line-through' : 'none' }}>
                      <span className="text-[9px] mr-1" style={{ color: 'var(--app-text-dim)' }}>{idx + 1}.</span>
                      {item.description}
                    </span>
                    {item.verified && <span className="text-[9px] ml-1" style={{ color: 'var(--app-success)' }}>✓ Verified</span>}
                  </button>

                  {isExpanded && (
                    <div className="mt-1.5 space-y-1.5 pl-0">
                      <div className="text-[9px] p-1.5 rounded" style={{ background: 'var(--app-bg-elevated)', color: 'var(--app-text-muted)' }}>
                        <span style={{ color: 'var(--app-accent)' }}>Expected: </span>{item.expectedResult}
                      </div>
                      <input
                        className="input w-full px-2 py-1 text-[10px] rounded"
                        placeholder="Actual reading / observation..."
                        value={item.actualReading}
                        onChange={e => updateItemField(item.id, 'actualReading', e.target.value)}
                      />
                      <input
                        className="input w-full px-2 py-1 text-[10px] rounded"
                        placeholder="Notes / findings..."
                        value={item.notes}
                        onChange={e => updateItemField(item.id, 'notes', e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <button onClick={() => toggleExpanded(item.id)} className="shrink-0 mt-0.5" style={{ color: 'var(--app-text-dim)' }}>
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="card p-4 text-center text-[11px]" style={{ color: 'var(--app-text-dim)' }}>
            No checklist items. The checklist was created before the item tracking feature was added.
          </div>
        )}
      </div>

      {/* Documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-medium" style={{ color: 'var(--app-accent)' }}>Attached Documents</span>
          <div className="space-y-1">
            {documents.map(doc => (
              <div key={doc.id} className="card p-2 flex items-center gap-2">
                <FolderOpen size={12} style={{ color: 'var(--app-accent)' }} />
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-[11px] flex-1 truncate underline" style={{ color: 'var(--app-accent)' }}>{doc.name}</a>
                <span className="text-[9px] uppercase px-1 py-0.5 rounded" style={{ background: 'var(--app-bg-elevated)', color: 'var(--app-text-muted)' }}>{doc.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


