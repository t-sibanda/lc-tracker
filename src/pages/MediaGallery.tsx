import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Image, Trash2, FolderOpen, Search, X } from 'lucide-react';
import type { Photo } from '@/types';

type Directory = 'all' | 'by-zone' | 'by-task' | 'by-equipment' | 'by-issue' | 'by-inventory';

const dirLabels: Record<Directory, { label: string; color: string }> = {
  'all': { label: 'All Photos', color: '#22d3ee' },
  'by-zone': { label: 'By Zone', color: '#f59e0b' },
  'by-task': { label: 'By Task', color: '#10b981' },
  'by-equipment': { label: 'By Equipment', color: '#3b82f6' },
  'by-issue': { label: 'By Issue', color: '#ef4444' },
  'by-inventory': { label: 'By Inventory', color: '#a855f7' },
};

const typeColors: Record<string, string> = {
  task: '#10b981', equipment: '#3b82f6', issue: '#ef4444', inventory: '#a855f7', general: '#64748b',
};

export default function MediaGallery() {
  const { photos, deletePhoto } = useApp();
  const [activeDir, setActiveDir] = useState<Directory>('all');
  const [search, setSearch] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = photos;
    if (activeDir !== 'all') {
      const typeMap: Record<string, string> = {
        'by-task': 'task',
        'by-equipment': 'equipment',
        'by-issue': 'issue',
        'by-inventory': 'inventory',
      };
      if (activeDir === 'by-zone') {
        list = photos.filter(p => p.zone && p.zone !== 'All');
      } else {
        list = photos.filter(p => p.entityType === typeMap[activeDir]);
      }
    }
    if (search) {
      list = list.filter(p =>
        p.caption.toLowerCase().includes(search.toLowerCase()) ||
        p.entityName.toLowerCase().includes(search.toLowerCase()) ||
        p.zone.toLowerCase().includes(search.toLowerCase())
      );
    }
    return list;
  }, [photos, activeDir, search]);

  const zoneGroups = useMemo(() => {
    if (activeDir !== 'by-zone') return [];
    const zones = [...new Set(filtered.map(p => p.zone))].sort();
    return zones.map(zone => ({ name: zone, photos: filtered.filter(p => p.zone === zone) }));
  }, [filtered, activeDir]);

  const previewPhoto = photos.find(p => p.id === previewId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Image size={16} style={{ color: '#22d3ee' }} />
          <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Media Gallery</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>{photos.length}</span>
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search media..." className="input pl-7 pr-3 py-1.5 text-xs rounded-lg w-48" />
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {(Object.keys(dirLabels) as Directory[]).map(dir => (
          <button
            key={dir}
            onClick={() => setActiveDir(dir)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors"
            style={{
              background: activeDir === dir ? `${dirLabels[dir].color}20` : 'rgba(51,65,85,0.2)',
              color: activeDir === dir ? dirLabels[dir].color : '#94a3b8',
              border: activeDir === dir ? `1px solid ${dirLabels[dir].color}30` : '1px solid transparent',
            }}
          >
            <FolderOpen size={11} />
            {dirLabels[dir].label}
            <span className="text-[9px] opacity-60">
              {dir === 'all' ? photos.length : photos.filter(p => {
                if (dir === 'by-zone') return p.zone && p.zone !== 'All';
                const map: Record<string, string> = { 'by-task': 'task', 'by-equipment': 'equipment', 'by-issue': 'issue', 'by-inventory': 'inventory' };
                return p.entityType === map[dir];
              }).length}
            </span>
          </button>
        ))}
      </div>

      {photos.length === 0 ? (
        <div className="card p-8 text-center text-[11px]" style={{ color: '#64748b' }}>
          No photos yet. Use the <strong>camera icon</strong> on any task, equipment, issue, or inventory item to capture evidence.
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-[11px]" style={{ color: '#64748b' }}>No photos in this directory.</div>
      ) : (
        <div className="space-y-4">
          {activeDir === 'by-zone' && zoneGroups.map(group => (
            <div key={group.name}>
              <h3 className="text-[11px] font-bold mb-2 flex items-center gap-1.5" style={{ color: '#f59e0b' }}>
                <FolderOpen size={12} /> {group.name} <span className="text-[9px] font-normal" style={{ color: '#64748b' }}>({group.photos.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {group.photos.map(photo => (
                  <PhotoCard key={photo.id} photo={photo} onPreview={() => setPreviewId(photo.id)} onDelete={() => deletePhoto(photo.id)} />
                ))}
              </div>
            </div>
          ))}

          {activeDir !== 'by-zone' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(photo => (
                <PhotoCard key={photo.id} photo={photo} onPreview={() => setPreviewId(photo.id)} onDelete={() => deletePhoto(photo.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }} onClick={() => setPreviewId(null)}>
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewId(null)} className="absolute -top-8 right-0 p-1 rounded hover:bg-white/10"><X size={16} style={{ color: '#fff' }} /></button>
            <img src={previewPhoto.url} alt={previewPhoto.caption} className="max-h-[70vh] object-contain rounded-lg" />
            <div className="mt-2 px-1">
              <p className="text-xs font-medium" style={{ color: '#e2e8f0' }}>{previewPhoto.caption}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>{previewPhoto.entityType}</span>
                <span className="text-[9px]" style={{ color: '#94a3b8' }}>{previewPhoto.entityName}</span>
                <span className="text-[9px]" style={{ color: '#64748b' }}>{previewPhoto.zone}</span>
                <span className="text-[9px] ml-auto" style={{ color: '#475569' }}>{new Date(previewPhoto.uploadedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoCard({ photo, onPreview, onDelete }: { photo: Photo; onPreview: () => void; onDelete: () => void }) {
  return (
    <div className="card overflow-hidden group relative cursor-pointer" onClick={onPreview}>
      <img src={photo.url} alt={photo.caption} className="w-full h-28 object-cover" />
      <div className="p-2">
        <p className="text-[10px] truncate" style={{ color: '#e2e8f0' }}>{photo.caption}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: `${typeColors[photo.entityType]}20`, color: typeColors[photo.entityType] }}>{photo.entityType}</span>
          <span className="text-[8px] truncate" style={{ color: '#64748b' }}>{photo.zone}</span>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(239,68,68,0.8)' }}
      >
        <Trash2 size={10} style={{ color: '#fff' }} />
      </button>
    </div>
  );
}
