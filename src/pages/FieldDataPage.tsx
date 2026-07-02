import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Database, Cpu, Image, Activity, Upload
} from 'lucide-react';
import IOPoints from './IOPoints';
import MediaGallery from './MediaGallery';
import ActivityPage from './ActivityPage';
import DataPage from './DataPage';

export default function FieldDataPage() {
  const { ioPoints, photos, activity } = useApp();
  const [activeTab, setActiveTab] = useState<'io' | 'media' | 'activity' | 'data'>('data');

  const tabs = [
    { id: 'data' as const, icon: Upload, label: 'Import/Export', count: null },
    { id: 'io' as const, icon: Cpu, label: 'I/O Points', count: ioPoints.length },
    { id: 'media' as const, icon: Image, label: 'Media', count: photos.length },
    { id: 'activity' as const, icon: Activity, label: 'Activity', count: activity.length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={16} style={{ color: '#22d3ee' }} />
          <h1 className="text-sm font-bold" style={{ color: '#f8fafc' }}>Field Data</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium whitespace-nowrap transition-colors"
            style={{
              background: activeTab === tab.id ? 'rgba(34,211,238,0.15)' : 'rgba(51,65,85,0.2)',
              color: activeTab === tab.id ? '#22d3ee' : '#94a3b8',
            }}
          >
            <tab.icon size={11} />
            {tab.label}
            {tab.count !== null && <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(51,65,85,0.4)' }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'data' && <DataPage />}
      {activeTab === 'io' && <IOPoints />}
      {activeTab === 'media' && <MediaGallery />}
      {activeTab === 'activity' && <ActivityPage />}
    </div>
  );
}
