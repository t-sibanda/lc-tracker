import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Cpu, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import type { IOPoint } from '@/types';
import { generateTestSteps } from '@/data/testProcedures';

let nextId = 1;
function uid(): string { return `io-${Date.now()}-${nextId++}`; }

export default function IOImport() {
  const { ioPoints, addIO, clearIO } = useApp();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [preview, setPreview] = useState<IOPoint[]>([]);

  function parseSheet(data: ArrayBuffer): IOPoint[] {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];

    const points: IOPoint[] = [];
    let currentPanel = 'POD1-RIO';
    let currentZone = 'POD 1';

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 3) continue;

      // Detect panel name from first column
      const firstCell = String(row[0] || '').trim();
      if (firstCell && firstCell.includes('POD') && firstCell.includes('RIO')) {
        currentPanel = firstCell;
        currentZone = firstCell.replace('-RIO', ' ').replace(/\s+/g, ' ').trim();
      }

      // Detect description in second column
      const desc = String(row[1] || '').trim();
      if (!desc || desc === 'Description' || desc === 'TOTAL' || desc === 'Spare') continue;

      // Detect I/O type from third column
      const ioTypeCell = String(row[2] || '').trim().toUpperCase();
      if (!['AI', 'AO', 'DI', 'DO'].includes(ioTypeCell)) continue;

      // Parse counts from columns 3-6
      const aiCount = Number(row[3]) || 0;
      const aoCount = Number(row[4]) || 0;
      const diCount = Number(row[5]) || 0;
      const doCount = Number(row[6]) || 0;

      // Parse signal info
      const signalType = String(row[7] || '').trim();
      const signal = String(row[8] || '').trim();
      const instrumentPower = String(row[9] || '').trim();
      const plc = String(row[10] || '').trim();
      const ioModule = String(row[11] || '').trim();

      // Parse rack/slot/channel
      const rack = Number(row[12]) || 0;
      const slot = Number(row[13]) || 0;
      const channel = Number(row[14]) || 0;

      // I/O address
      const ioAddress = String(row[15] || '').trim();

      // Engineering range
      const engMin = String(row[16] || '').trim();
      const engMax = String(row[17] || '').trim();
      const units = String(row[18] || '').trim();

      // Verification columns (Y = true, empty = false)
      const deviceInstalled = String(row[19] || '').toUpperCase() === 'Y';
      const wiringTagged = String(row[20] || '').toUpperCase() === 'Y';
      const devicePowered = String(row[21] || '').toUpperCase() === 'Y';
      const signalVerified = String(row[22] || '').toUpperCase() === 'Y';

      // Pass/Fail
      const pfCell = String(row[23] || '').trim();
      const passFail = pfCell === 'Y' ? 'Pass' : pfCell === 'N' ? 'Fail' : 'Pending';

      // Notes
      const notes = String(row[24] || '').trim();

      points.push({
        id: uid(), panel: currentPanel, description: desc,
        ioType: ioTypeCell as 'AI' | 'AO' | 'DI' | 'DO',
        aiCount, aoCount, diCount, doCount, signalType, signal,
        instrumentPower, plc, ioModule, rack, slot, channel, ioAddress,
        engMin, engMax, units, zone: currentZone, system: 'PLC',
        deviceInstalled, wiringTagged, devicePowered, signalVerified,
        passFail, notes, testSteps: generateTestSteps(ioTypeCell as 'AI' | 'AO' | 'DI' | 'DO'),
        updatedAt: new Date().toISOString(),
      });
    }

    return points;
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const points = parseSheet(reader.result as ArrayBuffer);
      setPreview(points);
    };
    reader.readAsArrayBuffer(file);
  }

  function importAll() {
    let imported = 0;
    preview.forEach(p => {
      // Skip duplicates (same description + same I/O address)
      if (!ioPoints.some(existing => existing.description === p.description && existing.ioAddress === p.ioAddress)) {
        addIO(p);
        imported++;
      }
    });
    setResult({ imported, skipped: preview.length - imported });
    setPreview([]);
    if (fileRef.current) fileRef.current.value = '';
  }

  function replaceAll() {
    clearIO();
    preview.forEach(p => addIO(p));
    setResult({ imported: preview.length, skipped: 0 });
    setPreview([]);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Cpu size={16} style={{ color: '#22d3ee' }} />
        <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Import I/O Points</h1>
        <button onClick={() => navigate('/io-points')} className="ml-auto text-[10px] px-2 py-1 rounded" style={{ color: '#22d3ee' }}>← Back to I/O Points</button>
      </div>

      <div className="card p-4 space-y-3">
        <p className="text-[11px]" style={{ color: '#94a3b8' }}>
          Upload a PLC I/O test sheet (.xlsx or .csv). The app will parse AI, DI, and DO points with their signal types, PLC addresses, and verification status.
        </p>
        <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" onChange={handleFile} className="text-[11px]" style={{ color: '#94a3b8' }} />

        {preview.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: '#22d3ee' }}>Found {preview.length} I/O points</span>
              <div className="flex gap-1.5">
                <button onClick={importAll} className="px-3 py-1 rounded text-[10px] font-medium" style={{ background: '#22d3ee', color: '#0f172a' }}>Add New Only</button>
                <button onClick={replaceAll} className="px-3 py-1 rounded text-[10px]" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Replace All</button>
              </div>
            </div>

            {/* Preview table */}
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-[9px]">
                <thead>
                  <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
                    <th className="text-left py-1">Type</th>
                    <th className="text-left py-1">Description</th>
                    <th className="text-left py-1">Address</th>
                    <th className="text-left py-1">Signal</th>
                    <th className="text-center py-1">I</th>
                    <th className="text-center py-1">W</th>
                    <th className="text-center py-1">P</th>
                    <th className="text-center py-1">S</th>
                    <th className="text-center py-1">PF</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 20).map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(51,65,85,0.2)' }}>
                      <td className="py-0.5"><span className="text-[8px] px-1 rounded" style={{ background: `${p.ioType === 'AI' ? '#22d3ee' : p.ioType === 'DI' ? '#f59e0b' : '#10b981'}20`, color: p.ioType === 'AI' ? '#22d3ee' : p.ioType === 'DI' ? '#f59e0b' : '#10b981' }}>{p.ioType}</span></td>
                      <td className="py-0.5 truncate max-w-[150px]" style={{ color: '#e2e8f0' }}>{p.description}</td>
                      <td className="py-0.5" style={{ color: '#64748b' }}>{p.ioAddress}</td>
                      <td className="py-0.5" style={{ color: '#64748b' }}>{p.signal}</td>
                      <td className="text-center py-0.5">{p.deviceInstalled ? <Check size={8} style={{ color: '#10b981' }} /> : ''}</td>
                      <td className="text-center py-0.5">{p.wiringTagged ? <Check size={8} style={{ color: '#10b981' }} /> : ''}</td>
                      <td className="text-center py-0.5">{p.devicePowered ? <Check size={8} style={{ color: '#10b981' }} /> : ''}</td>
                      <td className="text-center py-0.5">{p.signalVerified ? <Check size={8} style={{ color: '#10b981' }} /> : ''}</td>
                      <td className="text-center py-0.5"><span style={{ color: p.passFail === 'Pass' ? '#10b981' : p.passFail === 'Fail' ? '#ef4444' : '#64748b' }}>{p.passFail[0]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 20 && <p className="text-[9px] text-center mt-1" style={{ color: '#64748b' }}>...and {preview.length - 20} more</p>}
            </div>
          </div>
        )}

        {result && (
          <div className="p-2 rounded" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <p className="text-[11px]" style={{ color: '#10b981' }}><Check size={11} className="inline mr-1" /> Imported {result.imported} points, skipped {result.skipped} duplicates</p>
          </div>
        )}
      </div>
    </div>
  );
}
