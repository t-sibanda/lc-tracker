import type { Project, Task, Equipment, Issue, Checklist, Owner, Phase, Photo, InventoryItem } from '@/types';

export const defaultProject: Project = {
  id: 'proj-001',
  name: '21-0488 Comstock',
  description: 'Liquid Cooling Commissioning - E Technologies Group',
  number: '21-0488',
  client: 'Prologis',
  cxManager: 'Terrence Sibanda',
  company: 'TnT Technologies / ETG',
  startDate: '2025-01-01',
  targetDate: '2026-12-31',
  status: 'In Progress',
  updatedAt: new Date().toISOString(),
};

export const defaultOwners: Owner[] = [
  { id: 'o1', name: 'Terrence Sibanda', role: 'Cx Manager', email: 'terrence@tnttech.com', phone: '' },
  { id: 'o2', name: 'Austin White', role: 'Controls Lead', email: '', phone: '' },
  { id: 'o3', name: 'Oleks Babich', role: 'Controls Engineer', email: '', phone: '' },
  { id: 'o4', name: 'Ryan Budd', role: 'Software Engineer', email: '', phone: '' },
  { id: 'o5', name: 'Richard Marlenee', role: 'Hardware Engineer', email: '', phone: '' },
  { id: 'o6', name: 'Emon Kandahari', role: 'Network Engineer', email: '', phone: '' },
  { id: 'o7', name: 'Brian Zachary', role: 'BMS Engineer', email: '', phone: '' },
  { id: 'o8', name: 'James Roach', role: 'Field Technician', email: '', phone: '' },
  { id: 'o9', name: 'Daedalus', role: 'Vendor Support', email: '', phone: '' },
  { id: 'o10', name: 'Anthony Violenta', role: 'Commissioning Agent', email: '', phone: '' },
];

export const defaultPhases: Phase[] = [
  { id: 'p1', name: 'Kickoff', owner: 'Terrence Sibanda', startDate: '2025-01-06', endDate: '2025-01-31', status: 'Complete', percentComplete: 100 },
  { id: 'p2', name: 'Requirements', owner: 'Austin White', startDate: '2025-02-01', endDate: '2025-02-28', status: 'Complete', percentComplete: 100 },
  { id: 'p3', name: 'Design', owner: 'Oleks Babich', startDate: '2025-03-01', endDate: '2025-04-30', status: 'Complete', percentComplete: 100 },
  { id: 'p4', name: 'Development', owner: 'Ryan Budd', startDate: '2025-05-01', endDate: '2025-08-31', status: 'In Progress', percentComplete: 65 },
  { id: 'p5', name: 'Test', owner: 'Richard Marlenee', startDate: '2025-09-01', endDate: '2025-11-30', status: 'In Progress', percentComplete: 30 },
  { id: 'p6', name: 'Closeout', owner: 'Terrence Sibanda', startDate: '2025-12-01', endDate: '2025-12-31', status: 'Not Started', percentComplete: 0 },
];

const zones = [
  'POD 1', 'POD 2', 'POD 3', 'POD 4', 'POD 5', 'POD 6', 'POD 7', 'POD 8',
  'Hospital POD', 'Visitor Lab', 'Machine Farm', 'Bench Lab', 'Chamber Lab'
];

const zoneShort: Record<string, string> = {
  'POD 1': 'POD1', 'POD 2': 'POD2', 'POD 3': 'POD3', 'POD 4': 'POD4',
  'POD 5': 'POD5', 'POD 6': 'POD6', 'POD 7': 'POD7', 'POD 8': 'POD8',
  'Hospital POD': 'HOSP', 'Visitor Lab': 'VISL', 'Machine Farm': 'MACH',
  'Bench Lab': 'BENL', 'Chamber Lab': 'CHAM'
};

export const projectTasks: Omit<Task, 'id' | 'updatedAt' | 'comments'>[] = [
  // Kickoff
  { description: 'Project kickoff meeting', phase: 'Kickoff', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Terrence Sibanda', support: '', predecessors: '', deliverable: 'Meeting minutes', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-01-06', endDate: '2025-01-10' },
  { description: 'Review contract SOW', phase: 'Kickoff', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Terrence Sibanda', support: '', predecessors: '', deliverable: 'SOW review sign-off', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-01-06', endDate: '2025-01-13' },
  { description: 'Identify stakeholders', phase: 'Kickoff', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Terrence Sibanda', support: '', predecessors: '', deliverable: 'Stakeholder register', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-01-06', endDate: '2025-01-10' },
  { description: 'Setup project teamsite', phase: 'Kickoff', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Ryan Budd', support: '', predecessors: '', deliverable: 'Teamsite URL', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-01-06', endDate: '2025-01-13' },
  { description: 'Create master schedule', phase: 'Kickoff', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Terrence Sibanda', support: 'Austin White', predecessors: '', deliverable: 'MS Project file', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-01-13', endDate: '2025-01-17' },
  { description: 'Confirm commissioning team', phase: 'Kickoff', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Terrence Sibanda', support: '', predecessors: '', deliverable: 'Org chart', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-01-13', endDate: '2025-01-17' },
  // Requirements
  { description: 'Controls architecture review', phase: 'Requirements', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Austin White', support: 'Oleks Babich', predecessors: '', deliverable: 'Architecture doc', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-02-01', endDate: '2025-02-14' },
  { description: 'Sequence of operations review', phase: 'Requirements', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Austin White', support: '', predecessors: 'Controls architecture review', deliverable: 'SOO document', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-02-03', endDate: '2025-02-21' },
  { description: 'Network architecture review', phase: 'Requirements', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Emon Kandahari', support: '', predecessors: '', deliverable: 'Network diagram', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-02-03', endDate: '2025-02-14' },
  { description: 'BMS integration review', phase: 'Requirements', zone: 'All', system: 'Project', discipline: 'BMS', scope: 'project', owner: 'Brian Zachary', support: '', predecessors: '', deliverable: 'Integration spec', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-02-10', endDate: '2025-02-21' },
  { description: 'Hardware requirements finalization', phase: 'Requirements', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Richard Marlenee', support: '', predecessors: 'Controls architecture review', deliverable: 'BOM', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-02-10', endDate: '2025-02-28' },
  { description: 'Software requirements finalization', phase: 'Requirements', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Ryan Budd', support: '', predecessors: 'Controls architecture review', deliverable: 'SRS document', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-02-10', endDate: '2025-02-28' },
  { description: 'Client requirements sign-off', phase: 'Requirements', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Terrence Sibanda', support: '', predecessors: '', deliverable: 'Signed requirements', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-02-24', endDate: '2025-02-28' },
  // Design
  { description: 'Device list development', phase: 'Design', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Oleks Babich', support: '', predecessors: 'Hardware requirements finalization', deliverable: 'Device list', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-03-01', endDate: '2025-03-15' },
  { description: 'Panel layout design', phase: 'Design', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Oleks Babich', support: '', predecessors: 'Device list development', deliverable: 'Panel drawings', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-03-10', endDate: '2025-03-31' },
  { description: 'Network design', phase: 'Design', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Emon Kandahari', support: '', predecessors: 'Network architecture review', deliverable: 'Network drawings', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-03-01', endDate: '2025-03-20' },
  { description: 'Software design spec', phase: 'Design', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Ryan Budd', support: '', predecessors: 'Software requirements finalization', deliverable: 'SDS document', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-03-01', endDate: '2025-03-31' },
  { description: 'HMI design', phase: 'Design', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Ryan Budd', support: '', predecessors: 'Software design spec', deliverable: 'HMI mockups', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-03-15', endDate: '2025-04-15' },
  { description: 'Design review meeting', phase: 'Design', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Terrence Sibanda', support: 'All', predecessors: '', deliverable: 'Review minutes', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-04-01', endDate: '2025-04-07' },
  { description: 'Client design approval', phase: 'Design', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Terrence Sibanda', support: '', predecessors: 'Design review meeting', deliverable: 'Approval sign-off', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-04-07', endDate: '2025-04-15' },
  // Development
  { description: 'Procure hardware', phase: 'Development', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Richard Marlenee', support: '', predecessors: 'Client design approval', deliverable: 'POs issued', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-04-15', endDate: '2025-05-15' },
  { description: 'Procure software licensing', phase: 'Development', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Ryan Budd', support: '', predecessors: 'Client design approval', deliverable: 'Licenses purchased', notes: '', percentComplete: 100, status: 'Complete', startDate: '2025-04-15', endDate: '2025-05-01' },
  { description: 'Panel fabrication', phase: 'Development', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Oleks Babich', support: '', predecessors: 'Panel layout design', deliverable: 'Fabricated panels', notes: '', percentComplete: 90, status: 'In Progress', startDate: '2025-04-15', endDate: '2025-06-30' },
  { description: 'PLC programming', phase: 'Development', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Ryan Budd', support: 'Austin White', predecessors: 'Software design spec', deliverable: 'PLC code', notes: '', percentComplete: 75, status: 'In Progress', startDate: '2025-05-01', endDate: '2025-07-31' },
  { description: 'HMI development', phase: 'Development', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Ryan Budd', support: '', predecessors: 'HMI design', deliverable: 'HMI screens', notes: '', percentComplete: 60, status: 'In Progress', startDate: '2025-05-15', endDate: '2025-08-15' },
  { description: 'SCADA development', phase: 'Development', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Ryan Budd', support: '', predecessors: 'Software design spec', deliverable: 'SCADA application', notes: '', percentComplete: 50, status: 'In Progress', startDate: '2025-05-01', endDate: '2025-08-31' },
  { description: 'Network configuration', phase: 'Development', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Emon Kandahari', support: '', predecessors: 'Network design', deliverable: 'Network config', notes: '', percentComplete: 80, status: 'In Progress', startDate: '2025-05-15', endDate: '2025-07-15' },
  { description: 'BMS integration development', phase: 'Development', zone: 'All', system: 'Project', discipline: 'BMS', scope: 'project', owner: 'Brian Zachary', support: 'Ryan Budd', predecessors: 'BMS integration review', deliverable: 'BMS integration', notes: '', percentComplete: 40, status: 'In Progress', startDate: '2025-06-01', endDate: '2025-08-31' },
  { description: 'Internal code review', phase: 'Development', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Austin White', support: '', predecessors: 'PLC programming', deliverable: 'Review report', notes: '', percentComplete: 20, status: 'In Progress', startDate: '2025-07-15', endDate: '2025-08-15' },
  { description: 'Factory acceptance test prep', phase: 'Development', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Terrence Sibanda', support: '', predecessors: '', deliverable: 'FAT plan', notes: '', percentComplete: 10, status: 'In Progress', startDate: '2025-08-01', endDate: '2025-08-15' },
  // Test
  { description: 'SFAT - System Factory Acceptance Test', phase: 'Test', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Terrence Sibanda', support: 'All', predecessors: 'Factory acceptance test prep', deliverable: 'SFAT report', notes: '', percentComplete: 0, status: 'Not Started', startDate: '2025-09-01', endDate: '2025-09-15' },
  { description: 'HFAT - Hardware Factory Acceptance Test', phase: 'Test', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Richard Marlenee', support: '', predecessors: 'Panel fabrication', deliverable: 'HFAT report', notes: '', percentComplete: 0, status: 'Not Started', startDate: '2025-08-15', endDate: '2025-08-30' },
  { description: 'Site acceptance test', phase: 'Test', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Terrence Sibanda', support: 'All', predecessors: 'SFAT', deliverable: 'SAT report', notes: '', percentComplete: 0, status: 'Not Started', startDate: '2025-10-01', endDate: '2025-10-31' },
  { description: 'Integrated systems test', phase: 'Test', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Terrence Sibanda', support: 'All', predecessors: 'Site acceptance test', deliverable: 'IST report', notes: '', percentComplete: 0, status: 'Not Started', startDate: '2025-11-01', endDate: '2025-11-30' },
  { description: 'Performance verification', phase: 'Test', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Austin White', support: '', predecessors: 'Integrated systems test', deliverable: 'Performance report', notes: '', percentComplete: 0, status: 'Not Started', startDate: '2025-11-15', endDate: '2025-11-30' },
  { description: 'Issues resolution', phase: 'Test', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Terrence Sibanda', support: '', predecessors: '', deliverable: 'Issues log closed', notes: '', percentComplete: 0, status: 'Not Started', startDate: '2025-09-01', endDate: '2025-11-30' },
  // Closeout
  { description: 'As-built drawings', phase: 'Closeout', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Oleks Babich', support: '', predecessors: 'Integrated systems test', deliverable: 'As-builts', notes: '', percentComplete: 0, status: 'Not Started', startDate: '2025-12-01', endDate: '2025-12-15' },
  { description: 'Program backup', phase: 'Closeout', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Ryan Budd', support: '', predecessors: 'Integrated systems test', deliverable: 'Backup files', notes: '', percentComplete: 0, status: 'Not Started', startDate: '2025-12-01', endDate: '2025-12-10' },
  { description: 'Training delivery', phase: 'Closeout', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Austin White', support: '', predecessors: 'Performance verification', deliverable: 'Training records', notes: '', percentComplete: 0, status: 'Not Started', startDate: '2025-12-01', endDate: '2025-12-15' },
  { description: 'O&M manuals', phase: 'Closeout', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Terrence Sibanda', support: '', predecessors: '', deliverable: 'O&M manuals', notes: '', percentComplete: 0, status: 'Not Started', startDate: '2025-12-01', endDate: '2025-12-20' },
  { description: 'Final certification', phase: 'Closeout', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Terrence Sibanda', support: '', predecessors: '', deliverable: 'Cx certificate', notes: '', percentComplete: 0, status: 'Not Started', startDate: '2025-12-15', endDate: '2025-12-31' },
  { description: 'Warranty handover', phase: 'Closeout', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Terrence Sibanda', support: '', predecessors: 'Final certification', deliverable: 'Warranty docs', notes: '', percentComplete: 0, status: 'Not Started', startDate: '2025-12-20', endDate: '2025-12-31' },
  { description: 'Project closeout meeting', phase: 'Closeout', zone: 'All', system: 'Project', discipline: 'Controls', scope: 'project', owner: 'Terrence Sibanda', support: 'All', predecessors: '', deliverable: 'Closeout minutes', notes: '', percentComplete: 0, status: 'Not Started', startDate: '2025-12-28', endDate: '2025-12-31' },
];

function generateZoneTasks(): Omit<Task, 'id' | 'updatedAt' | 'comments'>[] {
  const tasks: Omit<Task, 'id' | 'updatedAt' | 'comments'>[] = [];

  const l3Tests = [
    'Verify equipment nameplate data',
    'Confirm power supply connections',
    'Verify grounding integrity',
    'Test emergency stop functionality',
    'Verify sensor calibration',
    'Test actuator response',
    'Confirm communication link',
    'Test alarm functionality',
    'Verify setpoint operation',
    'Test interlock functionality',
    'Confirm flow rates',
    'Verify temperature readings',
    'Test pressure differentials',
    'Confirm valve operation',
    'Test leak detection system',
    'Verify control loop response',
    'Confirm safety shutdown sequence',
  ];

  const l4Tests = [
    'Functional performance test - normal operation',
    'Functional performance test - alarm condition',
    'Functional performance test - emergency shutdown',
    'Functional performance test - restart sequence',
    'Functional performance test - failover',
  ];

  const l5Tests = [
    'Integrated systems test - full load',
    'Integrated systems test - partial load',
    'Integrated systems test - loss of power',
    'Integrated systems test - loss of cooling',
    'Integrated systems test - leak scenario',
    'Integrated systems test - fire suppression',
    'Integrated systems test - emergency ventilation',
    'Integrated systems test - control transfer',
    'Integrated systems test - monitoring verification',
    'Integrated systems test - reporting validation',
  ];

  const systems = ['Liquid Cooling', 'HVAC', 'PLC', 'SCADA'];

  zones.forEach(zone => {
    systems.forEach(system => {
      l3Tests.forEach((test, i) => {
        tasks.push({
          description: `L3-${String(i + 1).padStart(2, '0')}: ${test}`,
          phase: 'Test',
          zone,
          system,
          discipline: system === 'Liquid Cooling' || system === 'HVAC' ? 'Mechanical' : 'Controls',
          scope: 'zone',
          owner: system === 'PLC' ? 'Ryan Budd' : system === 'SCADA' ? 'Ryan Budd' : system === 'HVAC' ? 'Brian Zachary' : 'James Roach',
          support: '',
          predecessors: '',
          deliverable: '',
          notes: '',
          percentComplete: 0,
          status: 'Not Started',
          startDate: '',
          endDate: '',
        });
      });

      l4Tests.forEach((test, i) => {
        tasks.push({
          description: `L4-${String(i + 1).padStart(2, '0')}: ${test}`,
          phase: 'Test',
          zone,
          system,
          discipline: system === 'Liquid Cooling' || system === 'HVAC' ? 'Mechanical' : 'Controls',
          scope: 'zone',
          owner: system === 'PLC' ? 'Ryan Budd' : system === 'SCADA' ? 'Ryan Budd' : system === 'HVAC' ? 'Brian Zachary' : 'James Roach',
          support: '',
          predecessors: '',
          deliverable: '',
          notes: '',
          percentComplete: 0,
          status: 'Not Started',
          startDate: '',
          endDate: '',
        });
      });

      l5Tests.forEach((test, i) => {
        tasks.push({
          description: `L5-${String(i + 1).padStart(2, '0')}: ${test}`,
          phase: 'Test',
          zone,
          system,
          discipline: system === 'Liquid Cooling' || system === 'HVAC' ? 'Mechanical' : 'Controls',
          scope: 'zone',
          owner: system === 'PLC' ? 'Ryan Budd' : system === 'SCADA' ? 'Ryan Budd' : system === 'HVAC' ? 'Brian Zachary' : 'James Roach',
          support: '',
          predecessors: '',
          deliverable: '',
          notes: '',
          percentComplete: 0,
          status: 'Not Started',
          startDate: '',
          endDate: '',
        });
      });
    });
  });

  return tasks;
}

export const zoneTaskTemplates = generateZoneTasks();

export const equipmentTypes = [
  'CDU', 'Energy Valve', 'RPP', 'RIO Panel', 'Leak Detection Gateway',
  'Sound Gateway', 'Aparian Router', 'Control Panel', 'CRAH', 'ATS'
];

export function generateDefaultEquipment(): Equipment[] {
  const equipment: Equipment[] = [];
  let id = 1;

  const typesPerZone: Record<string, string[]> = {
    'POD 1': ['CDU', 'Energy Valve', 'RPP', 'RIO Panel', 'Leak Detection Gateway', 'Sound Gateway', 'Aparian Router', 'Control Panel'],
    'POD 2': ['CDU', 'Energy Valve', 'RPP', 'RIO Panel', 'Leak Detection Gateway', 'Sound Gateway', 'Aparian Router', 'Control Panel'],
    'POD 3': ['CDU', 'Energy Valve', 'RPP', 'RIO Panel', 'Leak Detection Gateway', 'Sound Gateway', 'Aparian Router', 'Control Panel'],
    'POD 4': ['CDU', 'Energy Valve', 'RPP', 'RIO Panel', 'Leak Detection Gateway', 'Sound Gateway', 'Aparian Router', 'Control Panel'],
    'POD 5': ['CDU', 'Energy Valve', 'RPP', 'RIO Panel', 'Leak Detection Gateway', 'Sound Gateway', 'Aparian Router', 'Control Panel'],
    'POD 6': ['CDU', 'Energy Valve', 'RPP', 'RIO Panel', 'Leak Detection Gateway', 'Sound Gateway', 'Aparian Router', 'Control Panel'],
    'POD 7': ['CDU', 'Energy Valve', 'RPP', 'RIO Panel', 'Leak Detection Gateway', 'Sound Gateway', 'Aparian Router', 'Control Panel'],
    'POD 8': ['CDU', 'Energy Valve', 'RPP', 'RIO Panel', 'Leak Detection Gateway', 'Sound Gateway', 'Aparian Router', 'Control Panel'],
    'Hospital POD': ['CDU', 'Energy Valve', 'RPP', 'RIO Panel', 'Leak Detection Gateway', 'Sound Gateway', 'Aparian Router', 'Control Panel'],
    'Visitor Lab': ['CDU', 'Energy Valve', 'RPP', 'Leak Detection Gateway', 'Control Panel'],
    'Machine Farm': ['CRAH', 'ATS', 'Control Panel', 'RIO Panel'],
    'Bench Lab': ['CDU', 'Energy Valve', 'Control Panel', 'RIO Panel'],
    'Chamber Lab': ['CDU', 'Energy Valve', 'Control Panel', 'Leak Detection Gateway'],
  };

  zones.forEach(zone => {
    const types = typesPerZone[zone] || ['CDU', 'Energy Valve', 'Control Panel'];
    types.forEach((type, idx) => {
      equipment.push({
        id: `eq-${String(id++).padStart(3, '0')}`,
        name: `${type} ${zoneShort[zone] || zone}-${String(idx + 1).padStart(2, '0')}`,
        type,
        zone,
        location: `${zone} - Row ${String.fromCharCode(65 + (idx % 4))}`,
        discipline: type === 'CRAH' ? 'Mechanical' : type === 'ATS' ? 'Electrical' : 'Controls',
        contractor: type === 'CDU' || type === 'CRAH' ? 'Daedalus' : 'ETG',
        status: 'Not Commissioned',
        percentComplete: 0,
        notes: '',
        updatedAt: new Date().toISOString(),
      });
    });
  });

  return equipment;
}

export const defaultIssues: Issue[] = [
  {
    id: 'iss-001',
    title: 'CDU-001 communication timeout',
    description: 'Intermittent Modbus timeout on CDU-001 in POD 1',
    priority: 'High',
    status: 'In Progress',
    zone: 'POD 1',
    system: 'Liquid Cooling',
    discipline: 'Controls',
    responsibleParty: 'Daedalus',
    reportedBy: 'James Roach',
    reportedAt: '2025-05-15T10:00:00Z',
    resolvedAt: '',
    resolutionNotes: '',
    updatedAt: '2025-05-15T10:00:00Z',
  },
  {
    id: 'iss-002',
    title: 'Network switch firmware update needed',
    description: 'Core switch requires firmware update for security patch',
    priority: 'Medium',
    status: 'New',
    zone: 'All',
    system: 'SCADA',
    discipline: 'Controls',
    responsibleParty: 'Emon Kandahari',
    reportedBy: 'Austin White',
    reportedAt: '2025-05-20T14:30:00Z',
    resolvedAt: '',
    resolutionNotes: '',
    updatedAt: '2025-05-20T14:30:00Z',
  },
  {
    id: 'iss-003',
    title: 'Leak detection calibration drift',
    description: 'Leak detection sensor in POD 3 showing calibration drift',
    priority: 'Critical',
    status: 'In Progress',
    zone: 'POD 3',
    system: 'Liquid Cooling',
    discipline: 'Mechanical',
    responsibleParty: 'Daedalus',
    reportedBy: 'James Roach',
    reportedAt: '2025-05-18T09:00:00Z',
    resolvedAt: '',
    resolutionNotes: '',
    updatedAt: '2025-05-18T09:00:00Z',
  },
  {
    id: 'iss-004',
    title: 'HMI screen layout review',
    description: 'Client requested changes to HMI screen layout for alarm display',
    priority: 'Low',
    status: 'New',
    zone: 'All',
    system: 'SCADA',
    discipline: 'Controls',
    responsibleParty: 'Ryan Budd',
    reportedBy: 'Terrence Sibanda',
    reportedAt: '2025-05-22T11:00:00Z',
    resolvedAt: '',
    resolutionNotes: '',
    updatedAt: '2025-05-22T11:00:00Z',
  },
  {
    id: 'iss-005',
    title: 'BMS integration test failure',
    description: 'BACnet point mapping error during BMS integration test',
    priority: 'High',
    status: 'Completed',
    zone: 'POD 2',
    system: 'HVAC',
    discipline: 'BMS',
    responsibleParty: 'Brian Zachary',
    reportedBy: 'Austin White',
    reportedAt: '2025-05-10T08:00:00Z',
    resolvedAt: '2025-05-14T16:00:00Z',
    resolutionNotes: 'Updated BACnet point list and retested successfully',
    updatedAt: '2025-05-14T16:00:00Z',
  },
];

export const defaultChecklists: Checklist[] = [
  { id: 'cl-001', title: 'CDU Receipt Inspection', type: 'Receipt Inspection', status: 'Complete', equipmentId: 'eq-001', equipmentName: 'CDU POD1-01', assignedTo: 'James Roach', percentComplete: 100, discipline: 'Mechanical', updatedAt: '2025-05-01T10:00:00Z', items: [
    { id: 'cli-001', description: 'Verify equipment nameplate matches submittal.', expectedResult: 'Nameplate data matches approved submittal.', verified: true, actualReading: 'CDU-4000, SN: 2025-0041', notes: '' },
    { id: 'cli-002', description: 'Inspect for physical damage during shipping.', expectedResult: 'No visible damage to equipment or packaging.', verified: true, actualReading: 'No damage observed', notes: '' },
    { id: 'cli-003', description: 'Verify all accessories and loose parts are included.', expectedResult: 'All items on packing list are present.', verified: true, actualReading: 'Packing list verified complete', notes: '' },
  ], documents: [] },
  { id: 'cl-002', title: 'CDU Pre-Functional Check', type: 'Pre-Functional', status: 'In Progress', equipmentId: 'eq-001', equipmentName: 'CDU POD1-01', assignedTo: 'James Roach', percentComplete: 60, discipline: 'Mechanical', updatedAt: '2025-05-10T14:00:00Z', items: [
    { id: 'cli-004', description: 'Verify equipment nameplate matches submittal.', expectedResult: 'Nameplate data matches approved submittal.', verified: true, actualReading: '', notes: '' },
    { id: 'cli-005', description: 'Inspect for physical damage during shipping.', expectedResult: 'No visible damage to equipment or packaging.', verified: true, actualReading: '', notes: '' },
    { id: 'cli-006', description: 'Verify all accessories and loose parts are included.', expectedResult: 'All items on packing list are present.', verified: true, actualReading: '', notes: '' },
    { id: 'cli-007', description: 'Check for proper equipment anchoring and leveling.', expectedResult: 'Equipment is properly anchored and level.', verified: false, actualReading: '', notes: '' },
  ], documents: [] },
  { id: 'cl-003', title: 'Panel Visual Inspection', type: 'Visual Inspection', status: 'Complete', equipmentId: 'eq-008', equipmentName: 'Control Panel POD1-01', assignedTo: 'Oleks Babich', percentComplete: 100, discipline: 'Controls', updatedAt: '2025-05-05T09:00:00Z', items: [
    { id: 'cli-008', description: 'Inspect equipment for physical damage.', expectedResult: 'No visible damage.', verified: true, actualReading: '', notes: '' },
    { id: 'cli-009', description: 'Verify labels and nameplates are legible.', expectedResult: 'All labels readable and accurate.', verified: true, actualReading: '', notes: '' },
    { id: 'cli-010', description: 'Check piping/ductwork connections.', expectedResult: 'All connections secure and leak-free.', verified: true, actualReading: '', notes: '' },
  ], documents: [] },
  { id: 'cl-004', title: 'Network Cable Test', type: 'Test', status: 'In Progress', equipmentId: 'eq-007', equipmentName: 'Aparian Router POD1-01', assignedTo: 'Emon Kandahari', percentComplete: 40, discipline: 'Controls', updatedAt: '2025-05-12T11:00:00Z', items: [
    { id: 'cli-011', description: 'Verify cable routing per drawings.', expectedResult: 'Cables routed per approved drawings.', verified: true, actualReading: '', notes: '' },
    { id: 'cli-012', description: 'Verify cable labels match drawings.', expectedResult: 'All cable tags match drawing tags.', verified: false, actualReading: '', notes: '' },
    { id: 'cli-013', description: 'Test continuity on all conductors.', expectedResult: 'All conductors pass continuity test.', verified: false, actualReading: '', notes: '' },
  ], documents: [] },
  { id: 'cl-005', title: 'Leak Detection Functional', type: 'Functional', status: 'Not Started', equipmentId: 'eq-005', equipmentName: 'Leak Detection Gateway POD1-01', assignedTo: 'James Roach', percentComplete: 0, discipline: 'Mechanical', updatedAt: '2025-05-20T08:00:00Z', items: [
    { id: 'cli-014', description: 'Verify control power is properly connected.', expectedResult: 'Control power is on and stable.', verified: false, actualReading: '', notes: '' },
    { id: 'cli-015', description: 'Test all local control functions.', expectedResult: 'All local controls operate correctly.', verified: false, actualReading: '', notes: '' },
    { id: 'cli-016', description: 'Verify remote control signals are received.', expectedResult: 'Remote commands execute properly.', verified: false, actualReading: '', notes: '' },
  ], documents: [] },
];

// Pre-installation / Construction tasks per zone
const preInstallTaskDescriptions = [
  'Verify updated prints match field conditions',
  'Mark conduit routes on floor/walls per prints',
  'Run conduits for power distribution',
  'Run conduits for control/signal cables',
  'Verify conduit positioning and routing',
  'Secure conduits with proper supports per spec',
  'Pull power cables through conduits',
  'Pull control cables through conduits',
  'Pull network/communication cables',
  'Install cable trays and supports',
  'Verify cable tray alignment and level',
  'Install junction boxes at marked locations',
  'Verify junction box positioning vs prints',
  'Terminate cables at junction boxes',
  'Label all cables and conduits per standard',
  'Install grounding system per design',
  'Verify grounding continuity',
  'Mount equipment backpans to structure',
  'Verify backpan positioning and alignment',
  'Install seismic bracing for equipment',
  'Verify seismic bracing per engineering',
  'Field verify clearances around equipment',
  'Update as-built prints with field changes',
  'Client walk-through of conduit/installation work',
  'Sign-off on pre-installation checklist',
];

export function generatePreInstallTasks(): Omit<Task, 'id' | 'updatedAt' | 'comments'>[] {
  const tasks: Omit<Task, 'id' | 'updatedAt' | 'comments'>[] = [];

  zones.forEach(zone => {
    ['Liquid Cooling', 'HVAC', 'PLC', 'SCADA'].forEach(system => {
      preInstallTaskDescriptions.forEach((desc, i) => {
        tasks.push({
          description: `PRE-${String(i + 1).padStart(2, '0')}: ${desc}`,
          phase: 'Development',
          zone,
          system,
          discipline: desc.includes('ground') || desc.includes('seismic') || desc.includes('Mount') || desc.includes('bracing') || desc.includes('clearance') ? 'Architectural & Engineering' : desc.includes('power') || desc.includes('cable') || desc.includes('conduit') ? 'Electrical' : 'Controls',
          scope: 'pre-install',
          owner: system === 'PLC' ? 'Ryan Budd' : system === 'SCADA' ? 'Ryan Budd' : system === 'HVAC' ? 'Brian Zachary' : 'James Roach',
          support: '',
          predecessors: '',
          deliverable: '',
          notes: '',
          percentComplete: 0,
          status: 'Not Started',
          startDate: '',
          endDate: '',
        });
      });
    });
  });

  return tasks;
}

export const preInstallTaskTemplates = generatePreInstallTasks();

export const defaultInventory: InventoryItem[] = [
  { id: 'inv-001', name: 'Conduit - 3/4" EMT', description: 'Electrical metallic tubing for control wiring', quantity: 520, quantityReceived: 350, zone: 'All', system: 'PLC', supplier: 'Graybar', poNumber: 'PO-2025-0841', scheduledDate: '2025-04-15', receivedDate: '2025-04-20', receivedBy: 'James Roach', signedOffBy: 'Terrence Sibanda', status: 'Partial', notes: 'Remaining 170 lengths backordered to May 15', photos: [], updatedAt: '2025-04-20T10:00:00Z' },
  { id: 'inv-002', name: 'Conduit - 1" EMT', description: 'Electrical metallic tubing for power circuits', quantity: 280, quantityReceived: 280, zone: 'All', system: 'Electrical', supplier: 'Graybar', poNumber: 'PO-2025-0841', scheduledDate: '2025-04-15', receivedDate: '2025-04-18', receivedBy: 'James Roach', signedOffBy: 'Terrence Sibanda', status: 'Received', notes: 'Full delivery received, inspected', photos: [], updatedAt: '2025-04-18T14:00:00Z' },
  { id: 'inv-003', name: 'Cat6A Ethernet Cable', description: 'Shielded Cat6A cable for network/SCADA', quantity: 12000, quantityReceived: 8000, zone: 'All', system: 'SCADA', supplier: 'Anixter', poNumber: 'PO-2025-0892', scheduledDate: '2025-04-20', receivedDate: '2025-04-22', receivedBy: 'Emon Kandahari', signedOffBy: 'Austin White', status: 'Partial', notes: '8000 ft received, 4000 ft on backorder', photos: [], updatedAt: '2025-04-22T11:00:00Z' },
  { id: 'inv-004', name: 'Power Cable - 12 AWG THHN', description: 'Power wiring for 120V circuits', quantity: 8500, quantityReceived: 0, zone: 'All', system: 'Electrical', supplier: 'Graybar', poNumber: 'PO-2025-0842', scheduledDate: '2025-05-01', receivedDate: '', receivedBy: '', signedOffBy: '', status: 'Ordered', notes: 'Expected delivery first week of May', photos: [], updatedAt: '2025-04-15T08:00:00Z' },
  { id: 'inv-005', name: 'Junction Boxes - 4x4x2', description: 'Steel junction boxes with covers', quantity: 120, quantityReceived: 120, zone: 'All', system: 'PLC', supplier: 'Home Depot Pro', poNumber: 'PO-2025-0901', scheduledDate: '2025-04-10', receivedDate: '2025-04-12', receivedBy: 'James Roach', signedOffBy: 'Terrence Sibanda', status: 'Installed', notes: 'All 120 boxes mounted and conduit connected', photos: [], updatedAt: '2025-04-25T16:00:00Z' },
  { id: 'inv-006', name: 'Cable Tray - 6" Wire Basket', description: 'Wire basket cable tray with connectors', quantity: 85, quantityReceived: 60, zone: 'POD 1', system: 'PLC', supplier: 'Cablofil', poNumber: 'PO-2025-0915', scheduledDate: '2025-04-25', receivedDate: '2025-04-28', receivedBy: 'James Roach', signedOffBy: '', status: 'Partial', notes: '25 sections for POD 1 east wing missing', photos: [], updatedAt: '2025-04-28T09:00:00Z' },
  { id: 'inv-007', name: 'CDU Supply Hoses - 1" SS', description: 'Stainless steel braided supply hoses for CDUs', quantity: 52, quantityReceived: 0, zone: 'All', system: 'Liquid Cooling', supplier: 'Daedalus', poNumber: 'PO-2025-0950', scheduledDate: '2025-05-15', receivedDate: '', receivedBy: '', signedOffBy: '', status: 'Pending', notes: 'Shipped with CDU delivery batch 2', photos: [], updatedAt: '2025-04-30T10:00:00Z' },
  { id: 'inv-008', name: 'Leak Detection Cable', description: 'Sense cable for leak detection system', quantity: 2500, quantityReceived: 2500, zone: 'All', system: 'Liquid Cooling', supplier: 'Daedalus', poNumber: 'PO-2025-0951', scheduledDate: '2025-04-30', receivedDate: '2025-04-30', receivedBy: 'James Roach', signedOffBy: 'Terrence Sibanda', status: 'Received', notes: 'Full reel received, stored in secure cage', photos: [], updatedAt: '2025-04-30T15:00:00Z' },
  { id: 'inv-009', name: 'Grounding Lugs - Compression', description: 'Copper compression grounding lugs', quantity: 200, quantityReceived: 200, zone: 'All', system: 'Electrical', supplier: 'Panduit', poNumber: 'PO-2025-0933', scheduledDate: '2025-04-18', receivedDate: '2025-04-19', receivedBy: 'Richard Marlenee', signedOffBy: 'Terrence Sibanda', status: 'Installed', notes: 'All installed, continuity tested', photos: [], updatedAt: '2025-04-28T11:00:00Z' },
  { id: 'inv-010', name: 'Conduit Supports - Unistrut', description: 'Unistrut clamps and supports for conduit', quantity: 450, quantityReceived: 300, zone: 'All', system: 'Electrical', supplier: 'Anixter', poNumber: 'PO-2025-0843', scheduledDate: '2025-04-22', receivedDate: '2025-04-24', receivedBy: 'James Roach', signedOffBy: '', status: 'Partial', notes: '150 clamps for ceiling mounts delayed', photos: [], updatedAt: '2025-04-24T13:00:00Z' },
  { id: 'inv-011', name: 'Control Panel Backpans', description: 'Mounting backpans for PLC control panels', quantity: 26, quantityReceived: 0, zone: 'All', system: 'PLC', supplier: 'ETG Fabrication', poNumber: 'PO-2025-0970', scheduledDate: '2025-05-10', receivedDate: '', receivedBy: '', signedOffBy: '', status: 'In Transit', notes: 'Fabrication complete, shipping May 5', photos: [], updatedAt: '2025-05-01T09:00:00Z' },
  { id: 'inv-012', name: 'Seismic Bracing Kits', description: 'Seismic bracing hardware per OSHPD', quantity: 48, quantityReceived: 0, zone: 'All', system: 'Architectural', supplier: 'Loos & Co', poNumber: 'PO-2025-0985', scheduledDate: '2025-05-05', receivedDate: '', receivedBy: '', signedOffBy: '', status: 'Ordered', notes: 'ETA confirmed for May 8', photos: [], updatedAt: '2025-04-28T14:00:00Z' },
  { id: 'inv-013', name: 'Equipment Anchors - Wedge Bolts', description: '1/2" wedge anchors for equipment mounting', quantity: 300, quantityReceived: 300, zone: 'All', system: 'Architectural', supplier: 'Hilti', poNumber: 'PO-2025-0940', scheduledDate: '2025-04-20', receivedDate: '2025-04-21', receivedBy: 'James Roach', signedOffBy: 'Terrence Sibanda', status: 'Received', notes: 'Full qty received, torque spec sheet included', photos: [], updatedAt: '2025-04-21T10:30:00Z' },
  { id: 'inv-014', name: 'Label Printer Cartridges', description: 'Heat-shrink cable label cartridges', quantity: 24, quantityReceived: 24, zone: 'All', system: 'Controls', supplier: 'Brady', poNumber: 'PO-2025-0992', scheduledDate: '2025-04-25', receivedDate: '2025-04-26', receivedBy: 'Oleks Babich', signedOffBy: '', status: 'Installed', notes: 'Labeling in progress across PODs 1-4', photos: [], updatedAt: '2025-04-30T16:00:00Z' },
  { id: 'inv-015', name: 'Plywood - Fire-Rated', description: 'Fire-rated plywood for equipment pads', quantity: 15, quantityReceived: 0, zone: 'POD 1', system: 'Architectural', supplier: 'HD Supply', poNumber: 'PO-2025-1001', scheduledDate: '2025-05-08', receivedDate: '', receivedBy: '', signedOffBy: '', status: 'Pending', notes: 'Needed for CDU mounting platforms', photos: [], updatedAt: '2025-05-01T08:00:00Z' },
];

export const defaultPhotos: Photo[] = [];

export { zones, zoneShort };
