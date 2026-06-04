const PREFIX = 'ct-';

function key(projectId: string | null, name: string): string {
  if (projectId) return `${PREFIX}project-${projectId}-${name}`;
  return `${PREFIX}${name}`;
}

export function load<T>(projectId: string | null, name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key(projectId, name));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(projectId: string | null, name: string, value: T): void {
  localStorage.setItem(key(projectId, name), JSON.stringify(value));
}

export function remove(projectId: string | null, name: string): void {
  localStorage.removeItem(key(projectId, name));
}

export function removeProject(projectId: string): void {
  const keys = Object.keys(localStorage);
  const projectPrefix = `${PREFIX}project-${projectId}-`;
  keys.filter(k => k.startsWith(projectPrefix)).forEach(k => localStorage.removeItem(k));
}

export function clearAll(): void {
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .forEach(k => localStorage.removeItem(k));
}

// Legacy migration helpers (project-less keys)
export function loadLegacy<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${PREFIX}${name}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function removeLegacy(name: string): void {
  localStorage.removeItem(`${PREFIX}${name}`);
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
