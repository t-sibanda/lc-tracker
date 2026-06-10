export interface Project {
  id: string;
  name: string;
  description: string;
  number: string;
  client: string;
  cxManager: string;
  company: string;
  startDate: string;
  targetDate: string;
  status: string;
  updatedAt: string;
}

export interface ProjectMeta {
  id: string;
  name: string;
  number: string;
  description: string;
  client: string;
  cxManager: string;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
}

export interface Task {
  id: string;
  description: string;
  phase: string;
  zone: string;
  system: string;
  discipline: string;
  scope: 'project' | 'zone' | 'pre-install';
  owner: string;
  support: string;
  predecessors: string;
  deliverable: string;
  notes: string;
  percentComplete: number;
  status: 'Not Started' | 'In Progress' | 'Complete';
  startDate: string;
  endDate: string;
  comments: Comment[];
  updatedAt: string;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  zone: string;
  location: string;
  discipline: string;
  contractor: string;
  status: 'Not Commissioned' | 'L1 - Documentation' | 'L2 - Factory Witness' | 'L3 - Startup' | 'L4 - Functional' | 'L5 - Integrated';
  percentComplete: number;
  notes: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'New' | 'In Progress' | 'Completed' | 'Closed-Cx Verified' | 'Rejected';
  zone: string;
  system: string;
  discipline: string;
  responsibleParty: string;
  reportedBy: string;
  reportedAt: string;
  resolvedAt: string;
  resolutionNotes: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  description: string;
  expectedResult: string;
  verified: boolean;
  actualReading: string;
  notes: string;
}

export interface Checklist {
  id: string;
  title: string;
  type: string;
  status: 'Not Started' | 'In Progress' | 'Complete';
  equipmentId: string;
  equipmentName: string;
  assignedTo: string;
  percentComplete: number;
  discipline: string;
  items: ChecklistItem[];
  documents: ChecklistDocument[];
  updatedAt: string;
}

export interface ChecklistDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc' | 'other';
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Photo {
  id: string;
  url: string;
  caption: string;
  zone: string;
  uploadedAt: string;
  uploadedBy: string;
  entityType: 'task' | 'equipment' | 'issue' | 'checklist' | 'inventory' | 'general';
  entityId: string;
  entityName: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  quantityReceived: number;
  zone: string;
  system: string;
  supplier: string;
  poNumber: string;
  scheduledDate: string;
  receivedDate: string;
  receivedBy: string;
  signedOffBy: string;
  status: 'Pending' | 'Ordered' | 'In Transit' | 'Received' | 'Partial' | 'Installed' | 'Rejected';
  notes: string;
  photos: string[];
  updatedAt: string;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  user: string;
  action: 'create' | 'update' | 'delete' | 'status_change' | 'import' | 'export' | 'sync' | 'reset';
  entityType: 'task' | 'equipment' | 'issue' | 'checklist' | 'owner' | 'phase' | 'zone' | 'project' | 'inventory' | 'media';
  entityId: string;
  details: string;
}

export interface RevisionSnapshot {
  id: string;
  timestamp: string;
  label: string;
  tasks: Task[];
  equipment: Equipment[];
  issues: Issue[];
  checklists: Checklist[];
  photos: Photo[];
  inventory: InventoryItem[];
}

export interface AppState {
  project: Project;
  projects: ProjectMeta[];
  currentProjectId: string;
  tasks: Task[];
  equipment: Equipment[];
  issues: Issue[];
  checklists: Checklist[];
  photos: Photo[];
  inventory: InventoryItem[];
  ioPoints: IOPoint[];
  owners: Owner[];
  phases: Phase[];
  activity: ActivityEntry[];
  revisions: RevisionSnapshot[];
  cloudConnected: boolean;
  syncing: boolean;
  localOnly: boolean;
  notifications: Notification[];
}

export interface Owner {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface Phase {
  id: string;
  name: string;
  owner: string;
  startDate: string;
  endDate: string;
  status: 'Not Started' | 'In Progress' | 'Complete';
  percentComplete: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'milestone';
}

export interface ZoneSummary {
  name: string;
  taskCount: number;
  overallPercent: number;
  status: string;
  systems: string[];
}

export type ViewMode = 'project' | 'zone' | 'all';

export interface TestStep {
  id: string;
  action: string;
  expectedResult: string;
  verified: boolean;
  actualReading: string;
  notes: string;
}

export interface IOPoint {
  id: string;
  panel: string;
  description: string;
  ioType: 'AI' | 'AO' | 'DI' | 'DO';
  aiCount: number;
  aoCount: number;
  diCount: number;
  doCount: number;
  signalType: string;
  signal: string;
  instrumentPower: string;
  plc: string;
  ioModule: string;
  rack: number;
  slot: number;
  channel: number;
  ioAddress: string;
  engMin: string;
  engMax: string;
  units: string;
  zone: string;
  system: string;
  deviceInstalled: boolean;
  wiringTagged: boolean;
  devicePowered: boolean;
  signalVerified: boolean;
  passFail: 'Pass' | 'Fail' | 'Pending';
  notes: string;
  testSteps: TestStep[];
  updatedAt: string;
}
