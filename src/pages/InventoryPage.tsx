import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Package, Plus, Search, Trash2, X, Pencil, Camera,
  CheckCircle2, Truck, AlertTriangle, Circle
} from 'lucide-react';
import type { InventoryItem } from '@/types';
import CameraCapture from '@/components/CameraCapture';
import SidebarFilter from '@/components/SidebarFilter';

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  'Pending': { color: '#64748b', icon: Circle },
  'Ordered': { color: '#3b82f6', icon: CheckCircle2 },
  'In Transit': { color: '#f59e0b', icon: Truck },
  'Received': { color: '#10b981', icon: CheckCircle2 },
  'Partial': { color: '#f59e0b', icon: AlertTriangle },
  'Installed': { color: '#22d3ee', icon: CheckCircle2 },
  'Rejected': { color: '#ef4444', icon: X },
};

export default function InventoryPage() {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useApp();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<{ entityId: string; entityName: string; zone: string } | null>(null);

  const filterGroups = useMemo(() => [
    { label: 'Status', options: Object.keys(statusConfig).map(s => ({ value: s, count: inventory.filter(i => i.status === s).length, color: statusConfig[s].color })) },
    { label: 'System', options: [...new Set(inventory.map(i => i.system))].map(s => ({ value: s, count: inventory.filter(i => i.system === s).length })) },
    { label: 'Zone', options: [...new Set(inventory.map(i => i.zone))].map(z => ({ value: z, count: inventory.filter(i => i.zone === z).length })) },
  ], [inventory]);

  const filtered = useMemo(() => {
    return inventory.filter(i => {
      if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.supplier.toLowerCase().includes(search.toLowerCase()) && !i.poNumber.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters['Status']?.length && !filters['Status'].includes(i.status)) return false;
      if (filters['System']?.length && !filters['System'].includes(i.system)) return false;
      if (filters['Zone']?.length && !filters['Zone'].includes(i.zone)) return false;
      return true;
    });
  }, [inventory, search, filters]);

  const toggleFilter = (group: string, value: string) => {
    setFilters(prev => {
      const curr = prev[group] || [];
      return { ...prev, [group]: curr.includes(value) ? curr.filter(v => v !== value) : [...curr, value] };
    });
  };

  // Summary stats
  const totalReceived = inventory.reduce((s, i) => s + i.quantityReceived, 0);
  const totalOrdered = inventory.reduce((s, i) => s + i.quantity, 0);
  const pendingCount = inventory.filter(i => i.status === 'Pending' || i.status === 'Ordered').length;
  const inTransitCount = inventory.filter(i => i.status === 'In Transit').length;


  const [form, setForm] = useState({
    name: '', description: '', quantity: 0, quantityReceived: 0, zone: 'All',
    system: 'Controls', supplier: '', poNumber: '', scheduledDate: '',
    receivedDate: '', receivedBy: '', signedOffBy: '', status: 'Pending' as InventoryItem['status'], notes: '',
  });

  function handleAdd() {
    if (!form.name.trim()) return;
    addInventoryItem({ ...form, photos: [] });
    setForm({ name: '', description: '', quantity: 0, quantityReceived: 0, zone: 'All', system: 'Controls', supplier: '', poNumber: '', scheduledDate: '', receivedDate: '', receivedBy: '', signedOffBy: '', status: 'Pending', notes: '' });
    setShowAdd(false);
  }

  function openCamera(itemId: string, itemName: string, itemZone: string) {
    setCameraTarget({ entityId: itemId, entityName: itemName, zone: itemZone });
    setShowCamera(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Package size={16} style={{ color: '#22d3ee' }} />
          <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Inventory</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>{filtered.length}</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
          <Plus size={12} /> Add Item
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="card p-3 text-center">
          <div className="text-lg font-bold" style={{ color: '#22d3ee' }}>{totalOrdered}</div>
          <div className="text-[9px]" style={{ color: '#94a3b8' }}>Total Ordered</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-lg font-bold" style={{ color: '#10b981' }}>{totalReceived}</div>
          <div className="text-[9px]" style={{ color: '#94a3b8' }}>Total Received</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-lg font-bold" style={{ color: '#f59e0b' }}>{pendingCount}</div>
          <div className="text-[9px]" style={{ color: '#94a3b8' }}>Pending/Ordered</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-lg font-bold" style={{ color: '#3b82f6' }}>{inTransitCount}</div>
          <div className="text-[9px]" style={{ color: '#94a3b8' }}>In Transit</div>
        </div>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory by name, supplier, PO..." className="input w-full pl-8 pr-3 py-2 text-xs rounded-lg" />
      </div>

      {showAdd && (
        <div className="card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: '#22d3ee' }}>New Inventory Item</span>
            <button onClick={() => setShowAdd(false)}><X size={14} style={{ color: '#64748b' }} /></button>
          </div>
          <input className="input w-full px-2 py-1 text-xs rounded" placeholder="Item name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <textarea className="input w-full px-2 py-1 text-xs rounded" placeholder="Description" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <input type="number" className="input px-2 py-1 text-xs rounded" placeholder="Qty" value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
            <input type="number" className="input px-2 py-1 text-xs rounded" placeholder="Received" value={form.quantityReceived || ''} onChange={e => setForm({ ...form, quantityReceived: Number(e.target.value) })} />
            <select className="input px-2 py-1 text-xs rounded" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as InventoryItem['status'] })}>
              {Object.keys(statusConfig).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input className="input px-2 py-1 text-xs rounded" placeholder="Supplier" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
            <input className="input px-2 py-1 text-xs rounded" placeholder="PO Number" value={form.poNumber} onChange={e => setForm({ ...form, poNumber: e.target.value })} />
            <input className="input px-2 py-1 text-xs rounded" placeholder="Zone" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input type="date" className="input px-2 py-1 text-xs rounded" placeholder="Scheduled" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })} />
            <input className="input px-2 py-1 text-xs rounded" placeholder="Received By" value={form.receivedBy} onChange={e => setForm({ ...form, receivedBy: e.target.value })} />
            <input className="input px-2 py-1 text-xs rounded" placeholder="Signed Off By" value={form.signedOffBy} onChange={e => setForm({ ...form, signedOffBy: e.target.value })} />
          </div>
          <textarea className="input w-full px-2 py-1 text-xs rounded" placeholder="Notes" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <button onClick={handleAdd} className="px-4 py-1.5 rounded text-[10px] font-medium" style={{ background: '#22d3ee', color: '#0f172a' }}>Add Item</button>
        </div>
      )}

      <div className="flex gap-3">
        <div className="hidden lg:block"><SidebarFilter groups={filterGroups} selected={filters} onToggle={toggleFilter} /></div>
        <div className="flex-1 min-w-0 space-y-2">
          {filtered.map(item => {
            const cfg = statusConfig[item.status];
            const StatusIcon = cfg.icon;
            const pct = item.quantity > 0 ? Math.round((item.quantityReceived / item.quantity) * 100) : 0;
            const isEditing = editingId === item.id;

            return (
              <div key={item.id} className="card overflow-hidden">
                <div className="p-3">
                  <div className="flex items-start gap-2">
                    <StatusIcon size={12} className="mt-0.5 shrink-0" style={{ color: cfg.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium" style={{ color: '#e2e8f0' }}>{item.name}</span>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => openCamera(item.id, item.name, item.zone)} className="p-1 rounded hover:bg-white/5" title="Add evidence photo"><Camera size={11} style={{ color: '#64748b' }} /></button>
                          <button onClick={() => setEditingId(isEditing ? null : item.id)} className="p-1 rounded hover:bg-white/5"><Pencil size={11} style={{ color: '#64748b' }} /></button>
                          <button onClick={() => deleteInventoryItem(item.id)} className="p-1 rounded hover:bg-white/5"><Trash2 size={11} style={{ color: '#ef4444' }} /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${cfg.color}20`, color: cfg.color }}>{item.status}</span>
                        {item.poNumber && <span className="text-[9px]" style={{ color: '#64748b' }}>PO: {item.poNumber}</span>}
                        {item.supplier && <span className="text-[9px]" style={{ color: '#64748b' }}>{item.supplier}</span>}
                        <span className="text-[9px] ml-auto" style={{ color: '#94a3b8' }}>{item.quantityReceived}/{item.quantity}</span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1 rounded-full overflow-hidden mt-1.5" style={{ background: 'rgba(51,65,85,0.5)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                      {/* Detail row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-0.5 mt-2 text-[10px]">
                        {item.zone && item.zone !== 'All' && <span style={{ color: '#64748b' }}>Zone: <span style={{ color: '#94a3b8' }}>{item.zone}</span></span>}
                        {item.system && <span style={{ color: '#64748b' }}>System: <span style={{ color: '#94a3b8' }}>{item.system}</span></span>}
                        {item.scheduledDate && <span style={{ color: '#64748b' }}>Scheduled: <span style={{ color: '#94a3b8' }}>{item.scheduledDate}</span></span>}
                        {item.receivedDate && <span style={{ color: '#64748b' }}>Received: <span style={{ color: '#94a3b8' }}>{item.receivedDate}</span></span>}
                        {item.receivedBy && <span style={{ color: '#64748b' }}>By: <span style={{ color: '#94a3b8' }}>{item.receivedBy}</span></span>}
                        {item.signedOffBy && <span style={{ color: '#64748b' }}>Signed: <span style={{ color: '#94a3b8' }}>{item.signedOffBy}</span></span>}
                      </div>
                      {item.notes && <p className="text-[10px] mt-1" style={{ color: '#94a3b8' }}>{item.notes}</p>}

                      {/* Inline Edit */}
                      {isEditing && (
                        <div className="mt-2 pt-2 space-y-1.5" style={{ borderTop: '1px solid rgba(51,65,85,0.3)' }}>
                          <div className="grid grid-cols-3 gap-2">
                            <input type="number" className="input px-2 py-1 text-[10px] rounded" placeholder="Qty" defaultValue={item.quantity} onBlur={e => updateInventoryItem(item.id, { quantity: Number(e.target.value) })} />
                            <input type="number" className="input px-2 py-1 text-[10px] rounded" placeholder="Received" defaultValue={item.quantityReceived} onBlur={e => updateInventoryItem(item.id, { quantityReceived: Number(e.target.value) })} />
                            <select className="input px-2 py-1 text-[10px] rounded" value={item.status} onChange={e => updateInventoryItem(item.id, { status: e.target.value as InventoryItem['status'] })}>
                              {Object.keys(statusConfig).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <input className="input px-2 py-1 text-[10px] rounded" placeholder="Received By" defaultValue={item.receivedBy} onBlur={e => updateInventoryItem(item.id, { receivedBy: e.target.value })} />
                            <input className="input px-2 py-1 text-[10px] rounded" placeholder="Signed Off" defaultValue={item.signedOffBy} onBlur={e => updateInventoryItem(item.id, { signedOffBy: e.target.value })} />
                            <input type="date" className="input px-2 py-1 text-[10px] rounded" defaultValue={item.receivedDate} onChange={e => updateInventoryItem(item.id, { receivedDate: e.target.value })} />
                          </div>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1 rounded text-[10px] font-medium" style={{ background: '#22d3ee', color: '#0f172a' }}>Done</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="card p-6 text-center text-[11px]" style={{ color: '#64748b' }}>No inventory items match your filters.</div>}
        </div>
      </div>

      {showCamera && cameraTarget && (
        <CameraCapture
          onClose={() => setShowCamera(false)}
          entityType="inventory"
          entityId={cameraTarget.entityId}
          entityName={cameraTarget.entityName}
          zone={cameraTarget.zone}
        />
      )}
    </div>
  );
}
