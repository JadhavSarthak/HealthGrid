export type RiskLevel = 'Normal' | 'Moderate' | 'Critical';

export type ZoneName = 
  | 'Ward 1 - North Colony'
  | 'Ward 2 - Riverside Hamlet'
  | 'Ward 3 - Central Market'
  | 'Ward 4 - East Highlands'
  | 'Ward 5 - Industrial Sector';

export interface VitalRecord {
  id: string;
  residentId: string;
  residentName: string;
  timestamp: string;
  systolic: number; // mmHg
  diastolic: number; // mmHg
  bloodGlucose: number; // mg/dL
  glucoseType: 'Fasting' | 'Post-Meal' | 'Random';
  spo2: number; // %
  pulse: number; // bpm
  temperature: number; // °F
  weightKg: number;
  heightCm: number;
  bmi: number;
  symptoms: string[];
  notes: string;
  screenerName: string;
  triageLevel: RiskLevel;
}

export interface Resident {
  id: string;
  householdId: string;
  fullName: string;
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  zone: ZoneName;
  contactNumber: string;
  address: string;
  chronicConditions: string[]; // e.g. Hypertension, Type-2 Diabetes, Asthma, None
  allergies: string[];
  vaccinationStatus: 'Fully Vaccinated' | 'Partially Vaccinated' | 'Pending Routine' | 'Unvaccinated';
  isPregnant?: boolean;
  trimester?: number;
  riskLevel: RiskLevel;
  primaryCareWorker: string;
  lastScreeningDate?: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
}

export interface OutbreakAlert {
  id: string;
  diseaseName: string;
  syndromeCategory: 'Waterborne / GI' | 'Vector-Borne (Dengue/Malaria)' | 'Acute Respiratory (ARI)' | 'Skin / Contact' | 'Unknown Febrile';
  zone: ZoneName;
  reportedCasesCount: number;
  severity: 'Low' | 'Moderate' | 'High' | 'Severe Outbreak';
  firstReportedDate: string;
  status: 'Investigating' | 'Active Containment' | 'Contained' | 'Resolved';
  containmentActions: string[];
  waterSourceStatus?: string;
  alertNote: string;
}

export interface HealthCampaign {
  id: string;
  title: string;
  category: 'Immunization' | 'Non-Communicable Disease (NCD)' | 'Maternal & Child Health' | 'Water & Sanitation (WASH)' | 'Eye & Dental Screening';
  targetZone: ZoneName;
  startDate: string;
  endDate: string;
  venue: string;
  status: 'Upcoming' | 'Active Today' | 'Completed';
  targetBeneficiaries: number;
  screenedCount: number;
  leadCoordinator: string;
  volunteersEnrolled: number;
  suppliesProvided: string[];
  notes: string;
}

export interface MedicalSupply {
  id: string;
  name: string;
  category: 'Oral Hydration & Vitals' | 'Essential Medicines' | 'Diagnostic Kits' | 'First Aid & Delivery Kits';
  currentStock: number;
  minThreshold: number;
  unit: string;
  facility: string;
  lastRestocked: string;
  status: 'Adequate' | 'Low Stock' | 'Critical Shortage';
}

export interface CommunityZoneMetric {
  zone: ZoneName;
  totalPopulation: number;
  screenedResidents: number;
  highRiskCount: number;
  waterQualityIndex: 'Potable (Clean)' | 'Turbid / Needs Boiling' | 'High Contamination Alert';
  primaryIssue: string;
  healthWorker: string;
}
