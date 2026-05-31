import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Wrench, AlertTriangle, ClipboardCheck, Zap } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { tasks, equipment, issues, checklists } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const items: { label: string; sub: string; type: string; icon: React.ReactNode; link: string }[] = [];

    tasks.filter(t => t.scope === 'project').forEach(t => {
      if (t.description.toLowerCase().includes(q) || t.owner.toLowerCase().includes(q)) {
        items.push({ label: t.description, sub: `${t.phase} · ${t.owner} · ${t.status}`, type: 'task', icon: <Wrench size={12} />, link: '/tasks' });
      }
    });

    equipment.forEach(e => {
      if (e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q) || e.zone.toLowerCase().includes(q)) {
        items.push({ label: e.name, sub: `${e.type} · ${e.zone} · ${e.status}`, type: 'equipment', icon: <Zap size={12} />, link: '/equipment' });
      }
    });

    issues.forEach(i => {
      if (i.title.toLowerCase().includes(q) || i.zone.toLowerCase().includes(q)) {
        items.push({ label: i.title, sub: `${i.priority} · ${i.status} · ${i.zone}`, type: 'issue', icon: <AlertTriangle size={12} />, link: '/issues' });
      }
    });

    checklists.forEach(c => {
      if (c.title.toLowerCase().includes(q)) {
        items.push({ label: c.title, sub: `${c.type} · ${c.status}`, type: 'checklist', icon: <ClipboardCheck size={12} />, link: '/checklists' });
      }
    });

    return items.slice(0, 10);
  }, [query, tasks, equipment, issues, checklists]);

  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md transition-colors hover:bg-white/5" style={{ color: '#64748b' }}>
      <Search size={12} /> Search <span className="hidden sm:inline opacity-50">(Ctrl+K)</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg mx-4 rounded-xl overflow-hidden shadow-2xl" style={{ background: '#0f172a', border: '1px solid rgba(34,211,238,0.2)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
          <Search size={14} style={{ color: '#64748b' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks, equipment, issues, checklists..."
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-slate-600"
            style={{ color: '#e2e8f0' }}
          />
          <button onClick={() => setOpen(false)} className="hover:text-cyan-400 transition-colors" style={{ color: '#64748b' }}><X size={14} /></button>
        </div>
        {results.length > 0 && (
          <div className="max-h-72 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={i}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors hover:bg-white/5"
                style={{ borderBottom: '1px solid rgba(51,65,85,0.3)' }}
                onClick={() => { setOpen(false); navigate(r.link); }}
              >
                <span style={{ color: '#22d3ee' }}>{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate" style={{ color: '#e2e8f0' }}>{r.label}</div>
                  <div className="text-[10px] truncate" style={{ color: '#64748b' }}>{r.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        {query && results.length === 0 && (
          <div className="px-3 py-4 text-center text-xs" style={{ color: '#64748b' }}>No results found</div>
        )}
      </div>
    </div>
  );
}
