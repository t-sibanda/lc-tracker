import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type {
  Task, Equipment, Issue, Checklist, Owner, Phase, Photo,
  ActivityEntry, RevisionSnapshot, Notification, Project, AppState,
  Comment, InventoryItem,
} from '@/types';
import { load, save, remove } from '@/lib/storage';
import {
  isSupabaseConfigured, syncTasksToCloud, syncEquipmentToCloud,
  syncIssuesToCloud, syncChecklistsToCloud, downloadFromCloud,
} from '@/lib/supabase';
import {
  defaultProject, defaultOwners, defaultPhases, projectTasks,
  zoneTaskTemplates, preInstallTaskTemplates, generateDefaultEquipment,
  defaultIssues, defaultChecklists, defaultInventory, defaultPhotos,
} from '@/data/seed';

interface AppContextType extends AppState {
  // Project
  updateProject: (p: Partial<Project>) => void;
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
  // Notifications
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  // Activity
  activity: ActivityEntry[];
  // Revisions
  revisions: RevisionSnapshot[];
  takeSnapshot: (label: string) => void;
  restoreSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;
  // Sync
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
  cloudConnected: boolean;
  syncing: boolean;
  // Local only
  localOnly: boolean;
  setLocalOnly: (v: boolean) => void;
  // Reset
  resetAllData: () => void;
  // Import
  importData: (data: Partial<AppState>) => void;
  // Utils
  addNotification: (n: Omit<Notification, 'id' | 'timestamp'>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

let nextId = 1;
function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${(nextId++).toString(36)}`;
}

function now(): string {
  return new Date().toISOString();
}

function loadInitialTasks(): Task[] {
  let saved = load<Task[]>('tasks', []);

  // Migration: inject pre-install tasks if missing from existing data
  const hasPreInstall = saved.some(t => t.scope === 'pre-install');
  if (!hasPreInstall) {
    preInstallTaskTemplates.forEach((t) => {
      saved.push({ ...t, id: uid('task'), updatedAt: now(), comments: [] });
    });
  }

  // Fresh load: no saved data at all
  if (saved.length === 0) {
    projectTasks.forEach((t) => {
      saved.push({ ...t, id: uid('task'), updatedAt: now(), comments: [] });
    });
    preInstallTaskTemplates.forEach((t) => {
      saved.push({ ...t, id: uid('task'), updatedAt: now(), comments: [] });
    });
    zoneTaskTemplates.forEach((t) => {
      saved.push({ ...t, id: uid('task'), updatedAt: now(), comments: [] });
    });
  }

  return saved;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project>(() => load<Project>('project', defaultProject));
  const [tasks, setTasks] = useState<Task[]>(loadInitialTasks);
  const [equipment, setEquipment] = useState<Equipment[]>(() => load<Equipment[]>('equipment', generateDefaultEquipment()));
  const [issues, setIssues] = useState<Issue[]>(() => load<Issue[]>('issues', defaultIssues));
  const [checklists, setChecklists] = useState<Checklist[]>(() => load<Checklist[]>('checklists', defaultChecklists));
  const [photos, setPhotos] = useState<Photo[]>(() => load<Photo[]>('photos', defaultPhotos));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => load<InventoryItem[]>('inventory', defaultInventory));
  const [owners, setOwners] = useState<Owner[]>(() => load<Owner[]>('owners', defaultOwners));
  const [phases, setPhases] = useState<Phase[]>(() => load<Phase[]>('phases', defaultPhases));
  const [activity, setActivity] = useState<ActivityEntry[]>(() => load<ActivityEntry[]>('activity', []));
  const [revisions, setRevisions] = useState<RevisionSnapshot[]>(() => load<RevisionSnapshot[]>('revisions', []));
  const [notifications, setNotifications] = useState<Notification[]>(() => load<Notification[]>('notifications', []));
  const [cloudConnected, setCloudConnected] = useState(isSupabaseConfigured());
  const [syncing, setSyncing] = useState(false);
  const [localOnly, setLocalOnly] = useState(() => load<boolean>('local-only', false));
  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist to localStorage
  useEffect(() => { save('project', project); }, [project]);
  useEffect(() => { save('tasks', tasks); }, [tasks]);
  useEffect(() => { save('equipment', equipment); }, [equipment]);
  useEffect(() => { save('issues', issues); }, [issues]);
  useEffect(() => { save('checklists', checklists); }, [checklists]);
  useEffect(() => { save('photos', photos); }, [photos]);
  useEffect(() => { save('inventory', inventory); }, [inventory]);
  useEffect(() => { save('owners', owners); }, [owners]);
  useEffect(() => { save('phases', phases); }, [phases]);
  useEffect(() => { save('activity', activity); }, [activity]);
  useEffect(() => { save('revisions', revisions); }, [revisions]);
  useEffect(() => { save('local-only', localOnly); }, [localOnly]);
  useEffect(() => { save('notifications', notifications); }, [notifications]);

  // Check cloud connection
  useEffect(() => {
    setCloudConnected(isSupabaseConfigured() && !localOnly);
  }, [localOnly]);

  // Auto-save to cloud
  useEffect(() => {
    if (autosaveRef.current) clearInterval(autosaveRef.current);
    if (cloudConnected && !localOnly) {
      autosaveRef.current = setInterval(() => { syncToCloud(); }, 60000);
    }
    return () => { if (autosaveRef.current) clearInterval(autosaveRef.current); };
  }, [cloudConnected, localOnly]);

  // Auto snapshot every hour
  useEffect(() => {
    const interval = setInterval(() => { takeSnapshot('Auto - Hourly'); }, 3600000);
    return () => clearInterval(interval);
  }, [tasks, equipment, issues, checklists, photos, inventory]);

  const logActivity = useCallback((entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => {
    const newEntry: ActivityEntry = { ...entry, id: uid('act'), timestamp: now() };
    setActivity(prev => [newEntry, ...prev].slice(0, 500));
  }, []);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp'>) => {
    const notif: Notification = { ...n, id: uid('notif'), timestamp: now() };
    setNotifications(prev => [notif, ...prev].slice(0, 50));
  }, []);

  const takeSnapshot = useCallback((label: string) => {
    const snapshot: RevisionSnapshot = {
      id: uid('rev'), timestamp: now(), label,
      tasks: JSON.parse(JSON.stringify(tasks)),
      equipment: JSON.parse(JSON.stringify(equipment)),
      issues: JSON.parse(JSON.stringify(issues)),
      checklists: JSON.parse(JSON.stringify(checklists)),
      photos: JSON.parse(JSON.stringify(photos)),
      inventory: JSON.parse(JSON.stringify(inventory)),
    };
    setRevisions(prev => [snapshot, ...prev].slice(0, 20));
  }, [tasks, equipment, issues, checklists, photos, inventory]);

  const restoreSnapshot = useCallback((id: string) => {
    const snapshot = revisions.find(r => r.id === id);
    if (!snapshot) return;
    setTasks(snapshot.tasks);
    setEquipment(snapshot.equipment);
    setIssues(snapshot.issues);
    setChecklists(snapshot.checklists);
    setPhotos(snapshot.photos);
    setInventory(snapshot.inventory);
    logActivity({ action: 'reset', entityType: 'project', entityId: 'all', details: `Restored revision: ${snapshot.label}`, user: 'System' });
  }, [revisions, logActivity]);

  const deleteSnapshot = useCallback((id: string) => {
    setRevisions(prev => prev.filter(r => r.id !== id));
  }, []);

  // Project
  const updateProject = useCallback((p: Partial<Project>) => {
    setProject(prev => ({ ...prev, ...p, updatedAt: now() }));
    logActivity({ action: 'update', entityType: 'project', entityId: project.id, details: 'Updated project info', user: 'User' });
  }, [project.id, logActivity]);

  // Tasks
  const addTask = useCallback((task: Omit<Task, 'id' | 'updatedAt'>) => {
    const newTask: Task = { ...task, id: uid('task'), updatedAt: now(), comments: [] };
    setTasks(prev => [...prev, newTask]);
    logActivity({ action: 'create', entityType: 'task', entityId: newTask.id, details: `Created task: ${newTask.description}`, user: 'User' });
    if (!localOnly && cloudConnected) syncTasksToCloud([newTask]);
  }, [logActivity, localOnly, cloudConnected]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: now() } : t));
    const task = tasks.find(t => t.id === id);
    if (task) {
      logActivity({ action: 'update', entityType: 'task', entityId: id, details: `Updated task: ${task.description}`, user: 'User' });
      if (!localOnly && cloudConnected) syncTasksToCloud([{ ...task, ...updates, updatedAt: now() }]);
    }
  }, [tasks, logActivity, localOnly, cloudConnected]);

  const deleteTask = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (task) logActivity({ action: 'delete', entityType: 'task', entityId: id, details: `Deleted task: ${task.description}`, user: 'User' });
  }, [tasks, logActivity]);

  const addComment = useCallback((taskId: string, comment: Omit<Comment, 'id' | 'timestamp'>) => {
    const newComment: Comment = { ...comment, id: uid('comment'), timestamp: now() };
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, comments: [...t.comments, newComment], updatedAt: now() } : t));
    logActivity({ action: 'update', entityType: 'task', entityId: taskId, details: `Added comment to task`, user: comment.author || 'User' });
  }, [logActivity]);

  const deleteComment = useCallback((taskId: string, commentId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, comments: t.comments.filter(c => c.id !== commentId), updatedAt: now() } : t));
  }, []);

  // Equipment
  const addEquipment = useCallback((eq: Omit<Equipment, 'id' | 'updatedAt'>) => {
    const newEq: Equipment = { ...eq, id: uid('eq'), updatedAt: now() };
    setEquipment(prev => [...prev, newEq]);
    logActivity({ action: 'create', entityType: 'equipment', entityId: newEq.id, details: `Added equipment: ${newEq.name}`, user: 'User' });
    if (!localOnly && cloudConnected) syncEquipmentToCloud([newEq]);
  }, [logActivity, localOnly, cloudConnected]);

  const updateEquipment = useCallback((id: string, updates: Partial<Equipment>) => {
    setEquipment(prev => prev.map(e => e.id === id ? { ...e, ...updates, updatedAt: now() } : e));
    const eq = equipment.find(e => e.id === id);
    if (eq) {
      logActivity({ action: 'update', entityType: 'equipment', entityId: id, details: `Updated equipment: ${eq.name}`, user: 'User' });
      if (!localOnly && cloudConnected) syncEquipmentToCloud([{ ...eq, ...updates, updatedAt: now() }]);
    }
  }, [equipment, logActivity, localOnly, cloudConnected]);

  const deleteEquipment = useCallback((id: string) => {
    const eq = equipment.find(e => e.id === id);
    setEquipment(prev => prev.filter(e => e.id !== id));
    if (eq) logActivity({ action: 'delete', entityType: 'equipment', entityId: id, details: `Deleted equipment: ${eq.name}`, user: 'User' });
  }, [equipment, logActivity]);

  // Issues
  const addIssue = useCallback((issue: Omit<Issue, 'id' | 'updatedAt'>) => {
    const newIssue: Issue = { ...issue, id: uid('iss'), updatedAt: now() };
    setIssues(prev => [...prev, newIssue]);
    logActivity({ action: 'create', entityType: 'issue', entityId: newIssue.id, details: `Logged issue: ${newIssue.title}`, user: 'User' });
    addNotification({ title: 'New Issue', message: newIssue.title, type: 'warning', read: false });
    if (!localOnly && cloudConnected) syncIssuesToCloud([newIssue]);
  }, [logActivity, addNotification, localOnly, cloudConnected]);

  const updateIssue = useCallback((id: string, updates: Partial<Issue>) => {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: now() } : i));
    const iss = issues.find(i => i.id === id);
    if (iss) {
      logActivity({ action: 'update', entityType: 'issue', entityId: id, details: `Updated issue: ${iss.title}`, user: 'User' });
      if (!localOnly && cloudConnected) syncIssuesToCloud([{ ...iss, ...updates, updatedAt: now() }]);
    }
  }, [issues, logActivity, localOnly, cloudConnected]);

  const deleteIssue = useCallback((id: string) => {
    const iss = issues.find(i => i.id === id);
    setIssues(prev => prev.filter(i => i.id !== id));
    if (iss) logActivity({ action: 'delete', entityType: 'issue', entityId: id, details: `Deleted issue: ${iss.title}`, user: 'User' });
  }, [issues, logActivity]);

  // Checklists
  const addChecklist = useCallback((cl: Omit<Checklist, 'id' | 'updatedAt'>) => {
    const newCl: Checklist = { ...cl, id: uid('cl'), updatedAt: now() };
    setChecklists(prev => [...prev, newCl]);
    logActivity({ action: 'create', entityType: 'checklist', entityId: newCl.id, details: `Created checklist: ${newCl.title}`, user: 'User' });
    if (!localOnly && cloudConnected) syncChecklistsToCloud([newCl]);
  }, [logActivity, localOnly, cloudConnected]);

  const updateChecklist = useCallback((id: string, updates: Partial<Checklist>) => {
    setChecklists(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: now() } : c));
    const cl = checklists.find(c => c.id === id);
    if (cl) {
      logActivity({ action: 'update', entityType: 'checklist', entityId: id, details: `Updated checklist: ${cl.title}`, user: 'User' });
      if (!localOnly && cloudConnected) syncChecklistsToCloud([{ ...cl, ...updates, updatedAt: now() }]);
    }
  }, [checklists, logActivity, localOnly, cloudConnected]);

  const deleteChecklist = useCallback((id: string) => {
    const cl = checklists.find(c => c.id === id);
    setChecklists(prev => prev.filter(c => c.id !== id));
    if (cl) logActivity({ action: 'delete', entityType: 'checklist', entityId: id, details: `Deleted checklist: ${cl.title}`, user: 'User' });
  }, [checklists, logActivity]);

  // Owners
  const addOwner = useCallback((owner: Omit<Owner, 'id'>) => {
    const newOwner: Owner = { ...owner, id: uid('owner') };
    setOwners(prev => [...prev, newOwner]);
    logActivity({ action: 'create', entityType: 'owner', entityId: newOwner.id, details: `Added team member: ${newOwner.name}`, user: 'User' });
  }, [logActivity]);

  const updateOwner = useCallback((id: string, updates: Partial<Owner>) => {
    setOwners(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    const owner = owners.find(o => o.id === id);
    if (owner && updates.name && updates.name !== owner.name) {
      setTasks(prev => prev.map(t => t.owner === owner.name ? { ...t, owner: updates.name!, updatedAt: now() } : t));
    }
    logActivity({ action: 'update', entityType: 'owner', entityId: id, details: `Updated team member: ${owner?.name}`, user: 'User' });
  }, [owners, logActivity]);

  const deleteOwner = useCallback((id: string) => {
    const owner = owners.find(o => o.id === id);
    setOwners(prev => prev.filter(o => o.id !== id));
    if (owner) logActivity({ action: 'delete', entityType: 'owner', entityId: id, details: `Removed team member: ${owner.name}`, user: 'User' });
  }, [owners, logActivity]);

  // Phases
  const addPhase = useCallback((phase: Omit<Phase, 'id'>) => {
    const newPhase: Phase = { ...phase, id: uid('phase') };
    setPhases(prev => [...prev, newPhase]);
    logActivity({ action: 'create', entityType: 'phase', entityId: newPhase.id, details: `Added phase: ${newPhase.name}`, user: 'User' });
  }, [logActivity]);

  const updatePhase = useCallback((id: string, updates: Partial<Phase>) => {
    setPhases(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    const phase = phases.find(p => p.id === id);
    logActivity({ action: 'update', entityType: 'phase', entityId: id, details: `Updated phase: ${phase?.name}`, user: 'User' });
  }, [phases, logActivity]);

  const deletePhase = useCallback((id: string) => {
    const phase = phases.find(p => p.id === id);
    setPhases(prev => prev.filter(p => p.id !== id));
    if (phase) logActivity({ action: 'delete', entityType: 'phase', entityId: id, details: `Deleted phase: ${phase.name}`, user: 'User' });
  }, [phases, logActivity]);

  // Photos / Media
  const addPhoto = useCallback((photo: Omit<Photo, 'id' | 'uploadedAt'>) => {
    const newPhoto: Photo = { ...photo, id: uid('photo'), uploadedAt: now() };
    setPhotos(prev => [...prev, newPhoto]);
    logActivity({ action: 'create', entityType: 'media', entityId: newPhoto.id, details: `Added photo: ${newPhoto.caption}`, user: photo.uploadedBy || 'User' });
  }, [logActivity]);

  const deletePhoto = useCallback((id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  }, []);

  // Inventory
  const addInventoryItem = useCallback((item: Omit<InventoryItem, 'id' | 'updatedAt'>) => {
    const newItem: InventoryItem = { ...item, id: uid('inv'), updatedAt: now() };
    setInventory(prev => [...prev, newItem]);
    logActivity({ action: 'create', entityType: 'inventory', entityId: newItem.id, details: `Added inventory: ${newItem.name} (${newItem.quantity} qty)`, user: 'User' });
    addNotification({ title: 'Inventory Added', message: `${newItem.name} - ${newItem.status}`, type: 'info', read: false });
  }, [logActivity, addNotification]);

  const updateInventoryItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: now() } : i));
    const item = inventory.find(i => i.id === id);
    if (item) logActivity({ action: 'update', entityType: 'inventory', entityId: id, details: `Updated inventory: ${item.name}`, user: 'User' });
  }, [inventory, logActivity]);

  const deleteInventoryItem = useCallback((id: string) => {
    const item = inventory.find(i => i.id === id);
    setInventory(prev => prev.filter(i => i.id !== id));
    if (item) logActivity({ action: 'delete', entityType: 'inventory', entityId: id, details: `Deleted inventory: ${item.name}`, user: 'User' });
  }, [inventory, logActivity]);

  // Notifications
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Sync
  const syncToCloud = useCallback(async () => {
    if (localOnly || !isSupabaseConfigured()) return;
    setSyncing(true);
    await syncTasksToCloud(tasks);
    await syncEquipmentToCloud(equipment);
    await syncIssuesToCloud(issues);
    await syncChecklistsToCloud(checklists);
    setSyncing(false);
    addNotification({ title: 'Sync Complete', message: 'Data uploaded to cloud', type: 'success', read: false });
  }, [tasks, equipment, issues, checklists, localOnly, addNotification]);

  const syncFromCloud = useCallback(async () => {
    setSyncing(true);
    const { data: tData } = await downloadFromCloud('tasks');
    if (tData) setTasks(tData as Task[]);
    const { data: eData } = await downloadFromCloud('equipment');
    if (eData) setEquipment(eData as Equipment[]);
    const { data: iData } = await downloadFromCloud('issues');
    if (iData) setIssues(iData as Issue[]);
    const { data: cData } = await downloadFromCloud('checklists');
    if (cData) setChecklists(cData as Checklist[]);
    setSyncing(false);
    addNotification({ title: 'Download Complete', message: 'Data synced from cloud', type: 'success', read: false });
  }, [addNotification]);

  const resetAllData = useCallback(() => {
    remove('tasks'); remove('equipment'); remove('issues'); remove('checklists');
    remove('photos'); remove('revisions'); remove('activity'); remove('inventory');
    location.reload();
  }, []);

  const importData = useCallback((data: Partial<AppState>) => {
    if (data.tasks) setTasks(data.tasks);
    if (data.equipment) setEquipment(data.equipment);
    if (data.issues) setIssues(data.issues);
    if (data.checklists) setChecklists(data.checklists);
    if (data.photos) setPhotos(data.photos);
    if (data.inventory) setInventory(data.inventory);
    if (data.owners) setOwners(data.owners);
    if (data.phases) setPhases(data.phases);
    logActivity({ action: 'import', entityType: 'project', entityId: 'all', details: 'Imported data from file', user: 'User' });
  }, [logActivity]);

  const value: AppContextType = {
    project, tasks, equipment, issues, checklists, photos, inventory, owners, phases,
    activity, revisions, cloudConnected, syncing, localOnly, notifications,
    updateProject,
    addTask, updateTask, deleteTask, addComment, deleteComment,
    addEquipment, updateEquipment, deleteEquipment,
    addIssue, updateIssue, deleteIssue,
    addChecklist, updateChecklist, deleteChecklist,
    addOwner, updateOwner, deleteOwner,
    addPhase, updatePhase, deletePhase,
    addPhoto, deletePhoto,
    addInventoryItem, updateInventoryItem, deleteInventoryItem,
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
