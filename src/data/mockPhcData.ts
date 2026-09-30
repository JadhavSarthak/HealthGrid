// Seeded synthetic data for HealthGrid India PHC network
// Section 33.6 & Section 35.6 Schema Conformance

export interface PhcNode {
  id: string;
  name: string;
  type: 'phc' | 'chc' | 'warehouse' | 'district_hospital';
  state: 'Maharashtra' | 'Gujarat' | 'Odisha';
  district: string;
  // Normalized 3D coordinates for spatial layout (x: east-west, z: north-south, y: elevation)
  coord3D: [number, number, number];
  bedsTotal: number;
  bedsOccupied: number;
  staffSanctioned: number;
  staffPresent: number;
  connectivityStatus: 'online' | 'intermittent' | 'offline';
  lastSyncMinutesAgo: number;
  currentStockDays: number;
  stockOutRisk: number; // 0 to 1 calibrated quantile risk
  isCritical: boolean;
  censoredDaysCount: number;
  inventory: {
    medicineId: string;
    medicineName: string;
    unit: string;
    quantity: number;
    reorderLevel: number;
    leadTimeDays: number;
    expiryDate: string;
    reservedQuantity: number;
    consumptionPerDay: number;
  }[];
}

export interface SupplyRouteEdge {
  id: string;
  sourceId: string;
  targetId: string;
  distanceKm: number;
  baseEtaHours: number;
  roadQuality: 'national_highway' | 'state_highway' | 'rural_road';
  status: 'active' | 'congested' | 'blocked';
  blockedReason?: string;
  capacityUnits: number;
}

export interface AuditRecord {
  eventId: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  modelIdentifier: string;
  inputSnapshotId: string;
  outcome: string;
  hash: string;
}

export const INITIAL_NODES: PhcNode[] = [
  // Maharashtra Cluster (Chandrapur & Wardha focus)
  {
    id: 'WH-WARDHA',
    name: 'Wardha Regional Warehouse',
    type: 'warehouse',
    state: 'Maharashtra',
    district: 'Wardha',
    coord3D: [-2.2, 0.4, 0.2],
    bedsTotal: 0,
    bedsOccupied: 0,
    staffSanctioned: 18,
    staffPresent: 18,
    connectivityStatus: 'online',
    lastSyncMinutesAgo: 2,
    currentStockDays: 42.0,
    stockOutRisk: 0.02,
    isCritical: false,
    censoredDaysCount: 0,
    inventory: [
      { medicineId: 'MED-01', medicineName: 'IV Normal Saline 500ml', unit: 'bottles', quantity: 9400, reorderLevel: 2500, leadTimeDays: 2, expiryDate: '2027-11-30', reservedQuantity: 0, consumptionPerDay: 220 },
      { medicineId: 'MED-02', medicineName: 'Paracetamol 650mg', unit: 'strips', quantity: 18200, reorderLevel: 4000, leadTimeDays: 2, expiryDate: '2027-08-15', reservedQuantity: 0, consumptionPerDay: 410 },
      { medicineId: 'MED-03', medicineName: 'Dengue NS1 Rapid Ag Test', unit: 'kits', quantity: 4800, reorderLevel: 1200, leadTimeDays: 3, expiryDate: '2026-12-31', reservedQuantity: 0, consumptionPerDay: 95 }
    ]
  },
  {
    id: 'WH-NAGPUR',
    name: 'Nagpur Sub-State Depot',
    type: 'warehouse',
    state: 'Maharashtra',
    district: 'Nagpur',
    coord3D: [-1.8, 0.6, -1.2],
    bedsTotal: 0,
    bedsOccupied: 0,
    staffSanctioned: 24,
    staffPresent: 23,
    connectivityStatus: 'online',
    lastSyncMinutesAgo: 1,
    currentStockDays: 38.5,
    stockOutRisk: 0.03,
    isCritical: false,
    censoredDaysCount: 0,
    inventory: [
      { medicineId: 'MED-01', medicineName: 'IV Normal Saline 500ml', unit: 'bottles', quantity: 14500, reorderLevel: 3000, leadTimeDays: 3, expiryDate: '2028-03-31', reservedQuantity: 0, consumptionPerDay: 350 },
      { medicineId: 'MED-02', medicineName: 'Paracetamol 650mg', unit: 'strips', quantity: 24000, reorderLevel: 5000, leadTimeDays: 3, expiryDate: '2027-10-15', reservedQuantity: 0, consumptionPerDay: 580 },
      { medicineId: 'MED-03', medicineName: 'Dengue NS1 Rapid Ag Test', unit: 'kits', quantity: 7200, reorderLevel: 1500, leadTimeDays: 4, expiryDate: '2027-02-28', reservedQuantity: 0, consumptionPerDay: 140 }
    ]
  },
  {
    id: 'PHC-BALLARPUR',
    name: 'Ballarpur Model PHC',
    type: 'phc',
    state: 'Maharashtra',
    district: 'Chandrapur',
    coord3D: [0.8, 0.1, 0.8],
    bedsTotal: 12,
    bedsOccupied: 11,
    staffSanctioned: 6,
    staffPresent: 2, // Staff shortage signal!
    connectivityStatus: 'online',
    lastSyncMinutesAgo: 8,
    currentStockDays: 4.8,
    stockOutRisk: 0.78,
    isCritical: true,
    censoredDaysCount: 3,
    inventory: [
      { medicineId: 'MED-01', medicineName: 'IV Normal Saline 500ml', unit: 'bottles', quantity: 180, reorderLevel: 450, leadTimeDays: 5, expiryDate: '2026-10-30', reservedQuantity: 0, consumptionPerDay: 78 },
      { medicineId: 'MED-02', medicineName: 'Paracetamol 650mg', unit: 'strips', quantity: 420, reorderLevel: 800, leadTimeDays: 5, expiryDate: '2027-04-15', reservedQuantity: 0, consumptionPerDay: 160 },
      { medicineId: 'MED-03', medicineName: 'Dengue NS1 Rapid Ag Test', unit: 'kits', quantity: 35, reorderLevel: 120, leadTimeDays: 5, expiryDate: '2026-11-30', reservedQuantity: 0, consumptionPerDay: 28 }
    ]
  },
  {
    id: 'PHC-RAJURA',
    name: 'Rajura Rural PHC',
    type: 'phc',
    state: 'Maharashtra',
    district: 'Chandrapur',
    coord3D: [1.3, 0.1, 1.4],
    bedsTotal: 10,
    bedsOccupied: 9,
    staffSanctioned: 5,
    staffPresent: 4,
    connectivityStatus: 'intermittent',
    lastSyncMinutesAgo: 24,
    currentStockDays: 5.2,
    stockOutRisk: 0.72,
    isCritical: true,
    censoredDaysCount: 2,
    inventory: [
      { medicineId: 'MED-01', medicineName: 'IV Normal Saline 500ml', unit: 'bottles', quantity: 140, reorderLevel: 350, leadTimeDays: 5, expiryDate: '2026-12-15', reservedQuantity: 0, consumptionPerDay: 62 },
      { medicineId: 'MED-02', medicineName: 'Paracetamol 650mg', unit: 'strips', quantity: 380, reorderLevel: 700, leadTimeDays: 5, expiryDate: '2027-02-20', reservedQuantity: 0, consumptionPerDay: 130 },
      { medicineId: 'MED-03', medicineName: 'Dengue NS1 Rapid Ag Test', unit: 'kits', quantity: 24, reorderLevel: 90, leadTimeDays: 5, expiryDate: '2026-10-31', reservedQuantity: 0, consumptionPerDay: 22 }
    ]
  },
  {
    id: 'PHC-MUL',
    name: 'Mul Tribal Belt PHC',
    type: 'phc',
    state: 'Maharashtra',
    district: 'Chandrapur',
    coord3D: [1.1, 0.15, 0.2],
    bedsTotal: 8,
    bedsOccupied: 6,
    staffSanctioned: 4,
    staffPresent: 3,
    connectivityStatus: 'offline', // Offline testbed!
    lastSyncMinutesAgo: 145,
    currentStockDays: 3.9,
    stockOutRisk: 0.84,
    isCritical: true,
    censoredDaysCount: 5,
    inventory: [
      { medicineId: 'MED-01', medicineName: 'IV Normal Saline 500ml', unit: 'bottles', quantity: 95, reorderLevel: 300, leadTimeDays: 6, expiryDate: '2026-11-15', reservedQuantity: 0, consumptionPerDay: 54 },
      { medicineId: 'MED-02', medicineName: 'Paracetamol 650mg', unit: 'strips', quantity: 290, reorderLevel: 650, leadTimeDays: 6, expiryDate: '2027-01-31', reservedQuantity: 0, consumptionPerDay: 110 },
      { medicineId: 'MED-03', medicineName: 'Dengue NS1 Rapid Ag Test', unit: 'kits', quantity: 18, reorderLevel: 80, leadTimeDays: 6, expiryDate: '2026-10-30', reservedQuantity: 0, consumptionPerDay: 20 }
    ]
  },
  {
    id: 'PHC-WARORA',
    name: 'Warora Highway PHC',
    type: 'phc',
    state: 'Maharashtra',
    district: 'Chandrapur',
    coord3D: [-0.2, 0.1, 0.3],
    bedsTotal: 14,
    bedsOccupied: 10,
    staffSanctioned: 7,
    staffPresent: 6,
    connectivityStatus: 'online',
    lastSyncMinutesAgo: 5,
    currentStockDays: 6.5,
    stockOutRisk: 0.61,
    isCritical: false,
    censoredDaysCount: 1,
    inventory: [
      { medicineId: 'MED-01', medicineName: 'IV Normal Saline 500ml', unit: 'bottles', quantity: 310, reorderLevel: 400, leadTimeDays: 4, expiryDate: '2027-03-31', reservedQuantity: 0, consumptionPerDay: 65 },
      { medicineId: 'MED-02', medicineName: 'Paracetamol 650mg', unit: 'strips', quantity: 640, reorderLevel: 800, leadTimeDays: 4, expiryDate: '2027-06-30', reservedQuantity: 0, consumptionPerDay: 145 },
      { medicineId: 'MED-03', medicineName: 'Dengue NS1 Rapid Ag Test', unit: 'kits', quantity: 60, reorderLevel: 100, leadTimeDays: 4, expiryDate: '2026-12-15', reservedQuantity: 0, consumptionPerDay: 24 }
    ]
  },

  // Gujarat Cluster
  {
    id: 'WH-AHMEDABAD',
    name: 'Ahmedabad State Logistics Hub',
    type: 'warehouse',
    state: 'Gujarat',
    district: 'Ahmedabad',
    coord3D: [-3.8, 0.5, -2.5],
    bedsTotal: 0,
    bedsOccupied: 0,
    staffSanctioned: 30,
    staffPresent: 29,
    connectivityStatus: 'online',
    lastSyncMinutesAgo: 3,
    currentStockDays: 35.0,
    stockOutRisk: 0.04,
    isCritical: false,
    censoredDaysCount: 0,
    inventory: [
      { medicineId: 'MED-01', medicineName: 'IV Normal Saline 500ml', unit: 'bottles', quantity: 18500, reorderLevel: 4000, leadTimeDays: 2, expiryDate: '2027-12-31', reservedQuantity: 0, consumptionPerDay: 480 },
      { medicineId: 'MED-02', medicineName: 'Paracetamol 650mg', unit: 'strips', quantity: 32000, reorderLevel: 7000, leadTimeDays: 2, expiryDate: '2027-11-15', reservedQuantity: 0, consumptionPerDay: 820 },
      { medicineId: 'MED-03', medicineName: 'Dengue NS1 Rapid Ag Test', unit: 'kits', quantity: 9500, reorderLevel: 2000, leadTimeDays: 3, expiryDate: '2027-03-31', reservedQuantity: 0, consumptionPerDay: 180 }
    ]
  },
  {
    id: 'PHC-ANAND',
    name: 'Anand District PHC',
    type: 'phc',
    state: 'Gujarat',
    district: 'Anand',
    coord3D: [-3.3, 0.15, -1.8],
    bedsTotal: 12,
    bedsOccupied: 7,
    staffSanctioned: 6,
    staffPresent: 6,
    connectivityStatus: 'online',
    lastSyncMinutesAgo: 4,
    currentStockDays: 26.0,
    stockOutRisk: 0.08,
    isCritical: false,
    censoredDaysCount: 0,
    inventory: [
      { medicineId: 'MED-01', medicineName: 'IV Normal Saline 500ml', unit: 'bottles', quantity: 1100, reorderLevel: 350, leadTimeDays: 3, expiryDate: '2027-05-31', reservedQuantity: 0, consumptionPerDay: 42 },
      { medicineId: 'MED-02', medicineName: 'Paracetamol 650mg', unit: 'strips', quantity: 2400, reorderLevel: 600, leadTimeDays: 3, expiryDate: '2027-07-20', reservedQuantity: 0, consumptionPerDay: 95 },
      { medicineId: 'MED-03', medicineName: 'Dengue NS1 Rapid Ag Test', unit: 'kits', quantity: 380, reorderLevel: 90, leadTimeDays: 3, expiryDate: '2026-12-31', reservedQuantity: 0, consumptionPerDay: 14 }
    ]
  },

  // Odisha Cluster
  {
    id: 'WH-BHUBANESWAR',
    name: 'Bhubaneswar Central Medical Store',
    type: 'warehouse',
    state: 'Odisha',
    district: 'Khordha',
    coord3D: [3.8, 0.4, 0.8],
    bedsTotal: 0,
    bedsOccupied: 0,
    staffSanctioned: 22,
    staffPresent: 20,
    connectivityStatus: 'online',
    lastSyncMinutesAgo: 2,
    currentStockDays: 31.0,
    stockOutRisk: 0.05,
    isCritical: false,
    censoredDaysCount: 0,
    inventory: [
      { medicineId: 'MED-01', medicineName: 'IV Normal Saline 500ml', unit: 'bottles', quantity: 12000, reorderLevel: 3000, leadTimeDays: 3, expiryDate: '2027-09-30', reservedQuantity: 0, consumptionPerDay: 320 },
      { medicineId: 'MED-02', medicineName: 'Paracetamol 650mg', unit: 'strips', quantity: 21000, reorderLevel: 5000, leadTimeDays: 3, expiryDate: '2027-08-31', reservedQuantity: 0, consumptionPerDay: 610 },
      { medicineId: 'MED-03', medicineName: 'Dengue NS1 Rapid Ag Test', unit: 'kits', quantity: 6400, reorderLevel: 1500, leadTimeDays: 4, expiryDate: '2027-01-31', reservedQuantity: 0, consumptionPerDay: 130 }
    ]
  },
  {
    id: 'PHC-PURI',
    name: 'Puri Coastal PHC',
    type: 'phc',
    state: 'Odisha',
    district: 'Puri',
    coord3D: [4.4, 0.1, 1.6],
    bedsTotal: 10,
    bedsOccupied: 6,
    staffSanctioned: 5,
    staffPresent: 5,
    connectivityStatus: 'online',
    lastSyncMinutesAgo: 6,
    currentStockDays: 22.4,
    stockOutRisk: 0.11,
    isCritical: false,
    censoredDaysCount: 0,
    inventory: [
      { medicineId: 'MED-01', medicineName: 'IV Normal Saline 500ml', unit: 'bottles', quantity: 820, reorderLevel: 300, leadTimeDays: 4, expiryDate: '2027-04-30', reservedQuantity: 0, consumptionPerDay: 36 },
      { medicineId: 'MED-02', medicineName: 'Paracetamol 650mg', unit: 'strips', quantity: 1950, reorderLevel: 500, leadTimeDays: 4, expiryDate: '2027-06-15', reservedQuantity: 0, consumptionPerDay: 85 },
      { medicineId: 'MED-03', medicineName: 'Dengue NS1 Rapid Ag Test', unit: 'kits', quantity: 290, reorderLevel: 80, leadTimeDays: 4, expiryDate: '2026-11-30', reservedQuantity: 0, consumptionPerDay: 16 }
    ]
  }
];

export const INITIAL_ROUTES: SupplyRouteEdge[] = [
  {
    id: 'R-WARDHA-BALLARPUR',
    sourceId: 'WH-WARDHA',
    targetId: 'PHC-BALLARPUR',
    distanceKm: 134,
    baseEtaHours: 7.2,
    roadQuality: 'national_highway',
    status: 'active',
    capacityUnits: 3500
  },
  {
    id: 'R-WARDHA-RAJURA',
    sourceId: 'WH-WARDHA',
    targetId: 'PHC-RAJURA',
    distanceKm: 152,
    baseEtaHours: 7.8,
    roadQuality: 'state_highway',
    status: 'active',
    capacityUnits: 3000
  },
  {
    id: 'R-WARDHA-MUL',
    sourceId: 'WH-WARDHA',
    targetId: 'PHC-MUL',
    distanceKm: 118,
    baseEtaHours: 6.5,
    roadQuality: 'rural_road',
    status: 'active',
    capacityUnits: 2000
  },
  {
    id: 'R-NAGPUR-CHANDRAPUR',
    sourceId: 'WH-NAGPUR',
    targetId: 'PHC-BALLARPUR',
    distanceKm: 158,
    baseEtaHours: 8.5,
    roadQuality: 'national_highway',
    status: 'active',
    capacityUnits: 5000
  },
  {
    id: 'R-AHMEDABAD-ANAND',
    sourceId: 'WH-AHMEDABAD',
    targetId: 'PHC-ANAND',
    distanceKm: 76,
    baseEtaHours: 3.2,
    roadQuality: 'national_highway',
    status: 'active',
    capacityUnits: 4000
  },
  {
    id: 'R-BHUBANESWAR-PURI',
    sourceId: 'WH-BHUBANESWAR',
    targetId: 'PHC-PURI',
    distanceKm: 62,
    baseEtaHours: 2.8,
    roadQuality: 'national_highway',
    status: 'active',
    capacityUnits: 3000
  }
];

export const INITIAL_AUDIT_LOGS: AuditRecord[] = [
  {
    eventId: 'EVT-9001',
    timestamp: '2026-09-29 04:15:00 UTC',
    actor: 'SYSTEM_SITUATION_ENGINE',
    role: 'Automated Diagnostic',
    action: 'Deduplicated ingestion batch synced across 38 nodes',
    modelIdentifier: 'ingest-validator-v1.4',
    inputSnapshotId: 'SNAP-MH-0929-A',
    outcome: 'Normalized 482 telemetry records, zero data corruption',
    hash: '0x8f4c...b912'
  },
  {
    eventId: 'EVT-9002',
    timestamp: '2026-09-29 05:00:12 UTC',
    actor: 'FORECAST_ENGINE_P90',
    role: 'ML Quantile Service',
    action: 'Calculated 14-day demand forecast with censored stockout correction',
    modelIdentifier: 'healthgrid-fl-global-r12',
    inputSnapshotId: 'SNAP-MH-0929-B',
    outcome: 'Stock-out probability 78.3% computed for Chandrapur cluster',
    hash: '0x3e1a...7c4d'
  }
];
