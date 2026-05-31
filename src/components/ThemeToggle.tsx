import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem('ct-theme') !== 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !dark);
    localStorage.setItem('ct-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark(!dark)}
      className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun size={14} style={{ color: '#f59e0b' }} /> : <Moon size={14} style={{ color: '#64748b' }} />}
    </button>
  );
}
