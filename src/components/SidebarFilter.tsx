import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface FilterGroup {
  label: string;
  options: { value: string; count?: number; color?: string }[];
}

interface SidebarFilterProps {
  groups: FilterGroup[];
  selected: Record<string, string[]>;
  onToggle: (group: string, value: string) => void;
  title?: string;
}

export default function SidebarFilter({ groups, selected, onToggle, title = 'Filters' }: SidebarFilterProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    groups.forEach(g => init[g.label] = true);
    return init;
  });

  return (
    <div className="w-full lg:w-56 shrink-0 space-y-3">
      <h3 className="text-xs font-bold tracking-wider uppercase" style={{ color: '#22d3ee' }}>{title}</h3>
      {groups.map(group => (
        <div key={group.label} className="card p-2">
          <button
            className="flex items-center justify-between w-full text-[11px] font-semibold mb-1"
            style={{ color: '#e2e8f0' }}
            onClick={() => setExpanded(prev => ({ ...prev, [group.label]: !prev[group.label] }))}
          >
            <span>{group.label}</span>
            {expanded[group.label] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {expanded[group.label] && (
            <div className="space-y-0.5">
              {group.options.map(opt => {
                const isSelected = selected[group.label]?.includes(opt.value) || false;
                return (
                  <button
                    key={opt.value}
                    className="flex items-center justify-between w-full text-[11px] px-2 py-1 rounded transition-colors"
                    style={{
                      background: isSelected ? 'rgba(34,211,238,0.15)' : 'transparent',
                      color: isSelected ? '#22d3ee' : '#94a3b8',
                    }}
                    onClick={() => onToggle(group.label, opt.value)}
                  >
                    <span className="truncate">{opt.value}</span>
                    <div className="flex items-center gap-1.5">
                      {opt.color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: opt.color }} />}
                      {opt.count !== undefined && <span className="text-[10px] opacity-60">{opt.count}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
