import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Zap, Search, Plus, CheckCircle2, Truck, Circle
} from 'lucide-react';

const eqStatusOrder = ['Not Commissioned', 'L1 - Documentation', 'L2 - Factory Witness', 'L3 - Startup', 'L4 - Functional', 'L5 - Integrated'];
const eqStatusColors: Record<string, string> = {
  'Not Commissioned': '#64748b', 'L1 - Documentation': '#94a3b8', 'L2 - Factory Witness': '#f59e0b',
  'L3 - Startup': '#22d3ee', 'L4 - Functional': '#3b82f6', 'L5 - Integrated': '#10b981',
};
const invStatusColors: Record<string, string> = {
  'Pending': '#64748b', 'Ordered': '#94a3b8', 'In Transit': '#f59e0b',
  'Received': '#22d3ee', 'Partial': '#a855f7', 'Installed': '#10b981', 'Rejected': '#ef4444',
};

export default function AssetsPage() {
  const { equipment, inventory } = useApp();
  const [activeTab, setActiveTab] = useState<'equipment' | 'inventory'>('equipment');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showAdd, setShowAdd] = useState(false);

  // Equipment metrics
  const eqIntegrated = equipment.filter(e => e.status === 'L5 - Integrated').length;

  // Inventory metrics
  const invReceived = inventory.filter(i => i.status === 'Received' || i.status === 'Installed').length;
  const invPending = inventory.filter(i => i.status === 'Pending' || i.status === 'Ordered' || i.status === 'In Transit').length;

  const filteredEquipment = useMemo(() => {
    let result = equipment;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(s) || e.zone.toLowerCase().includes(s) || e.type.toLowerCase().includes(s));
    }
    if (filterStatus) result = result.filter(e => e.status === filterStatus);
    return result;
  }, [equipment, search, filterStatus]);

  const filteredInventory = useMemo(() => {
    let result = inventory;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(s) || i.zone.toLowerCase().includes(s));
    }
    if (filterStatus) result = result.filter(i => i.status === filterStatus);
    return result;
  }, [inventory, search, filterStatus]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={16} style={{ color: '#22d3ee' }} />
          <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Assets & Equipment</h1>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
          <Plus size={10} /> Add
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="card p-2 text-center">
          <div className="text-lg font-bold" style={{ color: '#22d3ee' }}>{equipment.length}</div>
          <div className="text-[9px]" style={{ color: '#94a3b8' }}>Equipment</div>
        </div>
        <div className="card p-2 text-center">
          <div className="text-lg font-bold" style={{ color: '#10b981' }}>{eqIntegrated}/{equipment.length}</div>
          <div className="text-[9px]" style={{ color: '#94a3b8' }}>Commissioned</div>
        </div>
        <div className="card p-2 text-center">
          <div className="text-lg font-bold" style={{ color: '#a855f7' }}>{inventory.length}</div>
          <div className="text-[9px]" style={{ color: '#94a3b8' }}>Inventory Items</div>
        </div>
        <div className="card p-2 text-center">
          <div className="text-lg font-bold" style={{ color: invPending > 0 ? '#f59e0b' : '#10b981' }}>{invReceived}/{inventory.length}</div>
          <div className="text-[9px]" style={{ color: '#94a3b8' }}>Received</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        <button onClick={() => { setActiveTab('equipment'); setFilterStatus(''); }} className="px-3 py-1.5 rounded text-[11px] font-medium" style={{ background: activeTab === 'equipment' ? 'rgba(34,211,238,0.15)' : 'rgba(51,65,85,0.2)', color: activeTab === 'equipment' ? '#22d3ee' : '#94a3b8' }}>
          Equipment ({equipment.length})
        </button>
        <button onClick={() => { setActiveTab('inventory'); setFilterStatus(''); }} className="px-3 py-1.5 rounded text-[11px] font-medium" style={{ background: activeTab === 'inventory' ? 'rgba(168,85,247,0.15)' : 'rgba(51,65,85,0.2)', color: activeTab === 'inventory' ? '#a855f7' : '#94a3b8' }}>
          Inventory ({inventory.length})
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${activeTab}...`} className="input w-full pl-7 pr-3 py-1.5 text-[11px] rounded" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input px-2 py-1.5 text-[11px] rounded">
          <option value="">All Status</option>
          {(activeTab === 'equipment' ? eqStatusOrder : Object.keys(invStatusColors)).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Equipment Tab */}
      {activeTab === 'equipment' && (
        <div className="space-y-1">
          {/* Status distribution */}
          <div className="flex gap-0.5 h-2 rounded-full overflow-hidden mb-3">
            {eqStatusOrder.map(s => {
              const count = equipment.filter(e => e.status === s).length;
              const width = equipment.length > 0 ? (count / equipment.length) * 100 : 0;
              return width > 0 ? <div key={s} style={{ width: `${width}%`, background: eqStatusColors[s] }} title={`${s}: ${count}`} /> : null;
            })}
          </div>

          {filteredEquipment.map(eq => (
            <div key={eq.id} className="card p-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-2 h-2 rounded-full" style={{ background: eqStatusColors[eq.status] }} />
                  <span className="text-[11px] font-medium truncate" style={{ color: '#e2e8f0' }}>{eq.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(51,65,85,0.4)', color: eqStatusColors[eq.status] }}>{eq.status}</span>
                  <span className="text-[9px]" style={{ color: '#64748b' }}>{eq.zone}</span>
                </div>
              </div>
              <div className="mt-1 w-full h-1 rounded-full" style={{ background: 'rgba(51,65,85,0.5)' }}>
                <div className="h-full rounded-full" style={{ width: `${eq.percentComplete}%`, background: eqStatusColors[eq.status] }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-1">
          {filteredInventory.map(item => (
            <div key={item.id} className="card p-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {item.status === 'Installed' ? <CheckCircle2 size={10} style={{ color: '#10b981' }} /> :
                   item.status === 'In Transit' ? <Truck size={10} style={{ color: '#f59e0b' }} /> :
                   <Circle size={10} style={{ color: '#64748b' }} />}
                  <span className="text-[11px] font-medium truncate" style={{ color: '#e2e8f0' }}>{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(51,65,85,0.4)', color: invStatusColors[item.status] }}>{item.status}</span>
                  <span className="text-[9px]" style={{ color: '#64748b' }}>{item.quantityReceived}/{item.quantity}</span>
                  <span className="text-[9px]" style={{ color: '#64748b' }}>{item.zone}</span>
                </div>
              </div>
              {item.supplier && <div className="text-[9px] mt-1" style={{ color: '#64748b' }}>Supplier: {item.supplier} {item.poNumber ? `· PO: ${item.poNumber}` : ''}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
