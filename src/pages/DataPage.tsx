import { useState, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Database, Upload, Download, Trash2, AlertTriangle, FileText,
  Check, Lock, History, Globe, Laptop
} from 'lucide-react';
import * as XLSX from 'xlsx';

const PIN = '1234';

export default function DataPage() {
  const {
    tasks, equipment, issues, checklists, photos, project, revisions,
    cloudConnected, syncing, localOnly, setLocalOnly,
    syncToCloud, syncFromCloud, resetAllData, importData,
    takeSnapshot, restoreSnapshot, deleteSnapshot,
  } = useApp();

  const [authOpen, setAuthOpen] = useState<'reset' | 'upload' | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState<'reports' | 'sync' | 'revisions' | 'import'>('reports');
  const [importMode, setImportMode] = useState<'update' | 'new'>('update');
  const [importResult, setImportResult] = useState<{ matched: number; unmatched: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function checkPin() {
    if (pinInput === PIN) {
      setPinError('');
      setPinInput('');
      if (authOpen === 'reset') { setAuthOpen(null); resetAllData(); }
      if (authOpen === 'upload') { setAuthOpen(null); syncToCloud(); }
    } else {
      setPinError('Invalid PIN');
    }
  }

  const exportJSON = useCallback(() => {
    const data = { tasks, equipment, issues, checklists, photos, project, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lc-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tasks, equipment, issues, checklists, photos, project]);

  const exportCSV = useCallback((type: string) => {
    let data: Array<Record<string, unknown>> = [];
    if (type === 'tasks') data = tasks.map(t => ({ ...t } as Record<string, unknown>));
    else if (type === 'equipment') data = equipment.map(e => ({ ...e } as Record<string, unknown>));
    else if (type === 'issues') data = issues.map(i => ({ ...i } as Record<string, unknown>));
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => {
      const val = row[h];
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : String(val ?? '');
    }).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tasks, equipment, issues]);

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = new Uint8Array(reader.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

      if (importMode === 'new') {
        // Import as new tasks
        const newTasks: typeof tasks = [];
        rows.forEach(row => {
          const desc = String(row['Task'] || row['Description'] || '');
          if (!desc) return;
          const pct = Number(row['% Complete'] || row['percentComplete'] || row['percent'] || 0);
          const normalizedPct = pct <= 1 ? Math.round(pct * 100) : pct;
          // Check for duplicates
          if (tasks.find(t => t.description.toLowerCase() === desc.toLowerCase())) return;
          newTasks.push({
            id: `imported-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            description: desc,
            phase: String(row['Phase'] || 'Development'),
            zone: String(row['Zone'] || 'All'),
            system: String(row['System'] || 'Project'),
            discipline: String(row['Discipline'] || 'Controls'),
            scope: (String(row['Scope'] || 'project').toLowerCase() === 'zone' ? 'zone' : 'project') as Task['scope'],
            owner: String(row['Owner'] || row['Primary Owner'] || ''),
            support: String(row['Support'] || row['Secondary Owner'] || ''),
            predecessors: String(row['Predecessors'] || row['Prerequisite'] || ''),
            deliverable: String(row['Deliverable'] || ''),
            notes: String(row['Notes'] || ''),
            percentComplete: normalizedPct,
            status: (normalizedPct === 100 ? 'Complete' : normalizedPct > 0 ? 'In Progress' : 'Not Started') as Task['status'],
            startDate: String(row['Start Date'] || ''),
            endDate: String(row['End Date'] || row['Need by Date'] || ''),
            comments: [],
            updatedAt: new Date().toISOString(),
          });
        });
        importData({ tasks: [...tasks, ...newTasks] });
        setImportResult({ matched: newTasks.length, unmatched: 0 });
      } else {
        // Update existing tasks by matching description
        let matched = 0;
        let unmatched = 0;
        const updatedTasks = tasks.map(t => {
          const row = rows.find(r => {
            const desc = String(r['Task'] || r['Description'] || '');
            return desc.toLowerCase() === t.description.toLowerCase() ||
              desc.toLowerCase().includes(t.description.toLowerCase()) ||
              t.description.toLowerCase().includes(desc.toLowerCase());
          });
          if (row) {
            matched++;
            const pct = Number(row['% Complete'] || row['percentComplete'] || row['percent'] || t.percentComplete);
            const normalizedPct = pct <= 1 ? Math.round(pct * 100) : pct;
            return {
              ...t,
              percentComplete: normalizedPct,
              status: (normalizedPct === 100 ? 'Complete' : normalizedPct > 0 ? 'In Progress' : 'Not Started') as Task['status'],
              owner: String(row['Owner'] || row['Primary Owner'] || t.owner),
              updatedAt: new Date().toISOString(),
            };
          } else {
            unmatched++;
            return t;
          }
        });
        importData({ tasks: updatedTasks });
        setImportResult({ matched, unmatched });
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  function generateStatusReport(): string {
    const lines = [
      `LIQUID COOLING COMMISSIONING TRACKER - STATUS REPORT`,
      `Project: ${project.name}`,
      `Date: ${new Date().toLocaleString()}`,
      ``,
      `PROJECT OVERVIEW`,
      `  Total Tasks: ${tasks.length}`,
      `  Project Tasks: ${tasks.filter(t => t.scope === 'project').length}`,
      `  Zone Tests: ${tasks.filter(t => t.scope === 'zone').length}`,
      `  Equipment: ${equipment.length}`,
      `  Issues: ${issues.length} (${issues.filter(i => i.status !== 'Closed-Cx Verified').length} open)`,
      `  Checklists: ${checklists.length}`,
      ``,
      `PHASE PROGRESS`,
      ...['Kickoff', 'Requirements', 'Design', 'Development', 'Test', 'Closeout'].map(p => {
        const pt = tasks.filter(t => t.scope === 'project' && t.phase === p);
        const pct = pt.length > 0 ? Math.round(pt.reduce((s, t) => s + t.percentComplete, 0) / pt.length) : 0;
        return `  ${p}: ${pct}% (${pt.filter(t => t.status === 'Complete').length}/${pt.length})`;
      }),
      ``,
      `ZONE PROGRESS`,
      ...[...new Set(tasks.filter(t => t.scope === 'zone').map(t => t.zone))].map(z => {
        const zt = tasks.filter(t => t.scope === 'zone' && t.zone === z);
        const pct = zt.length > 0 ? Math.round(zt.reduce((s, t) => s + t.percentComplete, 0) / zt.length) : 0;
        return `  ${z}: ${pct}%`;
      }),
      ``,
      `EQUIPMENT STATUS`,
      ...['Not Commissioned', 'L1 - Documentation', 'L2 - Factory Witness', 'L3 - Startup', 'L4 - Functional', 'L5 - Integrated'].map(s => {
        const count = equipment.filter(e => e.status === s).length;
        return `  ${s}: ${count}`;
      }),
      ``,
      `OPEN ISSUES`,
      ...issues.filter(i => i.status !== 'Closed-Cx Verified').map(i => `  [${i.priority}] ${i.title} (${i.status}) - ${i.responsibleParty || 'Unassigned'}`),
      ``,
      `--- END OF REPORT ---`,
    ];
    return lines.join('\n');
  }

  function downloadReport() {
    const report = generateStatusReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `status-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const summary = [
    { label: 'Tasks', value: tasks.length },
    { label: 'Equipment', value: equipment.length },
    { label: 'Issues', value: issues.length },
    { label: 'Checklists', value: checklists.length },
    { label: 'Photos', value: photos.length },
    { label: 'Revisions', value: revisions.length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Database size={16} style={{ color: '#22d3ee' }} />
        <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Data Management</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {summary.map(s => (
          <div key={s.label} className="card p-2 text-center">
            <div className="text-lg font-bold" style={{ color: '#22d3ee' }}>{s.value}</div>
            <div className="text-[9px]" style={{ color: '#94a3b8' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {([['reports', 'Reports'], ['sync', 'Cloud Sync'], ['revisions', 'Revisions'], ['import', 'Excel Import']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors"
            style={{
              background: activeTab === tab ? 'rgba(34,211,238,0.15)' : 'rgba(51,65,85,0.2)',
              color: activeTab === tab ? '#22d3ee' : '#94a3b8',
            }}
          >{label}</button>
        ))}
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="card p-4 space-y-3">
          <h3 className="text-xs font-bold" style={{ color: '#22d3ee' }}>Export Reports</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <ExportBtn icon={<FileText size={12} />} label="Status Report" onClick={downloadReport} />
            <ExportBtn icon={<Database size={12} />} label="Tasks CSV" onClick={() => exportCSV('tasks')} />
            <ExportBtn icon={<Database size={12} />} label="Equipment CSV" onClick={() => exportCSV('equipment')} />
            <ExportBtn icon={<Database size={12} />} label="Issues CSV" onClick={() => exportCSV('issues')} />
          </div>
          <button onClick={exportJSON} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-medium" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>
            <Download size={12} /> Full Backup (JSON)
          </button>
        </div>
      )}

      {/* Sync Tab */}
      {activeTab === 'sync' && (
        <div className="space-y-3">
          {/* Local Only Toggle */}
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {localOnly ? <Laptop size={14} style={{ color: '#f59e0b' }} /> : <Globe size={14} style={{ color: '#22d3ee' }} />}
                <div>
                  <div className="text-xs font-medium" style={{ color: '#e2e8f0' }}>{localOnly ? 'Local-Only Mode' : 'Cloud Sync Enabled'}</div>
                  <div className="text-[10px]" style={{ color: '#64748b' }}>{localOnly ? 'Changes stay on this device only' : 'Changes sync to Supabase automatically'}</div>
                </div>
              </div>
              <button
                onClick={() => setLocalOnly(!localOnly)}
                className="relative w-10 h-5 rounded-full transition-colors"
                style={{ background: localOnly ? '#f59e0b' : '#22d3ee' }}
              >
                <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ left: localOnly ? '20px' : '2px', background: '#fff' }} />
              </button>
            </div>
          </div>

          {/* Sync buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { setAuthOpen('upload'); setPinInput(''); setPinError(''); }} disabled={!cloudConnected || localOnly || syncing} className="card p-3 flex flex-col items-center gap-1 disabled:opacity-40">
              <Upload size={16} style={{ color: '#22d3ee' }} />
              <span className="text-[11px] font-medium" style={{ color: '#e2e8f0' }}>Upload to Cloud</span>
              <span className="text-[9px]" style={{ color: '#64748b' }}>{syncing ? 'Syncing...' : cloudConnected ? 'Push data to Supabase' : 'Not connected'}</span>
            </button>
            <button onClick={syncFromCloud} disabled={!cloudConnected || syncing} className="card p-3 flex flex-col items-center gap-1 disabled:opacity-40">
              <Download size={16} style={{ color: '#22d3ee' }} />
              <span className="text-[11px] font-medium" style={{ color: '#e2e8f0' }}>Download from Cloud</span>
              <span className="text-[9px]" style={{ color: '#64748b' }}>Pull latest data</span>
            </button>
          </div>

          {/* Danger Zone */}
          <div className="card p-3" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={12} style={{ color: '#ef4444' }} />
              <span className="text-[11px] font-bold" style={{ color: '#ef4444' }}>Danger Zone</span>
            </div>
            <button onClick={() => { setAuthOpen('reset'); setPinInput(''); setPinError(''); }} className="text-[10px] px-3 py-1.5 rounded border transition-colors hover:bg-red-500/10" style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>
              Reset All Data
            </button>
          </div>
        </div>
      )}

      {/* Revisions Tab */}
      {activeTab === 'revisions' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: '#22d3ee' }}>Saved Revisions</span>
            <button onClick={() => takeSnapshot('Manual')} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
              <History size={10} /> Save Now
            </button>
          </div>
          {revisions.length === 0 && <div className="card p-4 text-center text-[11px]" style={{ color: '#64748b' }}>No saved revisions yet. Snapshots are taken automatically every hour.</div>}
          {revisions.map(rev => (
            <div key={rev.id} className="card p-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium" style={{ color: '#e2e8f0' }}>{rev.label}</div>
                <div className="text-[10px]" style={{ color: '#64748b' }}>{new Date(rev.timestamp).toLocaleString()} · {rev.tasks.length} tasks · {rev.equipment.length} equipment</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { if (confirm('Restore this revision? Current data will be overwritten.')) restoreSnapshot(rev.id); }} className="px-2 py-1 rounded text-[10px]" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>Restore</button>
                <button onClick={() => deleteSnapshot(rev.id)} className="px-2 py-1 rounded text-[10px]" style={{ color: '#ef4444' }}><Trash2 size={10} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="card p-4 space-y-3">
          <h3 className="text-xs font-bold" style={{ color: '#22d3ee' }}>Excel Import / Update</h3>
          <div className="flex gap-2">
            <button onClick={() => { setImportMode('update'); setImportResult(null); }} className="px-3 py-1.5 rounded text-[11px] font-medium transition-colors" style={{ background: importMode === 'update' ? 'rgba(34,211,238,0.2)' : 'rgba(51,65,85,0.3)', color: importMode === 'update' ? '#22d3ee' : '#94a3b8' }}>Update Existing Tasks</button>
            <button onClick={() => { setImportMode('new'); setImportResult(null); }} className="px-3 py-1.5 rounded text-[11px] font-medium transition-colors" style={{ background: importMode === 'new' ? 'rgba(16,185,129,0.2)' : 'rgba(51,65,85,0.3)', color: importMode === 'new' ? '#10b981' : '#94a3b8' }}>Import as New</button>
          </div>
          <p className="text-[10px]" style={{ color: '#94a3b8' }}>
            {importMode === 'update'
              ? 'Upload an Excel file with Task and % Complete columns. Matching tasks will be updated.'
              : 'Upload an Excel file to create new tasks. Duplicates (by description) will be skipped.'}
          </p>
          <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" onChange={handleFileImport} className="text-[11px]" style={{ color: '#94a3b8' }} />
          {importResult && (
            <div className="p-2 rounded" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <div className="flex items-center gap-1 text-[11px]" style={{ color: '#10b981' }}>
                <Check size={12} /> {importMode === 'update' ? `Updated ${importResult.matched} tasks` : `Imported ${importResult.matched} tasks`}
              </div>
              {importResult.unmatched > 0 && (
                <div className="text-[10px] mt-0.5" style={{ color: '#f59e0b' }}>{importResult.unmatched} rows had no match</div>
              )}
            </div>
          )}
          <div className="p-2 rounded text-[10px] space-y-0.5" style={{ background: 'rgba(51,65,85,0.3)', color: '#64748b' }}>
            <p><strong>Required columns:</strong> Task (or Description), % Complete (or percentComplete)</p>
            <p><strong>Optional:</strong> Phase, Zone, System, Owner, Status, Start Date, End Date, Notes</p>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {authOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm mx-4 rounded-xl p-4 space-y-3" style={{ background: '#0f172a', border: '1px solid rgba(34,211,238,0.2)' }}>
            <div className="flex items-center gap-2">
              <Lock size={14} style={{ color: '#f59e0b' }} />
              <span className="text-xs font-bold" style={{ color: '#e2e8f0' }}>Authentication Required</span>
            </div>
            <p className="text-[11px]" style={{ color: '#94a3b8' }}>
              {authOpen === 'reset' ? 'Enter PIN to reset all data.' : 'Enter PIN to upload to cloud.'}
            </p>
            <input
              type="password"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="PIN"
              className="input w-full px-3 py-2 text-xs rounded-lg"
              maxLength={4}
              onKeyDown={e => e.key === 'Enter' && checkPin()}
            />
            {pinError && <p className="text-[10px]" style={{ color: '#ef4444' }}>{pinError}</p>}
            <div className="flex gap-2">
              <button onClick={checkPin} className="flex-1 py-1.5 rounded text-[11px] font-medium" style={{ background: '#f59e0b', color: '#0f172a' }}>Confirm</button>
              <button onClick={() => setAuthOpen(null)} className="px-3 py-1.5 rounded text-[11px]" style={{ color: '#94a3b8' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExportBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card p-3 flex flex-col items-center gap-1.5 hover:bg-white/5 transition-colors">
      <span style={{ color: '#22d3ee' }}>{icon}</span>
      <span className="text-[10px] font-medium" style={{ color: '#e2e8f0' }}>{label}</span>
    </button>
  );
}

import type { Task } from '@/types';
