import { useState, useRef } from 'react';
import { Calendar, Upload, ChevronDown, ChevronRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ScheduleTask {
  id: number;
  description: string;
  startDate: string;
  duration: string;
  endDate: string;
  percentComplete: number;
  owner: string;
  predecessors: string;
  variance: string;
  isSection: boolean;
  zone: string;
}

interface ZoneSection {
  name: string;
  percentComplete: number;
  tasks: ScheduleTask[];
  expanded: boolean;
}

export default function SchedulePage() {
  const [sections, setSections] = useState<ZoneSection[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = new Uint8Array(reader.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

      const parsedSections: ZoneSection[] = [];
      let currentSection: ZoneSection | null = null;
      let taskId = 0;

      const sectionPatterns = [
        /^POD\s?\d+$/i,
        /^Visitor Lab/i,
        /^Hospital POD/i,
        /^Bench Lab/i,
        /^Machine Farm/i,
        /^PLC System/i,
        /^SCADA System/i,
      ];

      rows.forEach(row => {
        const desc = String(row['Task'] || row['Description'] || row['task'] || row['description'] || '').trim();
        if (!desc) return;

        const pctRaw = String(row['% Complete'] || row['Percent Complete'] || row['percentComplete'] || '0');
        const pct = parseInt(pctRaw.replace('%', '')) || 0;
        const duration = String(row['Duration'] || '');
        const daysMatch = duration.match(/(\d+)d/);
        const isLongDuration = daysMatch && parseInt(daysMatch[1]) > 30;

        // Check if this is a section header
        const isSection = sectionPatterns.some(p => p.test(desc)) || !!isLongDuration;

        if (isSection && sectionPatterns.some(p => p.test(desc))) {
          if (currentSection) parsedSections.push(currentSection);
          currentSection = {
            name: desc,
            percentComplete: pct,
            tasks: [],
            expanded: false,
          };
          return;
        }

        // Skip rows without a current section (top-level items like equipment orders)
        if (!currentSection) {
          // Create a "General" section for top-level tasks
          if (parsedSections.length === 0 || parsedSections[0]?.name !== 'General') {
            if (!currentSection) {
              currentSection = { name: 'General', percentComplete: 0, tasks: [], expanded: false };
            }
          }
        }

        if (currentSection) {
          currentSection.tasks.push({
            id: ++taskId,
            description: desc,
            startDate: String(row['Start Date'] || ''),
            duration: duration,
            endDate: String(row['End Date'] || ''),
            percentComplete: pct,
            owner: String(row['Owner'] || ''),
            predecessors: String(row['Predecessors'] || ''),
            variance: String(row['Variance'] || ''),
            isSection: !!isLongDuration && !sectionPatterns.some(p => p.test(desc)),
            zone: currentSection.name,
          });
        }
      });

      if (currentSection) parsedSections.push(currentSection);
      setSections(parsedSections);
      setLoaded(true);
      setLastUpdated(new Date().toLocaleString());

      // Save to localStorage
      localStorage.setItem('lc-schedule-data', JSON.stringify(parsedSections));
      localStorage.setItem('lc-schedule-updated', new Date().toISOString());
    };
    reader.readAsArrayBuffer(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  // Load from localStorage on mount
  useState(() => {
    const saved = localStorage.getItem('lc-schedule-data');
    const savedDate = localStorage.getItem('lc-schedule-updated');
    if (saved) {
      try {
        setSections(JSON.parse(saved));
        setLoaded(true);
        if (savedDate) setLastUpdated(new Date(savedDate).toLocaleString());
      } catch { /* ignore */ }
    }
  });

  function toggleSection(index: number) {
    setSections(prev => prev.map((s, i) => i === index ? { ...s, expanded: !s.expanded } : s));
  }

  function getStatusColor(pct: number): string {
    if (pct === 100) return '#10b981';
    if (pct >= 75) return '#22d3ee';
    if (pct > 0) return '#f59e0b';
    return '#64748b';
  }

  function getVarianceColor(variance: string): string {
    if (!variance || variance === '0') return '#64748b';
    const match = variance.match(/-?(\d+)d/);
    if (!match) return '#64748b';
    const days = parseInt(variance);
    if (days < 0) return '#ef4444'; // behind schedule
    if (days > 0) return '#10b981'; // ahead of schedule
    return '#64748b';
  }

  const totalTasks = sections.reduce((s, sec) => s + sec.tasks.length, 0);
  const completeTasks = sections.reduce((s, sec) => s + sec.tasks.filter(t => t.percentComplete === 100).length, 0);
  const overallPct = totalTasks > 0 ? Math.round(sections.reduce((s, sec) => s + sec.tasks.reduce((ts, t) => ts + t.percentComplete, 0), 0) / totalTasks) : 0;
  const behindSchedule = sections.reduce((s, sec) => s + sec.tasks.filter(t => {
    const match = t.variance.match(/-(\d+)d/);
    return match && parseInt(match[1]) > 0;
  }).length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={16} style={{ color: '#22d3ee' }} />
          <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Construction Schedule</h1>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && <span className="text-[9px]" style={{ color: '#64748b' }}>Updated: {lastUpdated}</span>}
          <label className="flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-[10px] font-medium" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
            <Upload size={10} /> Upload Schedule
            <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      </div>

      {!loaded && (
        <div className="card p-8 text-center">
          <Calendar size={32} style={{ color: '#64748b' }} className="mx-auto mb-3" />
          <div className="text-[12px] font-medium" style={{ color: '#94a3b8' }}>No schedule loaded</div>
          <div className="text-[10px] mt-1" style={{ color: '#64748b' }}>Upload the Comstock Schedule Excel to view construction milestones alongside your commissioning tasks.</div>
        </div>
      )}

      {loaded && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="card p-3 text-center">
              <div className="text-lg font-bold" style={{ color: '#22d3ee' }}>{overallPct}%</div>
              <div className="text-[9px]" style={{ color: '#94a3b8' }}>Overall Progress</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-lg font-bold" style={{ color: '#10b981' }}>{completeTasks}/{totalTasks}</div>
              <div className="text-[9px]" style={{ color: '#94a3b8' }}>Tasks Complete</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-lg font-bold" style={{ color: '#a855f7' }}>{sections.length}</div>
              <div className="text-[9px]" style={{ color: '#94a3b8' }}>Zones/Sections</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-lg font-bold" style={{ color: behindSchedule > 0 ? '#ef4444' : '#10b981' }}>{behindSchedule}</div>
              <div className="text-[9px]" style={{ color: '#94a3b8' }}>Behind Schedule</div>
            </div>
          </div>

          {/* Zone Sections */}
          <div className="space-y-2">
            {sections.map((section, idx) => (
              <div key={idx} className="card overflow-hidden">
                <button
                  onClick={() => toggleSection(idx)}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {section.expanded ? <ChevronDown size={12} style={{ color: '#94a3b8' }} /> : <ChevronRight size={12} style={{ color: '#94a3b8' }} />}
                    <span className="text-[11px] font-bold" style={{ color: '#e2e8f0' }}>{section.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(51,65,85,0.4)', color: '#94a3b8' }}>
                      {section.tasks.length} tasks
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(51,65,85,0.5)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${section.percentComplete}%`, background: getStatusColor(section.percentComplete) }} />
                    </div>
                    <span className="text-[10px] font-medium w-8 text-right" style={{ color: getStatusColor(section.percentComplete) }}>{section.percentComplete}%</span>
                  </div>
                </button>

                {section.expanded && (
                  <div className="border-t" style={{ borderColor: 'rgba(51,65,85,0.3)' }}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr style={{ background: 'rgba(51,65,85,0.3)' }}>
                            <th className="text-left p-1.5 font-medium" style={{ color: '#94a3b8' }}>Task</th>
                            <th className="text-center p-1.5 font-medium" style={{ color: '#94a3b8' }}>Start</th>
                            <th className="text-center p-1.5 font-medium" style={{ color: '#94a3b8' }}>End</th>
                            <th className="text-center p-1.5 font-medium" style={{ color: '#94a3b8' }}>%</th>
                            <th className="text-left p-1.5 font-medium" style={{ color: '#94a3b8' }}>Owner</th>
                            <th className="text-center p-1.5 font-medium" style={{ color: '#94a3b8' }}>Variance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.tasks.map(task => (
                            <tr key={task.id} style={{ borderTop: '1px solid rgba(51,65,85,0.2)' }}>
                              <td className="p-1.5" style={{ color: '#e2e8f0', maxWidth: '200px' }}>
                                <div className="flex items-center gap-1">
                                  {task.percentComplete === 100 ? <CheckCircle2 size={9} style={{ color: '#10b981', flexShrink: 0 }} /> :
                                   task.percentComplete > 0 ? <Clock size={9} style={{ color: '#f59e0b', flexShrink: 0 }} /> :
                                   <AlertCircle size={9} style={{ color: '#64748b', flexShrink: 0 }} />}
                                  <span className="truncate">{task.description}</span>
                                </div>
                              </td>
                              <td className="text-center p-1.5 whitespace-nowrap" style={{ color: '#94a3b8' }}>{task.startDate}</td>
                              <td className="text-center p-1.5 whitespace-nowrap" style={{ color: '#94a3b8' }}>{task.endDate}</td>
                              <td className="text-center p-1.5">
                                <span style={{ color: getStatusColor(task.percentComplete) }}>{task.percentComplete}%</span>
                              </td>
                              <td className="p-1.5" style={{ color: '#94a3b8' }}>{task.owner}</td>
                              <td className="text-center p-1.5" style={{ color: getVarianceColor(task.variance) }}>{task.variance || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
