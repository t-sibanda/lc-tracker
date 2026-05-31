import { Bell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

export default function NotificationBell() {
  const { notifications, markNotificationRead, clearAllNotifications } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-1.5 rounded-lg transition-colors hover:bg-white/5">
        <Bell size={14} style={{ color: '#94a3b8' }} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center" style={{ background: '#ef4444', color: '#fff' }}>
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden" style={{ background: '#0f172a', border: '1px solid rgba(34,211,238,0.2)' }}>
          <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
            <span className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>Notifications</span>
            <button onClick={clearAllNotifications} className="text-[10px] hover:text-cyan-400 transition-colors" style={{ color: '#64748b' }}>Clear all</button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 && (
              <div className="px-3 py-4 text-center text-[11px]" style={{ color: '#64748b' }}>No notifications</div>
            )}
            {notifications.map(n => (
              <button
                key={n.id}
                className="flex flex-col w-full px-3 py-2 text-left transition-colors hover:bg-white/5"
                style={{ borderBottom: '1px solid rgba(51,65,85,0.3)', opacity: n.read ? 0.6 : 1 }}
                onClick={() => markNotificationRead(n.id)}
              >
                <span className="text-[11px] font-medium" style={{ color: '#e2e8f0' }}>{n.title}</span>
                <span className="text-[10px] truncate" style={{ color: '#64748b' }}>{n.message}</span>
                <span className="text-[9px] mt-0.5" style={{ color: '#475569' }}>{new Date(n.timestamp).toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
