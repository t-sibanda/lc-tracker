import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  ArrowLeft, Pencil, Save, X, QrCode, TrendingUp,
  CheckCircle2, PlayCircle, Circle, Camera, HardHat, Wrench
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import CameraCapture from '@/components/CameraCapture';
import type { Task } from '@/types';

const statusColors: Record<string, string> = {
  'Complete': '#10b981', 'In Progress': '#f59e0b', 'Not Started': '#64748b',
};

const systems = ['Liquid Cooling', 'HVAC', 'PLC', 'SCADA'];

export default function ZoneDetail() {
  const { zoneName } = useParams<{ zoneName: string }>();
  const navigate = useNavigate();
  const { tasks, updateTask } = useApp();
  const [activeTab, setActiveTab] = useState<'pre-install' | 'commissioning'>('pre-install');
  const [activeSystem, setActiveSystem] = useState('Liquid Cooling');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<{ entityId: string; entityName: string } | null>(null);
  const [bulkPercent, setBulkPercent] = useState('');

  const decodedZone = decodeURIComponent(zoneName || '');

  // Pre-install tasks for this zone
  const preInstallTasks = useMemo(() =>
    tasks.filter(t => t.scope === 'pre-install' && t.zone === decodedZone && t.system === activeSystem),
    [tasks, decodedZone, activeSystem]
  );

  // Commissioning tasks (L3/L4/L5) for this zone
  const zoneTasks = useMemo(() =>
    tasks.filter(t => t.scope === 'zone' && t.zone === decodedZone && t.system === activeSystem),
    [tasks, decodedZone, activeSystem]
  );

  const currentTasks = activeTab === 'pre-install' ? preInstallTasks : zoneTasks;

  // Overall zone progress (all non-project tasks)
  const allZoneTasks = tasks.filter(t => (t.scope === 'zone' || t.scope === 'pre-install') && t.zone === decodedZone);
  const allPct = allZoneTasks.length > 0 ? Math.round(allZoneTasks.reduce((s, t) => s + t.percentComplete, 0) / allZoneTasks.length) : 0;

  // Pre-install progress
  const preInstallAll = tasks.filter(t => t.scope === 'pre-install' && t.zone === decodedZone);
  const preInstallPct = preInstallAll.length > 0 ? Math.round(preInstallAll.reduce((s, t) => s + t.percentComplete, 0) / preInstallAll.length) : 0;

  // Commissioning progress
  const commAll = tasks.filter(t => t.scope === 'zone' && t.zone === decodedZone);
  const commPct = commAll.length > 0 ? Math.round(commAll.reduce((s, t) => s + t.percentComplete, 0) / commAll.length) : 0;

  const systemStats = useMemo(() => {
    return systems.map(sys => {
      const scope = activeTab === 'pre-install' ? 'pre-install' : 'zone';
      const sysTasks = tasks.filter(t => t.scope === scope && t.zone === decodedZone && t.system === sys);
      const pct = sysTasks.length > 0 ? Math.round(sysTasks.reduce((s, t) => s + t.percentComplete, 0) / sysTasks.length) : 0;
      return { name: sys, count: sysTasks.length, percent: pct };
    });
  }, [tasks, decodedZone, activeTab]);

  function applyBulk() {
    const pct = Number(bulkPercent);
    if (isNaN(pct) || pct < 0 || pct > 100) return;
    currentTasks.forEach(t => {
      updateTask(t.id, {
        percentComplete: pct,
        status: pct === 100 ? 'Complete' : pct > 0 ? 'In Progress' : 'Not Started',
      });
    });
    setBulkPercent('');
  }

  function openCamera(taskId: string, taskName: string) {
    setCameraTarget({ entityId: taskId, entityName: taskName });
    setShowCamera(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/zones')} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeft size={14} style={{ color: '#94a3b8' }} />
        </button>
        <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>{decodedZone}</h1>
        <button onClick={() => setShowQR(!showQR)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors ml-2">
          <QrCode size={14} style={{ color: '#22d3ee' }} />
        </button>
        <span className="text-[10px] px-2 py-0.5 rounded-full ml-auto" style={{ background: allPct === 100 ? 'rgba(16,185,129,0.15)' : 'rgba(34,211,238,0.1)', color: allPct === 100 ? '#10b981' : '#22d3ee' }}>
          {allPct}% Complete
        </span>
      </div>

      {showQR && (
        <div className="card p-4 flex flex-col items-center">
          <QRCodeSVG value={`${window.location.origin}/#/zones/${encodeURIComponent(decodedZone)}`} size={150} bgColor="transparent" fgColor="#22d3ee" level="M" />
          <span className="text-[10px] mt-2" style={{ color: '#94a3b8' }}>Scan to open {decodedZone}</span>
        </div>
      )}

      {/* Overall Progress */}
      <div className="card p-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={13} style={{ color: '#22d3ee' }} />
          <span className="text-[11px] font-semibold" style={{ color: '#22d3ee' }}>Zone Progress</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(51,65,85,0.5)' }}>
          <div className="h-full rounded-full" style={{ width: `${allPct}%`, background: allPct === 100 ? '#10b981' : '#22d3ee' }} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex items-center justify-center gap-1">
              <HardHat size={11} style={{ color: '#f59e0b' }} />
              <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>{preInstallPct}%</span>
            </div>
            <span className="text-[9px]" style={{ color: '#94a3b8' }}>Pre-Install ({preInstallAll.length})</span>
          </div>
          <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
            <div className="flex items-center justify-center gap-1">
              <Wrench size={11} style={{ color: '#22d3ee' }} />
              <span className="text-sm font-bold" style={{ color: '#22d3ee' }}>{commPct}%</span>
            </div>
            <span className="text-[9px]" style={{ color: '#94a3b8' }}>Commissioning ({commAll.length})</span>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1">
        <button
          onClick={() => setActiveTab('pre-install')}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-medium transition-colors"
          style={{
            background: activeTab === 'pre-install' ? 'rgba(245,158,11,0.15)' : 'rgba(51,65,85,0.2)',
            color: activeTab === 'pre-install' ? '#f59e0b' : '#94a3b8',
            border: activeTab === 'pre-install' ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
          }}
        >
          <HardHat size={12} /> Pre-Install
        </button>
        <button
          onClick={() => setActiveTab('commissioning')}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-medium transition-colors"
          style={{
            background: activeTab === 'commissioning' ? 'rgba(34,211,238,0.15)' : 'rgba(51,65,85,0.2)',
            color: activeTab === 'commissioning' ? '#22d3ee' : '#94a3b8',
            border: activeTab === 'commissioning' ? '1px solid rgba(34,211,238,0.3)' : '1px solid transparent',
          }}
        >
          <Wrench size={12} /> Commissioning
        </button>
      </div>

      {/* System Tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {systems.map(sys => {
          const scope = activeTab === 'pre-install' ? 'pre-install' : 'zone';
          const count = tasks.filter(t => t.scope === scope && t.zone === decodedZone && t.system === sys).length;
          const pct = systemStats.find(s => s.name === sys)?.percent || 0;
          return (
            <button
              key={sys}
              onClick={() => setActiveSystem(sys)}
              className="px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors"
              style={{
                background: activeSystem === sys ? (activeTab === 'pre-install' ? 'rgba(245,158,11,0.15)' : 'rgba(34,211,238,0.15)') : 'rgba(51,65,85,0.2)',
                color: activeSystem === sys ? (activeTab === 'pre-install' ? '#f59e0b' : '#22d3ee') : '#94a3b8',
              }}
            >
              {sys} ({count}) {pct}%
            </button>
          );
        })}
      </div>

      {/* Bulk Update */}
      <div className="card p-3 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-medium" style={{ color: '#94a3b8' }}>Bulk Update {activeSystem}:</span>
        <input type="number" value={bulkPercent} onChange={e => setBulkPercent(e.target.value)} placeholder="%" className="input w-16 px-2 py-1 text-xs rounded" min={0} max={100} />
        <button onClick={applyBulk} className="px-3 py-1 rounded text-[10px] font-medium" style={{ background: activeTab === 'pre-install' ? 'rgba(245,158,11,0.15)' : 'rgba(34,211,238,0.15)', color: activeTab === 'pre-install' ? '#f59e0b' : '#22d3ee' }}>Apply to All</button>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {currentTasks.map(task => (
          <ZoneTaskRow
            key={task.id}
            task={task}
            isEditing={editingId === task.id}
            onEdit={() => setEditingId(editingId === task.id ? null : task.id)}
            onSave={(updates) => { updateTask(task.id, updates); setEditingId(null); }}
            onCamera={() => openCamera(task.id, task.description)}
            tabType={activeTab}
          />
        ))}
        {currentTasks.length === 0 && (
          <div className="card p-6 text-center text-[11px]" style={{ color: '#64748b' }}>
            No {activeTab === 'pre-install' ? 'pre-installation' : 'commissioning'} tasks for {activeSystem} in {decodedZone}
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && cameraTarget && (
        <CameraCapture
          onClose={() => setShowCamera(false)}
          entityType="task"
          entityId={cameraTarget.entityId}
          entityName={cameraTarget.entityName}
          zone={decodedZone}
        />
      )}
    </div>
  );
}

function ZoneTaskRow({ task, isEditing, onEdit, onSave, onCamera, tabType }: {
  task: Task; isEditing: boolean; onEdit: () => void;
  onSave: (u: Partial<Task>) => void; onCamera: () => void;
  tabType: 'pre-install' | 'commissioning';
}) {
  const [form, setForm] = useState({ percentComplete: task.percentComplete, status: task.status, notes: task.notes });

  const statusIcon = task.status === 'Complete' ? <CheckCircle2 size={12} style={{ color: '#10b981' }} /> :
    task.status === 'In Progress' ? <PlayCircle size={12} style={{ color: '#f59e0b' }} /> :
    <Circle size={12} style={{ color: '#64748b' }} />;

  const accentColor = tabType === 'pre-install' ? '#f59e0b' : '#22d3ee';

  return (
    <div className="card p-3">
      <div className="flex items-center gap-2">
        {statusIcon}
        <span className="text-[11px] flex-1" style={{ color: '#e2e8f0' }}>{task.description}</span>
        <span className="text-[10px] w-8 text-right" style={{ color: statusColors[task.status] }}>{task.percentComplete}%</span>
        <button onClick={onCamera} className="p-1 rounded hover:bg-white/5 transition-colors" title="Capture evidence">
          <Camera size={11} style={{ color: '#64748b' }} />
        </button>
        <button onClick={onEdit} className="p-1 rounded hover:bg-white/5"><Pencil size={11} style={{ color: '#64748b' }} /></button>
      </div>
      <div className="h-1 rounded-full overflow-hidden mt-1.5" style={{ background: 'rgba(51,65,85,0.5)' }}>
        <div className="h-full rounded-full" style={{ width: `${task.percentComplete}%`, background: statusColors[task.status] }} />
      </div>

      {isEditing && (
        <div className="mt-2 pt-2 space-y-2" style={{ borderTop: '1px solid rgba(51,65,85,0.3)' }}>
          <div className="flex items-center gap-2">
            <input type="range" min={0} max={100} value={form.percentComplete} onChange={e => { const pct = Number(e.target.value); setForm({ ...form, percentComplete: pct, status: pct === 100 ? 'Complete' : pct > 0 ? 'In Progress' : 'Not Started' }); }} className="flex-1" />
            <span className="text-[11px] w-8" style={{ color: accentColor }}>{form.percentComplete}%</span>
          </div>
          <select className="input w-full px-2 py-1 text-xs rounded" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Task['status'] })}>
            {['Not Started', 'In Progress', 'Complete'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <textarea className="input w-full px-2 py-1 text-xs rounded" placeholder="Notes" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={() => onSave(form)} className="flex items-center gap-1 px-3 py-1 rounded text-[10px] font-medium" style={{ background: accentColor, color: '#0f172a' }}><Save size={10} /> Save</button>
            <button onClick={onEdit} className="px-3 py-1 rounded text-[10px]" style={{ color: '#64748b' }}><X size={10} /> Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
