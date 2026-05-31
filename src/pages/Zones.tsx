import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Map, ChevronRight, TrendingUp } from 'lucide-react';

const zoneOrder = [
  'POD 1', 'POD 2', 'POD 3', 'POD 4', 'POD 5', 'POD 6', 'POD 7', 'POD 8',
  'Hospital POD', 'Visitor Lab', 'Machine Farm', 'Bench Lab', 'Chamber Lab'
];

const zoneColors: Record<string, string> = {
  'POD 1': '#22d3ee', 'POD 2': '#06b6d4', 'POD 3': '#0891b2', 'POD 4': '#0e7490',
  'POD 5': '#14b8a6', 'POD 6': '#2dd4bf', 'POD 7': '#f59e0b', 'POD 8': '#f97316',
  'Hospital POD': '#ef4444', 'Visitor Lab': '#a855f7', 'Machine Farm': '#10b981',
  'Bench Lab': '#3b82f6', 'Chamber Lab': '#ec4899',
};

export default function Zones() {
  const { tasks } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const zoneTasks = tasks.filter(t => t.scope === 'zone');

  const zones = useMemo(() => {
    return zoneOrder.map(zoneName => {
      const zTasks = zoneTasks.filter(t => t.zone === zoneName);
      const pct = zTasks.length > 0 ? Math.round(zTasks.reduce((s, t) => s + t.percentComplete, 0) / zTasks.length) : 0;
      const systems = [...new Set(zTasks.map(t => t.system))];
      const status = pct === 100 ? 'Complete' : pct > 0 ? 'In Progress' : 'Not Started';
      return { name: zoneName, taskCount: zTasks.length, overallPercent: pct, status, systems };
    }).filter(z => {
      if (search && !z.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [zoneTasks, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Map size={16} style={{ color: '#22d3ee' }} />
          <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Zones</h1>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search zones..."
          className="input px-3 py-1.5 text-xs rounded-lg w-48"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {zones.map(zone => (
          <button
            key={zone.name}
            onClick={() => navigate(`/zones/${encodeURIComponent(zone.name)}`)}
            className="card p-4 text-left transition-all hover:scale-[1.01] hover:shadow-lg group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: zoneColors[zone.name] || '#22d3ee' }} />
                <span className="text-xs font-bold" style={{ color: '#e2e8f0' }}>{zone.name}</span>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#64748b' }} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={12} style={{ color: zone.overallPercent === 100 ? '#10b981' : zone.overallPercent > 0 ? '#22d3ee' : '#64748b' }} />
              <span className="text-lg font-bold" style={{ color: zone.overallPercent === 100 ? '#10b981' : zone.overallPercent > 0 ? '#22d3ee' : '#64748b' }}>
                {zone.overallPercent}%
              </span>
              <span className="text-[10px]" style={{ color: '#64748b' }}>({zone.taskCount} tasks)</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(51,65,85,0.5)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${zone.overallPercent}%`, background: zoneColors[zone.name] || '#22d3ee' }} />
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {zone.systems.map(s => (
                <span key={s} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(51,65,85,0.5)', color: '#94a3b8' }}>{s}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
