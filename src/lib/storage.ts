const PREFIX = 'ct-';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
}

export function remove(key: string): void {
  localStorage.removeItem(`${PREFIX}${key}`);
}

export function clearAll(): void {
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .forEach(k => localStorage.removeItem(k));
}

export function exportAll(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .forEach(k => {
      try {
        data[k] = JSON.parse(localStorage.getItem(k) || '{}');
      } catch {
        data[k] = localStorage.getItem(k);
      }
    });
  return data;
}
