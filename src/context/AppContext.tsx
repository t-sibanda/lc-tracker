import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type {
  Task, Equipment, Issue, Checklist, Owner, Phase, Photo,
  ActivityEntry, RevisionSnapshot, Notification, Project, AppState,
  Comment, InventoryItem, ProjectMeta, IOPoint,
} from '@/types';
import { load, save, removeProject, loadLegacy, removeLegacy } from '@/lib/storage';
import {
  isSupabaseConfigured, syncTasksToCloud, syncEquipmentToCloud,
  syncIssuesToCloud, syncChecklistsToCloud, downloadFromCloud,
} from '@/lib/supabase';
import {
  defaultProject as seedProject, defaultOwners, defaultPhases, projectTasks,
  zoneTaskTemplates, preInstallTaskTemplates, generateDefaultEquipment,
  defaultIssues, defaultChecklists, defaultInventory, defaultPhotos,
} from '@/data/seed';

interface AppContextType extends AppState {
  // Project management
  switchProject: (id: string) => void;
  createProject: (meta: Partial<ProjectMeta>) => string;
  deleteProject: (id: string) => void;
  updateProjectInfo: (p: Partial<Project>) => void;
  // Tasks
  addTask: (task: Omit<Task, 'id' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addComment: (taskId: string, comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  deleteComment: (taskId: string, commentId: string) => void;
  // Equipment
  addEquipment: (eq: Omit<Equipment, 'id' | 'updatedAt'>) => void;
  updateEquipment: (id: string, updates: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;
  // Issues
  addIssue: (issue: Omit<Issue, 'id' | 'updatedAt'>) => void;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;
  // Checklists
  addChecklist: (cl: Omit<Checklist, 'id' | 'updatedAt'>) => void;
  updateChecklist: (id: string, updates: Partial<Checklist>) => void;
  deleteChecklist: (id: string) => void;
  // Owners
  addOwner: (owner: Omit<Owner, 'id'>) => void;
  updateOwner: (id: string, updates: Partial<Owner>) => void;
  deleteOwner: (id: string) => void;
  // Phases
  addPhase: (phase: Omit<Phase, 'id'>) => void;
  updatePhase: (id: string, updates: Partial<Phase>) => void;
  deletePhase: (id: string) => void;
  // Photos / Media
  addPhoto: (photo: Omit<Photo, 'id' | 'uploadedAt'>) => void;
  deletePhoto: (id: string) => void;
  // Inventory
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  // I/O Points
  addIO: (io: IOPoint) => void;
  updateIO: (id: string, updates: Partial<IOPoint>) => void;
  deleteIO: (id: string) => void;
  clearIO: () => void;
  // Notifications
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  // Revisions
  takeSnapshot: (label: string) => void;
  restoreSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;
  // Sync
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
  // Local only
  setLocalOnly: (v: boolean) => void;
  // Reset
  resetAllData: () => void;
  // Import
  importData: (data: Partial<AppState>) => void;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp'>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

let nextId = 1;
function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${(nextId++).toString(36)}`;
}
function now(): string { return new Date().toISOString(); }

function makeProjectMeta(project: Project): ProjectMeta {
  return {
    id: project.id, name: project.name, number: project.number,
    description: project.description, client: project.client,
    cxManager: project.cxManager, createdAt: now(), updatedAt: now(),
    taskCount: projectTasks.length + preInstallTaskTemplates.length + zoneTaskTemplates.length,
  };
}

function seedTasks(): Task[] {
  const tasks: Task[] = [];
  projectTasks.forEach(t => tasks.push({ ...t, id: uid('task'), updatedAt: now(), comments: [] }));
  preInstallTaskTemplates.forEach(t => tasks.push({ ...t, id: uid('task'), updatedAt: now(), comments: [] }));
  zoneTaskTemplates.forEach(t => tasks.push({ ...t, id: uid('task'), updatedAt: now(), comments: [] }));
  return tasks;
}

function seedProjectData(projectId: string) {
  save(projectId, 'project', seedProject);
  save(projectId, 'tasks', seedTasks());
  save(projectId, 'equipment', generateDefaultEquipment());
  save(projectId, 'issues', defaultIssues);
  save(projectId, 'checklists', defaultChecklists);
  save(projectId, 'photos', defaultPhotos);
  save(projectId, 'inventory', defaultInventory);
  save(projectId, 'ioPoints', []);
  save(projectId, 'owners', defaultOwners);
  save(projectId, 'phases', defaultPhases);
  save(projectId, 'activity', []);
  save(projectId, 'revisions', []);
  save(projectId, 'notifications', []);
}

function loadProjectState(projectId: string): Omit<AppState, 'projects' | 'currentProjectId' | 'cloudConnected' | 'syncing' | 'localOnly'> {
  return {
    project: load<Project>(projectId, 'project', seedProject),
    tasks: load<Task[]>(projectId, 'tasks', seedTasks()),
    equipment: load<Equipment[]>(projectId, 'equipment', generateDefaultEquipment()),
    issues: load<Issue[]>(projectId, 'issues', defaultIssues),
    checklists: load<Checklist[]>(projectId, 'checklists', defaultChecklists),
    photos: load<Photo[]>(projectId, 'photos', defaultPhotos),
    inventory: load<InventoryItem[]>(projectId, 'inventory', defaultInventory),
    ioPoints: load<IOPoint[]>(projectId, 'ioPoints', []),
    owners: load<Owner[]>(projectId, 'owners', defaultOwners),
    phases: load<Phase[]>(projectId, 'phases', defaultPhases),
    activity: load<ActivityEntry[]>(projectId, 'activity', []),
    revisions: load<RevisionSnapshot[]>(projectId, 'revisions', []),
    notifications: load<Notification[]>(projectId, 'notifications', []),
  };
}

function migrateLegacyData(): { projectId: string; meta: ProjectMeta } | null {
  const legacyTasks = loadLegacy<Task[]>('tasks', []);
  if (legacyTasks.length === 0) return null;

  const projectId = uid('proj');
  const project: Project = { ...seedProject, id: projectId };

  save(projectId, 'project', project);
  save(projectId, 'tasks', legacyTasks);
  save(projectId, 'equipment', loadLegacy<Equipment[]>('equipment', generateDefaultEquipment()));
  save(projectId, 'issues', loadLegacy<Issue[]>('issues', defaultIssues));
  save(projectId, 'checklists', loadLegacy<Checklist[]>('checklists', defaultChecklists));
  save(projectId, 'photos', loadLegacy<Photo[]>('photos', defaultPhotos));
  save(projectId, 'inventory', loadLegacy<InventoryItem[]>('inventory', defaultInventory));
  save(projectId, 'owners', loadLegacy<Owner[]>('owners', defaultOwners));
  save(projectId, 'phases', loadLegacy<Phase[]>('phases', defaultPhases));
  save(projectId, 'activity', loadLegacy<ActivityEntry[]>('activity', []));
  save(projectId, 'revisions', loadLegacy<RevisionSnapshot[]>('revisions', []));
  save(projectId, 'notifications', loadLegacy<Notification[]>('notifications', []));

  ['tasks', 'equipment', 'issues', 'checklists', 'photos', 'inventory',
   'owners', 'phases', 'activity', 'revisions', 'notifications',
   'project'].forEach(removeLegacy);

  const meta = makeProjectMeta(project);
  return { projectId, meta };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    const saved = load<string>(null, 'current-project', '');
    if (saved) return saved;

    // Check for legacy data
    const migrated = migrateLegacyData();
    if (migrated) {
      save(null, 'projects-list', [migrated.meta]);
      save(null, 'current-project', migrated.projectId);
      return migrated.projectId;
    }

    // Fresh start — create first project
    const projectId = uid('proj');
    const project: Project = { ...seedProject, id: projectId };
    seedProjectData(projectId);
    const meta = makeProjectMeta(project);
    save(null, 'projects-list', [meta]);
    save(null, 'current-project', projectId);
    return projectId;
  });

  const [projects, setProjects] = useState<ProjectMeta[]>(() =>
    load<ProjectMeta[]>(null, 'projects-list', [])
  );

  const [state, setState] = useState<Omit<AppState, 'projects' | 'currentProjectId' | 'cloudConnected' | 'syncing' | 'localOnly'>>(() =>
    loadProjectState(currentProjectId)
  );

  const [cloudConnected, setCloudConnected] = useState(isSupabaseConfigured());
  const [syncing, setSyncing] = useState(false);
  const [localOnly, setLocalOnly] = useState(() => load<boolean>(null, 'local-only', false));
  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist current project data
  useEffect(() => { save(currentProjectId, 'project', state.project); }, [currentProjectId, state.project]);
  useEffect(() => { save(currentProjectId, 'tasks', state.tasks); }, [currentProjectId, state.tasks]);
  useEffect(() => { save(currentProjectId, 'equipment', state.equipment); }, [currentProjectId, state.equipment]);
  useEffect(() => { save(currentProjectId, 'issues', state.issues); }, [currentProjectId, state.issues]);
  useEffect(() => { save(currentProjectId, 'checklists', state.checklists); }, [currentProjectId, state.checklists]);
  useEffect(() => { save(currentProjectId, 'photos', state.photos); }, [currentProjectId, state.photos]);
  useEffect(() => { save(currentProjectId, 'inventory', state.inventory); }, [currentProjectId, state.inventory]);
  useEffect(() => { save(currentProjectId, 'ioPoints', state.ioPoints); }, [currentProjectId, state.ioPoints]);
  useEffect(() => { save(currentProjectId, 'owners', state.owners); }, [currentProjectId, state.owners]);
  useEffect(() => { save(currentProjectId, 'phases', state.phases); }, [currentProjectId, state.phases]);
  useEffect(() => { save(currentProjectId, 'activity', state.activity); }, [currentProjectId, state.activity]);
  useEffect(() => { save(currentProjectId, 'revisions', state.revisions); }, [currentProjectId, state.revisions]);
  useEffect(() => { save(currentProjectId, 'notifications', state.notifications); }, [currentProjectId, state.notifications]);

  useEffect(() => { save(null, 'projects-list', projects); }, [projects]);
  useEffect(() => { save(null, 'current-project', currentProjectId); }, [currentProjectId]);
  useEffect(() => { save(null, 'local-only', localOnly); }, [localOnly]);

  useEffect(() => { setCloudConnected(isSupabaseConfigured() && !localOnly); }, [localOnly]);

  useEffect(() => {
    if (autosaveRef.current) clearInterval(autosaveRef.current);
    if (cloudConnected && !localOnly) {
      autosaveRef.current = setInterval(() => { syncToCloud(); }, 60000);
    }
    return () => { if (autosaveRef.current) clearInterval(autosaveRef.current); };
  }, [cloudConnected, localOnly]);

  useEffect(() => {
    const interval = setInterval(() => { takeSnapshot('Auto - Hourly'); }, 3600000);
    return () => clearInterval(interval);
  }, [currentProjectId]);

  const logActivity = useCallback((entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => {
    const newEntry: ActivityEntry = { ...entry, id: uid('act'), timestamp: now() };
    setState(prev => ({ ...prev, activity: [newEntry, ...prev.activity].slice(0, 500) }));
  }, []);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp'>) => {
    const notif: Notification = { ...n, id: uid('notif'), timestamp: now() };
    setState(prev => ({ ...prev, notifications: [notif, ...prev.notifications].slice(0, 50) }));
  }, []);

  // Project management
  const switchProject = useCallback((id: string) => {
    setCurrentProjectId(id);
    setState(loadProjectState(id));
  }, []);

  const createProject = useCallback((meta: Partial<ProjectMeta>) => {
    const projectId = uid('proj');
    const project: Project = {
      ...seedProject,
      id: projectId,
      name: meta.name || `Project ${projects.length + 1}`,
      number: meta.number || '',
      description: meta.description || '',
      client: meta.client || '',
      cxManager: meta.cxManager || '',
    };
    seedProjectData(projectId);
    save(projectId, 'project', project);
    const newMeta = makeProjectMeta(project);
    setProjects(prev => [...prev, newMeta]);
    logActivity({ action: 'create', entityType: 'project', entityId: projectId, details: `Created project: ${project.name}`, user: 'User' });
    return projectId;
  }, [projects.length, logActivity]);

  const deleteProject = useCallback((id: string) => {
    if (projects.length <= 1) {
      addNotification({ title: 'Cannot Delete', message: 'You must have at least one project', type: 'warning', read: false });
      return;
    }
    removeProject(id);
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id);
      if (currentProjectId === id) {
        const newId = next[0].id;
        setCurrentProjectId(newId);
        setState(loadProjectState(newId));
      }
      return next;
    });
    logActivity({ action: 'delete', entityType: 'project', entityId: id, details: `Deleted project`, user: 'User' });
  }, [projects.length, currentProjectId, logActivity, addNotification]);

  const updateProjectInfo = useCallback((p: Partial<Project>) => {
    setState(prev => {
      const updated = { ...prev.project, ...p, updatedAt: now() };
      return { ...prev, project: updated };
    });
    setProjects(prev => prev.map(m => m.id === currentProjectId ? { ...m, name: p.name || m.name, number: p.number || m.number, updatedAt: now() } : m));
    logActivity({ action: 'update', entityType: 'project', entityId: currentProjectId, details: 'Updated project info', user: 'User' });
  }, [currentProjectId, logActivity]);

  const takeSnapshot = useCallback((label: string) => {
    const snapshot: RevisionSnapshot = {
      id: uid('rev'), timestamp: now(), label,
      tasks: JSON.parse(JSON.stringify(state.tasks)),
      equipment: JSON.parse(JSON.stringify(state.equipment)),
      issues: JSON.parse(JSON.stringify(state.issues)),
      checklists: JSON.parse(JSON.stringify(state.checklists)),
      photos: JSON.parse(JSON.stringify(state.photos)),
      inventory: JSON.parse(JSON.stringify(state.inventory)),
    };
    setState(prev => ({ ...prev, revisions: [snapshot, ...prev.revisions].slice(0, 20) }));
  }, [state]);

  const restoreSnapshot = useCallback((id: string) => {
    const snapshot = state.revisions.find(r => r.id === id);
    if (!snapshot) return;
    setState(prev => ({
      ...prev,
      tasks: snapshot.tasks,
      equipment: snapshot.equipment,
      issues: snapshot.issues,
      checklists: snapshot.checklists,
      photos: snapshot.photos,
      inventory: snapshot.inventory,
    }));
    logActivity({ action: 'reset', entityType: 'project', entityId: 'all', details: `Restored revision: ${snapshot.label}`, user: 'System' });
  }, [state.revisions, logActivity]);

  const deleteSnapshot = useCallback((id: string) => {
    setState(prev => ({ ...prev, revisions: prev.revisions.filter(r => r.id !== id) }));
  }, []);

  // Task CRUD
  const addTask = useCallback((task: Omit<Task, 'id' | 'updatedAt'>) => {
    const newTask: Task = { ...task, id: uid('task'), updatedAt: now(), comments: [] };
    setState(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    logActivity({ action: 'create', entityType: 'task', entityId: newTask.id, details: `Created task: ${newTask.description}`, user: 'User' });
    if (!localOnly && cloudConnected) syncTasksToCloud([newTask]);
  }, [logActivity, localOnly, cloudConnected]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: now() } : t) }));
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      logActivity({ action: 'update', entityType: 'task', entityId: id, details: `Updated task: ${task.description}`, user: 'User' });
      if (!localOnly && cloudConnected) syncTasksToCloud([{ ...task, ...updates, updatedAt: now() }]);
    }
  }, [state.tasks, logActivity, localOnly, cloudConnected]);

  const deleteTask = useCallback((id: string) => {
    const task = state.tasks.find(t => t.id === id);
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
    if (task) logActivity({ action: 'delete', entityType: 'task', entityId: id, details: `Deleted task: ${task.description}`, user: 'User' });
  }, [state.tasks, logActivity]);

  const addComment = useCallback((taskId: string, comment: Omit<Comment, 'id' | 'timestamp'>) => {
    const newComment: Comment = { ...comment, id: uid('comment'), timestamp: now() };
    setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, comments: [...t.comments, newComment], updatedAt: now() } : t) }));
    logActivity({ action: 'update', entityType: 'task', entityId: taskId, details: `Added comment`, user: comment.author || 'User' });
  }, [logActivity]);

  const deleteComment = useCallback((taskId: string, commentId: string) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, comments: t.comments.filter(c => c.id !== commentId), updatedAt: now() } : t) }));
  }, []);

  // Equipment CRUD
  const addEquipment = useCallback((eq: Omit<Equipment, 'id' | 'updatedAt'>) => {
    const newEq: Equipment = { ...eq, id: uid('eq'), updatedAt: now() };
    setState(prev => ({ ...prev, equipment: [...prev.equipment, newEq] }));
    logActivity({ action: 'create', entityType: 'equipment', entityId: newEq.id, details: `Added equipment: ${newEq.name}`, user: 'User' });
    if (!localOnly && cloudConnected) syncEquipmentToCloud([newEq]);
  }, [logActivity, localOnly, cloudConnected]);

  const updateEquipment = useCallback((id: string, updates: Partial<Equipment>) => {
    setState(prev => ({ ...prev, equipment: prev.equipment.map(e => e.id === id ? { ...e, ...updates, updatedAt: now() } : e) }));
    const eq = state.equipment.find(e => e.id === id);
    if (eq) {
      logActivity({ action: 'update', entityType: 'equipment', entityId: id, details: `Updated equipment: ${eq.name}`, user: 'User' });
      if (!localOnly && cloudConnected) syncEquipmentToCloud([{ ...eq, ...updates, updatedAt: now() }]);
    }
  }, [state.equipment, logActivity, localOnly, cloudConnected]);

  const deleteEquipment = useCallback((id: string) => {
    const eq = state.equipment.find(e => e.id === id);
    setState(prev => ({ ...prev, equipment: prev.equipment.filter(e => e.id !== id) }));
    if (eq) logActivity({ action: 'delete', entityType: 'equipment', entityId: id, details: `Deleted equipment: ${eq.name}`, user: 'User' });
  }, [state.equipment, logActivity]);

  // Issue CRUD
  const addIssue = useCallback((issue: Omit<Issue, 'id' | 'updatedAt'>) => {
    const newIssue: Issue = { ...issue, id: uid('iss'), updatedAt: now() };
    setState(prev => ({ ...prev, issues: [...prev.issues, newIssue] }));
    logActivity({ action: 'create', entityType: 'issue', entityId: newIssue.id, details: `Logged issue: ${newIssue.title}`, user: 'User' });
    addNotification({ title: 'New Issue', message: newIssue.title, type: 'warning', read: false });
    if (!localOnly && cloudConnected) syncIssuesToCloud([newIssue]);
  }, [logActivity, addNotification, localOnly, cloudConnected]);

  const updateIssue = useCallback((id: string, updates: Partial<Issue>) => {
    setState(prev => ({ ...prev, issues: prev.issues.map(i => i.id === id ? { ...i, ...updates, updatedAt: now() } : i) }));
    const iss = state.issues.find(i => i.id === id);
    if (iss) {
      logActivity({ action: 'update', entityType: 'issue', entityId: id, details: `Updated issue: ${iss.title}`, user: 'User' });
      if (!localOnly && cloudConnected) syncIssuesToCloud([{ ...iss, ...updates, updatedAt: now() }]);
    }
  }, [state.issues, logActivity, localOnly, cloudConnected]);

  const deleteIssue = useCallback((id: string) => {
    const iss = state.issues.find(i => i.id === id);
    setState(prev => ({ ...prev, issues: prev.issues.filter(i => i.id !== id) }));
    if (iss) logActivity({ action: 'delete', entityType: 'issue', entityId: id, details: `Deleted issue: ${iss.title}`, user: 'User' });
  }, [state.issues, logActivity]);

  // Checklist CRUD
  const addChecklist = useCallback((cl: Omit<Checklist, 'id' | 'updatedAt'>) => {
    const newCl: Checklist = { ...cl, id: uid('cl'), updatedAt: now() };
    setState(prev => ({ ...prev, checklists: [...prev.checklists, newCl] }));
    logActivity({ action: 'create', entityType: 'checklist', entityId: newCl.id, details: `Created checklist: ${newCl.title}`, user: 'User' });
    if (!localOnly && cloudConnected) syncChecklistsToCloud([newCl]);
  }, [logActivity, localOnly, cloudConnected]);

  const updateChecklist = useCallback((id: string, updates: Partial<Checklist>) => {
    setState(prev => ({ ...prev, checklists: prev.checklists.map(c => c.id === id ? { ...c, ...updates, updatedAt: now() } : c) }));
    const cl = state.checklists.find(c => c.id === id);
    if (cl) {
      logActivity({ action: 'update', entityType: 'checklist', entityId: id, details: `Updated checklist: ${cl.title}`, user: 'User' });
      if (!localOnly && cloudConnected) syncChecklistsToCloud([{ ...cl, ...updates, updatedAt: now() }]);
    }
  }, [state.checklists, logActivity, localOnly, cloudConnected]);

  const deleteChecklist = useCallback((id: string) => {
    const cl = state.checklists.find(c => c.id === id);
    setState(prev => ({ ...prev, checklists: prev.checklists.filter(c => c.id !== id) }));
    if (cl) logActivity({ action: 'delete', entityType: 'checklist', entityId: id, details: `Deleted checklist: ${cl.title}`, user: 'User' });
  }, [state.checklists, logActivity]);

  // Owner CRUD
  const addOwner = useCallback((owner: Omit<Owner, 'id'>) => {
    const newOwner: Owner = { ...owner, id: uid('owner') };
    setState(prev => ({ ...prev, owners: [...prev.owners, newOwner] }));
    logActivity({ action: 'create', entityType: 'owner', entityId: newOwner.id, details: `Added team member: ${newOwner.name}`, user: 'User' });
  }, [logActivity]);

  const updateOwner = useCallback((id: string, updates: Partial<Owner>) => {
    setState(prev => {
      const owner = prev.owners.find(o => o.id === id);
      const nextOwners = prev.owners.map(o => o.id === id ? { ...o, ...updates } : o);
      let nextTasks = prev.tasks;
      if (owner && updates.name && updates.name !== owner.name) {
        nextTasks = prev.tasks.map(t => t.owner === owner.name ? { ...t, owner: updates.name!, updatedAt: now() } : t);
      }
      return { ...prev, owners: nextOwners, tasks: nextTasks };
    });
    logActivity({ action: 'update', entityType: 'owner', entityId: id, details: `Updated team member`, user: 'User' });
  }, [logActivity]);

  const deleteOwner = useCallback((id: string) => {
    const owner = state.owners.find(o => o.id === id);
    setState(prev => ({ ...prev, owners: prev.owners.filter(o => o.id !== id) }));
    if (owner) logActivity({ action: 'delete', entityType: 'owner', entityId: id, details: `Removed team member: ${owner.name}`, user: 'User' });
  }, [state.owners, logActivity]);

  // Phase CRUD
  const addPhase = useCallback((phase: Omit<Phase, 'id'>) => {
    const newPhase: Phase = { ...phase, id: uid('phase') };
    setState(prev => ({ ...prev, phases: [...prev.phases, newPhase] }));
    logActivity({ action: 'create', entityType: 'phase', entityId: newPhase.id, details: `Added phase: ${newPhase.name}`, user: 'User' });
  }, [logActivity]);

  const updatePhase = useCallback((id: string, updates: Partial<Phase>) => {
    setState(prev => ({ ...prev, phases: prev.phases.map(p => p.id === id ? { ...p, ...updates } : p) }));
    const phase = state.phases.find(p => p.id === id);
    logActivity({ action: 'update', entityType: 'phase', entityId: id, details: `Updated phase: ${phase?.name}`, user: 'User' });
  }, [state.phases, logActivity]);

  const deletePhase = useCallback((id: string) => {
    const phase = state.phases.find(p => p.id === id);
    setState(prev => ({ ...prev, phases: prev.phases.filter(p => p.id !== id) }));
    if (phase) logActivity({ action: 'delete', entityType: 'phase', entityId: id, details: `Deleted phase: ${phase.name}`, user: 'User' });
  }, [state.phases, logActivity]);

  // Photo CRUD
  const addPhoto = useCallback((photo: Omit<Photo, 'id' | 'uploadedAt'>) => {
    const newPhoto: Photo = { ...photo, id: uid('photo'), uploadedAt: now() };
    setState(prev => ({ ...prev, photos: [...prev.photos, newPhoto] }));
    logActivity({ action: 'create', entityType: 'media', entityId: newPhoto.id, details: `Added photo: ${newPhoto.caption}`, user: photo.uploadedBy || 'User' });
  }, [logActivity]);

  const deletePhoto = useCallback((id: string) => {
    setState(prev => ({ ...prev, photos: prev.photos.filter(p => p.id !== id) }));
  }, []);

  // Inventory CRUD
  const addInventoryItem = useCallback((item: Omit<InventoryItem, 'id' | 'updatedAt'>) => {
    const newItem: InventoryItem = { ...item, id: uid('inv'), updatedAt: now() };
    setState(prev => ({ ...prev, inventory: [...prev.inventory, newItem] }));
    logActivity({ action: 'create', entityType: 'inventory', entityId: newItem.id, details: `Added inventory: ${newItem.name}`, user: 'User' });
    addNotification({ title: 'Inventory Added', message: `${newItem.name} - ${newItem.status}`, type: 'info', read: false });
  }, [logActivity, addNotification]);

  const updateInventoryItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setState(prev => ({ ...prev, inventory: prev.inventory.map(i => i.id === id ? { ...i, ...updates, updatedAt: now() } : i) }));
    const item = state.inventory.find(i => i.id === id);
    if (item) logActivity({ action: 'update', entityType: 'inventory', entityId: id, details: `Updated inventory: ${item.name}`, user: 'User' });
  }, [state.inventory, logActivity]);

  const deleteInventoryItem = useCallback((id: string) => {
    const item = state.inventory.find(i => i.id === id);
    setState(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== id) }));
    if (item) logActivity({ action: 'delete', entityType: 'inventory', entityId: id, details: `Deleted inventory: ${item.name}`, user: 'User' });
  }, [state.inventory, logActivity]);

  // I/O Points CRUD
  const addIO = useCallback((io: IOPoint) => {
    setState(prev => ({ ...prev, ioPoints: [...prev.ioPoints, io] }));
  }, []);

  const updateIO = useCallback((id: string, updates: Partial<IOPoint>) => {
    setState(prev => ({ ...prev, ioPoints: prev.ioPoints.map(p => p.id === id ? { ...p, ...updates } : p) }));
  }, []);

  const deleteIO = useCallback((id: string) => {
    setState(prev => ({ ...prev, ioPoints: prev.ioPoints.filter(p => p.id !== id) }));
  }, []);

  const clearIO = useCallback(() => {
    setState(prev => ({ ...prev, ioPoints: [] }));
  }, []);

  // Notifications
  const markNotificationRead = useCallback((id: string) => {
    setState(prev => ({ ...prev, notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [] }));
  }, []);

  // Sync
  const syncToCloud = useCallback(async () => {
    if (localOnly || !isSupabaseConfigured()) return;
    setSyncing(true);
    await syncTasksToCloud(state.tasks);
    await syncEquipmentToCloud(state.equipment);
    await syncIssuesToCloud(state.issues);
    await syncChecklistsToCloud(state.checklists);
    setSyncing(false);
    addNotification({ title: 'Sync Complete', message: 'Data uploaded to cloud', type: 'success', read: false });
  }, [state, localOnly, addNotification]);

  const syncFromCloud = useCallback(async () => {
    setSyncing(true);
    const { data: tData } = await downloadFromCloud('tasks');
    if (tData) setState(prev => ({ ...prev, tasks: tData as Task[] }));
    const { data: eData } = await downloadFromCloud('equipment');
    if (eData) setState(prev => ({ ...prev, equipment: eData as Equipment[] }));
    const { data: iData } = await downloadFromCloud('issues');
    if (iData) setState(prev => ({ ...prev, issues: iData as Issue[] }));
    const { data: cData } = await downloadFromCloud('checklists');
    if (cData) setState(prev => ({ ...prev, checklists: cData as Checklist[] }));
    setSyncing(false);
    addNotification({ title: 'Download Complete', message: 'Data synced from cloud', type: 'success', read: false });
  }, [addNotification]);

  const resetAllData = useCallback(() => {
    removeProject(currentProjectId);
    seedProjectData(currentProjectId);
    setState(loadProjectState(currentProjectId));
  }, [currentProjectId]);

  const importData = useCallback((data: Partial<AppState>) => {
    setState(prev => ({
      ...prev,
      tasks: data.tasks || prev.tasks,
      equipment: data.equipment || prev.equipment,
      issues: data.issues || prev.issues,
      checklists: data.checklists || prev.checklists,
      photos: data.photos || prev.photos,
      inventory: data.inventory || prev.inventory,
      owners: data.owners || prev.owners,
      phases: data.phases || prev.phases,
    }));
    logActivity({ action: 'import', entityType: 'project', entityId: 'all', details: 'Imported data from file', user: 'User' });
  }, [logActivity]);

  const value: AppContextType = {
    ...state,
    projects,
    currentProjectId,
    cloudConnected,
    syncing,
    localOnly,
    switchProject,
    createProject,
    deleteProject,
    updateProjectInfo,
    addTask, updateTask, deleteTask, addComment, deleteComment,
    addEquipment, updateEquipment, deleteEquipment,
    addIssue, updateIssue, deleteIssue,
    addChecklist, updateChecklist, deleteChecklist,
    addOwner, updateOwner, deleteOwner,
    addPhase, updatePhase, deletePhase,
    addPhoto, deletePhoto,
    addInventoryItem, updateInventoryItem, deleteInventoryItem,
    addIO, updateIO, deleteIO, clearIO,
    markNotificationRead, clearAllNotifications,
    takeSnapshot, restoreSnapshot, deleteSnapshot,
    syncToCloud, syncFromCloud,
    setLocalOnly,
    resetAllData,
    importData,
    addNotification,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
