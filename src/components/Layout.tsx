import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Wrench, Map, AlertTriangle, Zap,
  ClipboardCheck, Users, FolderKanban, Database,
  Activity, Cloud, CloudOff, Package, Image, FolderOpen, Cpu
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import ThemeToggle from './ThemeToggle';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/tasks', icon: Wrench, label: 'Tasks' },
  { to: '/zones', icon: Map, label: 'Zones' },
  { to: '/issues', icon: AlertTriangle, label: 'Issues' },
  { to: '/equipment', icon: Zap, label: 'Equipment' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/io-points', icon: Cpu, label: 'I/O Points' },
  { to: '/checklists', icon: ClipboardCheck, label: 'Checklists' },
  { to: '/media', icon: Image, label: 'Media' },
  { to: '/owners', icon: Users, label: 'Team' },
  { to: '/phases', icon: FolderKanban, label: 'Phases' },
  { to: '/activity', icon: Activity, label: 'Activity' },
  { to: '/data', icon: Database, label: 'Data' },
];

export default function Layout() {
  const { projects, currentProjectId, switchProject, cloudConnected, localOnly } = useApp();

  return (
    <div className="min-h-screen" style={{ background: '#0b1120', color: '#e2e8f0' }}>
      <nav className="sticky top-0 z-40 border-b backdrop-blur-md" style={{ background: 'rgba(15,23,42,0.85)', borderColor: 'rgba(51,65,85,0.5)' }}>
        <div className="max-w-[1600px] mx-auto px-3 h-12 flex items-center gap-2">
          <NavLink to="/" className="flex items-center gap-1.5 mr-2 shrink-0">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0891b2, #22d3ee)' }}>
              <Zap size={14} style={{ color: '#0f172a' }} />
            </div>
            <span className="text-xs font-bold hidden sm:block gradient-text">LC Tracker</span>
          </NavLink>

          {/* Project Selector */}
          <div className="hidden md:flex items-center gap-1 mr-2">
            <select
              value={currentProjectId}
              onChange={e => switchProject(e.target.value)}
              className="text-[11px] px-2 py-1 rounded bg-transparent border-none outline-none cursor-pointer max-w-[200px] truncate"
              style={{ color: '#22d3ee', background: 'rgba(34,211,238,0.08)' }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <NavLink
              to="/projects"
              className="p-1 rounded hover:bg-white/5 transition-colors"
              title="Manage projects"
            >
              <FolderOpen size={12} style={{ color: '#64748b' }} />
            </NavLink>
          </div>

          <div className="flex-1 flex items-center gap-0.5 overflow-x-auto no-scrollbar">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }: { isActive: boolean }) => {
                  const base = 'flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap';
                  return isActive
                    ? base + ' text-cyan-400 bg-cyan-400/10'
                    : base + ' text-slate-400 hover:text-slate-200 hover:bg-white/5';
                }}
              >
                <item.icon size={13} />
                <span className="hidden md:inline">{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <GlobalSearch />
            <NotificationBell />
            <ThemeToggle />
            <div
              className="hidden sm:flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                background: localOnly ? 'rgba(245,158,11,0.15)' : cloudConnected ? 'rgba(34,211,238,0.15)' : 'rgba(100,116,139,0.15)',
                color: localOnly ? '#f59e0b' : cloudConnected ? '#22d3ee' : '#64748b',
              }}
            >
              {localOnly ? <CloudOff size={10} /> : cloudConnected ? <Cloud size={10} /> : <CloudOff size={10} />}
              <span>{localOnly ? 'Local' : cloudConnected ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-3 py-4">
        <Outlet />
      </main>
    </div>
  );
}
