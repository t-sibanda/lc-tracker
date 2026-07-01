import { useState, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Database, Upload, Download, Trash2, AlertTriangle, FileText,
  Check, Lock, History, Globe, Laptop, Eye, UploadCloud
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Task } from '@/types';

const PIN = '1234';

// --- Excel Import Helpers ---

/** Normalize a header string: lowercase, trim, remove special chars */
function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ');
}

/** Find the task/description column value from a row using flexible header matching */
function getTaskDescription(row: Record<string, unknown>): string {
  const descKeys = Object.keys(row).filter(k => {
    const n = normalizeHeader(k);
    return n === 'task' || n === 'tasks' || n === 'task name' || n === 'task description' ||
      n === 'description' || n === 'desc' || n === 'name' || n === 'activity' || n === 'item';
  });
  for (const key of descKeys) {
    const val = String(row[key] || '').trim();
    if (val) return val;
  }
  return '';
}

/** Find the percentage complete value from a row using flexible header matching */
function getPercentComplete(row: Record<string, unknown>): number | null {
  const pctKeys = Object.keys(row).filter(k => {
    const n = normalizeHeader(k);
    return n === ' complete' || n === 'complete' || n === 'percent complete' ||
      n === 'percentage complete' || n === 'percentcomplete' || n === 'percent' ||
      n === 'progress' || n === 'pct' || n === 'pct complete' || n === 'done' ||
      n === 'completion' || n.includes('complete') || n.includes('progress') || n.includes('percent');
  });
  for (const key of pctKeys) {
    const raw = row[key];
    if (raw === null || raw === undefined || raw === '') continue;
    const num = Number(raw);
    if (!isNaN(num)) return num;
  }
  return null;
}

/** Get optional field value from a row with flexible matching */
function getOptionalField(row: Record<string, unknown>, ...candidates: string[]): string {
  for (const candidate of candidates) {
    const key = Object.keys(row).find(k => normalizeHeader(k) === normalizeHeader(candidate));
    if (key && row[key]) return String(row[key]).trim();
  }
  return '';
}

/** Simple token-based fuzzy similarity score between 0 and 1 */
function similarityScore(a: string, b: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;

  // Token overlap (Jaccard-like)
  const tokensA = new Set(na.split(' ').filter(t => t.length > 1));
  const tokensB = new Set(nb.split(' ').filter(t => t.length > 1));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  const intersection = [...tokensA].filter(t => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  const jaccard = intersection / union;

  // Levenshtein for short strings
  if (na.length < 60 && nb.length < 60) {
    const maxLen = Math.max(na.length, nb.length);
    const dist = levenshtein(na, nb);
    const levScore = 1 - dist / maxLen;
    return Math.max(jaccard, levScore);
  }

  return jaccard;
}

/** Basic Levenshtein distance */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

const MATCH_THRESHOLD = 0.6; // Minimum similarity to consider a match

interface PreviewRow {
  excelDesc: string;
  matchedTask: Task | null;
  score: number;
  newPercent: number | null;
  currentPercent: number;
}

function findBestMatch(desc: string, tasks: Task[]): { task: Task | null; score: number } {
  let bestTask: Task | null = null;
  let bestScore = 0;
  for (const t of tasks) {
    const score = similarityScore(desc, t.description);
    if (score > bestScore) {
      bestScore = score;
      bestTask = t;
    }
  }
  return { task: bestScore >= MATCH_THRESHOLD ? bestTask : null, score: bestScore };
}

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
  const [previewData, setPreviewData] = useState<PreviewRow[] | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[] | null>(null);
  const [detectedHeaders, setDetectedHeaders] = useState<{ taskCol: string | null; pctCol: string | null } | null>(null);
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

      if (rows.length === 0) {
        setImportResult({ matched: 0, unmatched: 0 });
        return;
      }

      // Detect which columns were found
      const sampleRow = rows[0];
      const taskColKey = Object.keys(sampleRow).find(k => {
        const n = normalizeHeader(k);
        return n === 'task' || n === 'tasks' || n === 'task name' || n === 'task description' ||
          n === 'description' || n === 'desc' || n === 'name' || n === 'activity' || n === 'item';
      });
      const pctColKey = Object.keys(sampleRow).find(k => {
        const n = normalizeHeader(k);
        return n === ' complete' || n === 'complete' || n === 'percent complete' ||
          n === 'percentage complete' || n === 'percentcomplete' || n === 'percent' ||
          n === 'progress' || n === 'pct' || n === 'pct complete' || n === 'done' ||
          n === 'completion' || n.includes('complete') || n.includes('progress') || n.includes('percent');
      });
      setDetectedHeaders({ taskCol: taskColKey || null, pctCol: pctColKey || null });
      setParsedRows(rows);

      // Generate preview
      if (importMode === 'update') {
        const preview: PreviewRow[] = rows.map(row => {
          const desc = getTaskDescription(row);
          const pctRaw = getPercentComplete(row);
          const pct = pctRaw !== null ? (pctRaw <= 1 && pctRaw > 0 ? Math.round(pctRaw * 100) : pctRaw) : null;
          if (!desc) return { excelDesc: '(empty row)', matchedTask: null, score: 0, newPercent: pct, currentPercent: 0 };
          const { task, score } = findBestMatch(desc, tasks);
          return {
            excelDesc: desc,
            matchedTask: task,
            score,
            newPercent: pct,
            currentPercent: task?.percentComplete ?? 0,
          };
        }).filter(r => r.excelDesc !== '(empty row)');
        setPreviewData(preview);
      } else {
        // New import preview
        const preview: PreviewRow[] = rows.map(row => {
          const desc = getTaskDescription(row);
          const pctRaw = getPercentComplete(row);
          const pct = pctRaw !== null ? (pctRaw <= 1 && pctRaw > 0 ? Math.round(pctRaw * 100) : pctRaw) : null;
          if (!desc) return { excelDesc: '(empty row)', matchedTask: null, score: 0, newPercent: pct, currentPercent: 0 };
          // Check if already exists (would be skipped)
          const { task, score } = findBestMatch(desc, tasks);
          return {
            excelDesc: desc,
            matchedTask: score >= 0.85 ? task : null, // high threshold = duplicate
            score,
            newPercent: pct,
            currentPercent: task?.percentComplete ?? 0,
          };
        }).filter(r => r.excelDesc !== '(empty row)');
        setPreviewData(preview);
      }

      setImportResult(null);
    };
    reader.readAsArrayBuffer(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  function confirmImport() {
    if (!parsedRows || parsedRows.length === 0) return;

    if (importMode === 'update') {
      let matched = 0;
      let unmatched = 0;
      const updatedTasks = tasks.map(t => {
        // Find best matching row for this task using fuzzy matching
        let bestRow: Record<string, unknown> | null = null;
        let bestScore = 0;
        for (const row of parsedRows) {
          const desc = getTaskDescription(row);
          if (!desc) continue;
          const score = similarityScore(desc, t.description);
          if (score > bestScore) {
            bestScore = score;
            bestRow = row;
          }
        }

        if (bestRow && bestScore >= MATCH_THRESHOLD) {
          matched++;
          const pctRaw = getPercentComplete(bestRow);
          const pct = pctRaw !== null
            ? (pctRaw <= 1 && pctRaw > 0 ? Math.round(pctRaw * 100) : pctRaw)
            : t.percentComplete;
          const normalizedPct = Math.max(0, Math.min(100, pct));
          return {
            ...t,
            percentComplete: normalizedPct,
            status: (normalizedPct === 100 ? 'Complete' : normalizedPct > 0 ? 'In Progress' : 'Not Started') as Task['status'],
            owner: getOptionalField(bestRow, 'Owner', 'Primary Owner', 'Assigned To', 'Responsible') || t.owner,
            updatedAt: new Date().toISOString(),
          };
        } else {
          unmatched++;
          return t;
        }
      });
      importData({ tasks: updatedTasks });
      setImportResult({ matched, unmatched });
    } else {
      // Import as new tasks
      const newTasks: typeof tasks = [];
      parsedRows.forEach(row => {
        const desc = getTaskDescription(row);
        if (!desc) return;
        const pctRaw = getPercentComplete(row);
        const pct = pctRaw !== null ? (pctRaw <= 1 && pctRaw > 0 ? Math.round(pctRaw * 100) : pctRaw) : 0;
        const normalizedPct = Math.max(0, Math.min(100, pct));
        // Skip duplicates (fuzzy)
        const { score } = findBestMatch(desc, tasks);
        if (score >= 0.85) return;
        newTasks.push({
          id: `imported-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          description: desc,
          phase: getOptionalField(row, 'Phase') || 'Development',
          zone: getOptionalField(row, 'Zone') || 'All',
          system: getOptionalField(row, 'System') || 'Project',
          discipline: getOptionalField(row, 'Discipline') || 'Controls',
          scope: (getOptionalField(row, 'Scope').toLowerCase() === 'zone' ? 'zone' : 'project') as Task['scope'],
          owner: getOptionalField(row, 'Owner', 'Primary Owner', 'Assigned To') || '',
          support: getOptionalField(row, 'Support', 'Secondary Owner') || '',
          predecessors: getOptionalField(row, 'Predecessors', 'Prerequisite') || '',
          deliverable: getOptionalField(row, 'Deliverable') || '',
          notes: getOptionalField(row, 'Notes') || '',
          percentComplete: normalizedPct,
          status: (normalizedPct === 100 ? 'Complete' : normalizedPct > 0 ? 'In Progress' : 'Not Started') as Task['status'],
          startDate: getOptionalField(row, 'Start Date') || '',
          endDate: getOptionalField(row, 'End Date', 'Need by Date', 'Due Date') || '',
          comments: [],
          updatedAt: new Date().toISOString(),
        });
      });
      importData({ tasks: [...tasks, ...newTasks] });
      setImportResult({ matched: newTasks.length, unmatched: 0 });
    }

    // Clear preview
    setPreviewData(null);
    setParsedRows(null);
    setDetectedHeaders(null);
  }

  function cancelImport() {
    setPreviewData(null);
    setParsedRows(null);
    setDetectedHeaders(null);
    setImportResult(null);
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
            <button onClick={() => { setImportMode('update'); setImportResult(null); cancelImport(); }} className="px-3 py-1.5 rounded text-[11px] font-medium transition-colors" style={{ background: importMode === 'update' ? 'rgba(34,211,238,0.2)' : 'rgba(51,65,85,0.3)', color: importMode === 'update' ? '#22d3ee' : '#94a3b8' }}>Update Existing Tasks</button>
            <button onClick={() => { setImportMode('new'); setImportResult(null); cancelImport(); }} className="px-3 py-1.5 rounded text-[11px] font-medium transition-colors" style={{ background: importMode === 'new' ? 'rgba(16,185,129,0.2)' : 'rgba(51,65,85,0.3)', color: importMode === 'new' ? '#10b981' : '#94a3b8' }}>Import as New</button>
          </div>
          <p className="text-[10px]" style={{ color: '#94a3b8' }}>
            {importMode === 'update'
              ? 'Upload an Excel file — tasks are matched using fuzzy matching. Preview before applying.'
              : 'Upload an Excel file to create new tasks. Near-duplicates will be skipped.'}
          </p>
          <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" onChange={handleFileImport} className="text-[11px]" style={{ color: '#94a3b8' }} />

          {/* Detected Headers */}
          {detectedHeaders && (
            <div className="p-2 rounded text-[10px] space-y-0.5" style={{ background: 'rgba(51,65,85,0.4)' }}>
              <p style={{ color: '#e2e8f0' }}><strong>Detected columns:</strong></p>
              <p style={{ color: detectedHeaders.taskCol ? '#10b981' : '#ef4444' }}>
                Task/Description: {detectedHeaders.taskCol ? `✓ "${detectedHeaders.taskCol}"` : '✗ Not found'}
              </p>
              <p style={{ color: detectedHeaders.pctCol ? '#10b981' : '#ef4444' }}>
                % Complete: {detectedHeaders.pctCol ? `✓ "${detectedHeaders.pctCol}"` : '✗ Not found'}
              </p>
            </div>
          )}

          {/* Preview Table */}
          {previewData && previewData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye size={12} style={{ color: '#f59e0b' }} />
                <span className="text-[11px] font-bold" style={{ color: '#f59e0b' }}>Preview ({previewData.length} rows)</span>
              </div>
              <div className="max-h-64 overflow-y-auto rounded" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.5)' }}>
                <table className="w-full text-[10px]">
                  <thead>
                    <tr style={{ background: 'rgba(51,65,85,0.5)' }}>
                      <th className="text-left p-1.5" style={{ color: '#94a3b8' }}>Excel Row</th>
                      {importMode === 'update' && <th className="text-left p-1.5" style={{ color: '#94a3b8' }}>Matched To</th>}
                      <th className="text-center p-1.5" style={{ color: '#94a3b8' }}>Score</th>
                      <th className="text-center p-1.5" style={{ color: '#94a3b8' }}>{importMode === 'update' ? 'Current → New %' : 'New %'}</th>
                      <th className="text-center p-1.5" style={{ color: '#94a3b8' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 50).map((row, i) => {
                      const isMatch = importMode === 'update' ? !!row.matchedTask : !row.matchedTask;
                      const statusColor = importMode === 'update'
                        ? (row.matchedTask ? '#10b981' : '#ef4444')
                        : (row.matchedTask ? '#f59e0b' : '#10b981');
                      const statusText = importMode === 'update'
                        ? (row.matchedTask ? 'Will update' : 'No match')
                        : (row.matchedTask ? 'Duplicate (skip)' : 'Will import');
                      return (
                        <tr key={i} style={{ borderTop: '1px solid rgba(51,65,85,0.3)', opacity: isMatch ? 1 : 0.6 }}>
                          <td className="p-1.5" style={{ color: '#e2e8f0', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.excelDesc}>{row.excelDesc}</td>
                          {importMode === 'update' && (
                            <td className="p-1.5" style={{ color: '#94a3b8', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.matchedTask?.description || ''}>
                              {row.matchedTask?.description || '—'}
                            </td>
                          )}
                          <td className="text-center p-1.5" style={{ color: row.score >= 0.8 ? '#10b981' : row.score >= MATCH_THRESHOLD ? '#f59e0b' : '#ef4444' }}>
                            {row.score > 0 ? `${Math.round(row.score * 100)}%` : '—'}
                          </td>
                          <td className="text-center p-1.5" style={{ color: '#e2e8f0' }}>
                            {importMode === 'update'
                              ? row.matchedTask ? `${row.currentPercent}% → ${row.newPercent ?? row.currentPercent}%` : '—'
                              : `${row.newPercent ?? 0}%`}
                          </td>
                          <td className="text-center p-1.5" style={{ color: statusColor }}>{statusText}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {previewData.length > 50 && (
                  <div className="p-2 text-center text-[10px]" style={{ color: '#64748b' }}>...and {previewData.length - 50} more rows</div>
                )}
              </div>

              {/* Summary */}
              <div className="p-2 rounded text-[10px]" style={{ background: 'rgba(34,211,238,0.05)' }}>
                {importMode === 'update' ? (
                  <p style={{ color: '#e2e8f0' }}>
                    <strong>{previewData.filter(r => r.matchedTask).length}</strong> tasks will be updated,{' '}
                    <strong>{previewData.filter(r => !r.matchedTask).length}</strong> rows had no match
                  </p>
                ) : (
                  <p style={{ color: '#e2e8f0' }}>
                    <strong>{previewData.filter(r => !r.matchedTask).length}</strong> new tasks will be imported,{' '}
                    <strong>{previewData.filter(r => r.matchedTask).length}</strong> duplicates will be skipped
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button onClick={confirmImport} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-medium" style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>
                  <UploadCloud size={12} /> Confirm Import
                </button>
                <button onClick={cancelImport} className="px-3 py-2 rounded-md text-[11px] font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* No preview but empty detection */}
          {previewData && previewData.length === 0 && (
            <div className="p-2 rounded" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <div className="text-[11px]" style={{ color: '#ef4444' }}>No valid rows found. Check that your file has a recognizable Task/Description column.</div>
            </div>
          )}

          {importResult && (
            <div className="p-2 rounded" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <div className="flex items-center gap-1 text-[11px]" style={{ color: '#10b981' }}>
                <Check size={12} /> {importMode === 'update' ? `Updated ${importResult.matched} tasks` : `Imported ${importResult.matched} tasks`}
              </div>
              {importResult.unmatched > 0 && (
                <div className="text-[10px] mt-0.5" style={{ color: '#f59e0b' }}>{importResult.unmatched} tasks had no matching row</div>
              )}
            </div>
          )}
          <div className="p-2 rounded text-[10px] space-y-0.5" style={{ background: 'rgba(51,65,85,0.3)', color: '#64748b' }}>
            <p><strong>Accepted column names (flexible, case-insensitive):</strong></p>
            <p>Task: Task, Tasks, Task Name, Description, Activity, Item</p>
            <p>Progress: % Complete, Percent Complete, Percentage Complete, Progress, Completion</p>
            <p><strong>Optional:</strong> Phase, Zone, System, Owner, Discipline, Start Date, End Date, Notes</p>
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
