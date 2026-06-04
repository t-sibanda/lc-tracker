import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { FolderOpen, Plus, Trash2, ArrowRight, X } from 'lucide-react';

export default function ProjectsPage() {
  const { projects, currentProjectId, switchProject, createProject, deleteProject } = useApp();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', number: '', description: '', client: '', cxManager: '' });

  function handleCreate() {
    if (!form.name.trim()) return;
    const id = createProject(form);
    setForm({ name: '', number: '', description: '', client: '', cxManager: '' });
    setShowCreate(false);
    switchProject(id);
    navigate('/');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FolderOpen size={16} style={{ color: '#22d3ee' }} />
          <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Projects</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>{projects.length}</span>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
          <Plus size={12} /> New Project
        </button>
      </div>

      {showCreate && (
        <div className="card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: '#22d3ee' }}>Create New Project</span>
            <button onClick={() => setShowCreate(false)}><X size={14} style={{ color: '#64748b' }} /></button>
          </div>
          <input className="input w-full px-2 py-1 text-xs rounded" placeholder="Project name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className="input px-2 py-1 text-xs rounded" placeholder="Project number" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} />
            <input className="input px-2 py-1 text-xs rounded" placeholder="Client" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} />
          </div>
          <input className="input w-full px-2 py-1 text-xs rounded" placeholder="Cx Manager" value={form.cxManager} onChange={e => setForm({ ...form, cxManager: e.target.value })} />
          <textarea className="input w-full px-2 py-1 text-xs rounded" placeholder="Description" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <button onClick={handleCreate} className="px-4 py-1.5 rounded text-[10px] font-medium" style={{ background: '#22d3ee', color: '#0f172a' }}>Create Project</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.map(p => {
          const isActive = p.id === currentProjectId;
          return (
            <button
              key={p.id}
              onClick={() => { switchProject(p.id); navigate('/'); }}
              className="card p-4 text-left transition-all hover:scale-[1.01] hover:shadow-lg group relative"
              style={{
                border: isActive ? '1px solid rgba(34,211,238,0.4)' : '1px solid rgba(51,65,85,0.5)',
                background: isActive ? 'rgba(34,211,238,0.05)' : '#0f172a',
              }}
            >
              {isActive && (
                <div className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
                  Active
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: isActive ? 'rgba(34,211,238,0.15)' : 'rgba(51,65,85,0.3)' }}>
                  <FolderOpen size={14} style={{ color: isActive ? '#22d3ee' : '#94a3b8' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold truncate" style={{ color: '#e2e8f0' }}>{p.name}</h3>
                  {p.number && <span className="text-[10px]" style={{ color: '#64748b' }}>{p.number}</span>}
                </div>
              </div>
              {p.description && <p className="text-[10px] mb-2 truncate" style={{ color: '#94a3b8' }}>{p.description}</p>}
              <div className="flex items-center gap-2 text-[9px] flex-wrap">
                {p.client && <span style={{ color: '#64748b' }}>Client: {p.client}</span>}
                {p.cxManager && <span style={{ color: '#64748b' }}>CxM: {p.cxManager}</span>}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid rgba(51,65,85,0.3)' }}>
                <span className="text-[9px]" style={{ color: '#475569' }}>{p.taskCount} seeded tasks</span>
                <div className="flex gap-1">
                  {!isActive && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                      className="p-1 rounded hover:bg-red-500/10 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 size={10} style={{ color: '#ef4444' }} />
                    </button>
                  )}
                  <div className="p-1 rounded" style={{ color: isActive ? '#22d3ee' : '#64748b' }}>
                    <ArrowRight size={10} />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
