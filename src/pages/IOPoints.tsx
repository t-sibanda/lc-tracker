import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Cpu, Check, X, Search, Trash2, Download, Pencil, Upload, ChevronDown, ChevronRight, ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TestStep } from '@/types';

const ioColors: Record<string, string> = { AI: '#22d3ee', AO: '#a855f7', DI: '#f59e0b', DO: '#10b981' };

export default function IOPoints() {
  const { ioPoints } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<'AI' | 'DI' | 'DO'>('AI');
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return ioPoints.filter(p => {
      if (p.ioType !== activeType) return false;
      if (search && !p.description.toLowerCase().includes(search.toLowerCase()) && !p.ioAddress.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [ioPoints, activeType, search]);

  const stats = useMemo(() => {
    const t = ioPoints.filter(p => p.ioType === activeType);
    const total = t.length;
    const installed = t.filter(p => p.deviceInstalled).length;
    const wired = t.filter(p => p.wiringTagged).length;
    const powered = t.filter(p => p.devicePowered).length;
    const verified = t.filter(p => p.signalVerified).length;
    const passed = t.filter(p => p.passFail === 'Pass').length;
    const failed = t.filter(p => p.passFail === 'Fail').length;
    // Test step completion stats
    const totalSteps = t.reduce((sum, p) => sum + (p.testSteps?.length || 0), 0);
    const completedSteps = t.reduce((sum, p) => sum + (p.testSteps?.filter(s => s.verified).length || 0), 0);
    return { total, installed, wired, powered, verified, passed, failed, totalSteps, completedSteps };
  }, [ioPoints, activeType]);

  function exportIOReport() {
    const rows = filtered.map(p => {
      const stepsCompleted = p.testSteps?.filter(s => s.verified).length || 0;
      const totalSteps = p.testSteps?.length || 0;
      return {
        'Panel': p.panel, 'Description': p.description, 'I/O Type': p.ioType,
        'Signal': p.signal, 'PLC': p.plc, 'Module': p.ioModule,
        'Address': p.ioAddress, 'Range': `${p.engMin}-${p.engMax}`, 'Units': p.units,
        'Installed': p.deviceInstalled ? 'Y' : '', 'Wired': p.wiringTagged ? 'Y' : '',
        'Powered': p.devicePowered ? 'Y' : '', 'Signal Verified': p.signalVerified ? 'Y' : '',
        'Pass/Fail': p.passFail, 'Test Steps': `${stepsCompleted}/${totalSteps}`,
        'Notes': p.notes,
      };
    });

    const csv = [Object.keys(rows[0]).join(','), ...rows.map(r => Object.values(r).map(v => String(v).includes(',') ? `"${v}"` : v).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `IO_${activeType}_Verification_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  const pct = (n: number) => stats.total > 0 ? Math.round((n / stats.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Cpu size={16} style={{ color: '#22d3ee' }} />
          <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>I/O Points</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>{ioPoints.length}</span>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => navigate('/io-import')} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
            <Upload size={12} /> Import
          </button>
          <button onClick={exportIOReport} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {[
          { label: 'Total', value: stats.total, color: '#94a3b8' },
          { label: 'Installed', value: `${pct(stats.installed)}%`, color: '#22d3ee' },
          { label: 'Wired', value: `${pct(stats.wired)}%`, color: '#f59e0b' },
          { label: 'Powered', value: `${pct(stats.powered)}%`, color: '#10b981' },
          { label: 'Signal', value: `${pct(stats.verified)}%`, color: '#a855f7' },
          { label: 'Test Done', value: stats.totalSteps > 0 ? `${Math.round((stats.completedSteps / stats.totalSteps) * 100)}%` : '0%', color: '#06b6d4' },
          { label: 'Pass', value: `${pct(stats.passed)}%`, color: '#10b981' },
          { label: 'Fail', value: `${pct(stats.failed)}%`, color: '#ef4444' },
        ].map(k => (
          <div key={k.label} className="card p-2 text-center">
            <div className="text-lg font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-[9px]" style={{ color: '#94a3b8' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* I/O Type Tabs */}
      <div className="flex gap-1">
        {(['AI', 'DI', 'DO'] as const).map(type => {
          const count = ioPoints.filter(p => p.ioType === type).length;
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-medium transition-colors"
              style={{
                background: activeType === type ? `${ioColors[type]}20` : 'rgba(51,65,85,0.2)',
                color: activeType === type ? ioColors[type] : '#94a3b8',
                border: activeType === type ? `1px solid ${ioColors[type]}40` : '1px solid transparent',
              }}
            >
              <Cpu size={12} /> {type} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${activeType} points...`} className="input w-full pl-8 pr-3 py-2 text-xs rounded-lg" />
      </div>

      {/* I/O Point List */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {filtered.map(point => (
          <IOPointCard key={point.id} point={point} isEditing={editingId === point.id} onEdit={() => setEditingId(editingId === point.id ? null : point.id)} />
        ))}
        {filtered.length === 0 && (
          <div className="card p-6 text-center text-[11px]" style={{ color: '#64748b' }}>
            No {activeType} points. <button onClick={() => navigate('/io-import')} className="underline" style={{ color: '#22d3ee' }}>Import from spreadsheet</button>
          </div>
        )}
      </div>
    </div>
  );
}

function IOPointCard({ point, isEditing, onEdit }: {
  point: import('@/types').IOPoint; isEditing: boolean; onEdit: () => void;
}) {
  const { updateIO, deleteIO } = useApp();
  const color = ioColors[point.ioType] || '#94a3b8';
  const [showTest, setShowTest] = useState(false);

  const testSteps = point.testSteps || [];
  const completedSteps = testSteps.filter(s => s.verified).length;
  const totalSteps = testSteps.length;

  const toggleField = (field: 'deviceInstalled' | 'wiringTagged' | 'devicePowered' | 'signalVerified') => {
    updateIO(point.id, { [field]: !point[field], updatedAt: new Date().toISOString() });
  };

  const setPassFail = (val: 'Pass' | 'Fail' | 'Pending') => {
    updateIO(point.id, { passFail: val, updatedAt: new Date().toISOString() });
  };

  const toggleTestStep = (stepId: string) => {
    const updatedSteps = testSteps.map(s =>
      s.id === stepId ? { ...s, verified: !s.verified } : s
    );
    updateIO(point.id, { testSteps: updatedSteps, updatedAt: new Date().toISOString() });
  };

  const updateStepReading = (stepId: string, reading: string) => {
    const updatedSteps = testSteps.map(s =>
      s.id === stepId ? { ...s, actualReading: reading } : s
    );
    updateIO(point.id, { testSteps: updatedSteps, updatedAt: new Date().toISOString() });
  };

  const updateStepNotes = (stepId: string, notes: string) => {
    const updatedSteps = testSteps.map(s =>
      s.id === stepId ? { ...s, notes } : s
    );
    updateIO(point.id, { testSteps: updatedSteps, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="card p-3">
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: `${color}20`, color }}>
          {point.ioType}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium truncate" style={{ color: '#e2e8f0' }}>{point.description}</span>
            <div className="flex gap-1 shrink-0">
              <button onClick={onEdit} className="p-1 rounded hover:bg-white/5"><Pencil size={10} style={{ color: '#64748b' }} /></button>
              <button onClick={() => deleteIO(point.id)} className="p-1 rounded hover:bg-white/5"><Trash2 size={10} style={{ color: '#ef4444' }} /></button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[9px]" style={{ color: '#64748b' }}>
            <span>{point.ioAddress}</span>
            <span>{point.signal} {point.signalType}</span>
            <span>{point.engMin}-{point.engMax} {point.units}</span>
          </div>

          {/* Verification Toggles */}
          <div className="grid grid-cols-5 gap-1.5 mt-2">
            {([
              { key: 'deviceInstalled' as const, label: 'Installed' },
              { key: 'wiringTagged' as const, label: 'Wired' },
              { key: 'devicePowered' as const, label: 'Powered' },
              { key: 'signalVerified' as const, label: 'Signal' },
            ]).map(({ key, label }) => {
              const isChecked = point[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleField(key)}
                  className="flex items-center justify-center gap-1 py-1 rounded text-[9px] font-medium transition-colors"
                  style={{
                    background: isChecked ? 'rgba(16,185,129,0.15)' : 'rgba(51,65,85,0.3)',
                    color: isChecked ? '#10b981' : '#64748b',
                    border: isChecked ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
                  }}
                >
                  {isChecked ? <Check size={9} /> : <X size={9} />} {label}
                </button>
              );
            })}
          </div>

          {/* Pass/Fail + Test Procedure Toggle */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex gap-1">
              {(['Pass', 'Fail', 'Pending'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setPassFail(v)}
                  className="px-2 py-0.5 rounded text-[9px] font-medium transition-colors"
                  style={{
                    background: point.passFail === v ? (v === 'Pass' ? 'rgba(16,185,129,0.15)' : v === 'Fail' ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.15)') : 'rgba(51,65,85,0.2)',
                    color: point.passFail === v ? (v === 'Pass' ? '#10b981' : v === 'Fail' ? '#ef4444' : '#94a3b8') : '#475569',
                    border: point.passFail === v ? `1px solid ${v === 'Pass' ? '#10b98130' : v === 'Fail' ? '#ef444430' : '#94a3b830'}` : '1px solid transparent',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <button
              onClick={() => setShowTest(!showTest)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium transition-colors"
              style={{
                background: showTest ? `${color}15` : 'rgba(51,65,85,0.2)',
                color: showTest ? color : '#64748b',
                border: showTest ? `1px solid ${color}30` : '1px solid transparent',
              }}
            >
              <ClipboardCheck size={9} />
              Test {completedSteps}/{totalSteps}
              {showTest ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
            </button>
          </div>

          {point.notes && <p className="text-[10px] mt-1" style={{ color: '#94a3b8' }}>{point.notes}</p>}

          {/* Test Procedure Checklist */}
          {showTest && (
            <div className="mt-2 pt-2 space-y-1" style={{ borderTop: '1px solid rgba(51,65,85,0.3)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium" style={{ color: color }}>Test Procedure Checklist</span>
                <div className="w-20 h-1.5 rounded-full" style={{ background: 'rgba(51,65,85,0.3)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0}%`, background: color }}
                  />
                </div>
              </div>

              {testSteps.length === 0 && (
                <p className="text-[10px] py-2" style={{ color: '#64748b' }}>No test steps defined for this point.</p>
              )}

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {testSteps.map((step, idx) => (
                  <TestStepRow
                    key={step.id}
                    step={step}
                    index={idx + 1}
                    color={color}
                    onToggle={() => toggleTestStep(step.id)}
                    onReadingChange={(val) => updateStepReading(step.id, val)}
                    onNotesChange={(val) => updateStepNotes(step.id, val)}
                  />
                ))}
              </div>
            </div>
          )}

          {isEditing && (
            <div className="mt-2 pt-2 space-y-1" style={{ borderTop: '1px solid rgba(51,65,85,0.3)' }}>
              <input className="input w-full px-2 py-1 text-[10px] rounded" defaultValue={point.notes} placeholder="Notes" onBlur={e => updateIO(point.id, { notes: e.target.value })} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TestStepRow({ step, index, color, onToggle, onReadingChange, onNotesChange }: {
  step: TestStep; index: number; color: string;
  onToggle: () => void; onReadingChange: (val: string) => void; onNotesChange: (val: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded p-1.5 transition-colors"
      style={{
        background: step.verified ? `${color}08` : 'rgba(51,65,85,0.15)',
        border: `1px solid ${step.verified ? `${color}25` : 'rgba(51,65,85,0.2)'}`,
      }}
    >
      <div className="flex items-start gap-1.5">
        <button
          onClick={onToggle}
          className="mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-colors"
          style={{
            background: step.verified ? `${color}30` : 'rgba(51,65,85,0.4)',
            border: `1px solid ${step.verified ? color : 'rgba(100,116,139,0.3)'}`,
          }}
        >
          {step.verified && <Check size={8} style={{ color }} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[8px] px-1 rounded shrink-0" style={{ background: 'rgba(51,65,85,0.3)', color: '#64748b' }}>{index}</span>
            <button onClick={() => setExpanded(!expanded)} className="text-left flex-1">
              <span className="text-[10px]" style={{ color: step.verified ? '#94a3b8' : '#e2e8f0' }}>{step.action}</span>
            </button>
          </div>

          {expanded && (
            <div className="mt-1 space-y-1 pl-4">
              <div className="text-[9px]" style={{ color: '#64748b' }}>
                <span style={{ color: '#22d3ee' }}>Expected: </span>{step.expectedResult}
              </div>
              <input
                className="input w-full px-2 py-1 text-[9px] rounded"
                placeholder="Actual reading / meter value..."
                value={step.actualReading}
                onChange={e => onReadingChange(e.target.value)}
              />
              <input
                className="input w-full px-2 py-1 text-[9px] rounded"
                placeholder="Step notes..."
                value={step.notes}
                onChange={e => onNotesChange(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
