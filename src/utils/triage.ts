import { RiskLevel } from '../types';

export interface TriageAssessment {
  level: RiskLevel;
  reasons: string[];
  recommendations: string[];
  bpCategory: string;
  glucoseCategory: string;
  bmiCategory: string;
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function assessTriage(params: {
  systolic: number;
  diastolic: number;
  bloodGlucose: number;
  glucoseType: 'Fasting' | 'Post-Meal' | 'Random';
  spo2: number;
  pulse: number;
  temperature: number;
  bmi: number;
  symptoms: string[];
  isPregnant?: boolean;
}): TriageAssessment {
  const reasons: string[] = [];
  const recommendations: string[] = [];
  let level: RiskLevel = 'Normal';

  // Blood Pressure Analysis
  let bpCategory = 'Normal';
  if (params.systolic >= 180 || params.diastolic >= 120) {
    bpCategory = 'Hypertensive Crisis';
    level = 'Critical';
    reasons.push(`Hypertensive Crisis (${params.systolic}/${params.diastolic} mmHg)`);
    recommendations.push('Immediate emergency medical evaluation. Rest resident quietly; do not wait.');
  } else if (params.systolic >= 140 || params.diastolic >= 90) {
    bpCategory = 'Stage 2 Hypertension';
    level = 'Moderate';
    reasons.push(`Stage 2 Hypertension (${params.systolic}/${params.diastolic} mmHg)`);
    recommendations.push('Schedule clinic physician review within 48-72 hours. Review salt intake & medications.');
  } else if (params.systolic >= 130 || params.diastolic >= 80) {
    bpCategory = 'Stage 1 Hypertension';
    if (level === 'Normal') level = 'Moderate';
    reasons.push(`Stage 1 Hypertension (${params.systolic}/${params.diastolic} mmHg)`);
    recommendations.push('Lifestyle counseling: dietary modifications, moderate physical activity, follow-up in 2 weeks.');
  } else if (params.systolic >= 120 && params.diastolic < 80) {
    bpCategory = 'Elevated BP';
  } else if (params.systolic < 90 || params.diastolic < 60) {
    bpCategory = 'Hypotension';
    if (level === 'Normal') level = 'Moderate';
    reasons.push(`Hypotension (${params.systolic}/${params.diastolic} mmHg)`);
    recommendations.push('Evaluate hydration, check for dizziness or fainting; provide oral fluids if conscious.');
  }

  // SpO2 Analysis
  if (params.spo2 > 0 && params.spo2 < 90) {
    level = 'Critical';
    reasons.push(`Severe Hypoxemia (SpO2 ${params.spo2}%)`);
    recommendations.push('Administer supplemental oxygen if available at health post; urgent hospital transfer required.');
  } else if (params.spo2 >= 90 && params.spo2 < 94) {
    if (level !== 'Critical') level = 'Moderate';
    reasons.push(`Mild Hypoxemia (SpO2 ${params.spo2}%)`);
    recommendations.push('Check airway and respiratory rate. Monitor closely every 15-30 minutes.');
  }

  // Blood Glucose Analysis
  let glucoseCategory = 'Normal';
  if (params.bloodGlucose > 0) {
    if (params.bloodGlucose < 70) {
      glucoseCategory = 'Hypoglycemia';
      if (level !== 'Critical') level = 'Moderate';
      if (params.bloodGlucose < 54) level = 'Critical';
      reasons.push(`Hypoglycemia (${params.bloodGlucose} mg/dL)`);
      recommendations.push('Rule of 15: Give 15g fast-acting sugar (fruit juice or 3 tsp sugar in water); recheck in 15 mins.');
    } else if (params.glucoseType === 'Fasting') {
      if (params.bloodGlucose >= 126) {
        glucoseCategory = 'Diabetic Range';
        if (level === 'Normal') level = 'Moderate';
        reasons.push(`High Fasting Blood Sugar (${params.bloodGlucose} mg/dL)`);
        recommendations.push('Refer for HbA1c testing and comprehensive diabetes management plan.');
      } else if (params.bloodGlucose >= 100) {
        glucoseCategory = 'Pre-diabetes / Impaired';
      }
    } else {
      // Post-meal or random
      if (params.bloodGlucose >= 200) {
        glucoseCategory = 'High Hyperglycemia';
        if (params.bloodGlucose >= 350) level = 'Critical';
        else if (level === 'Normal') level = 'Moderate';
        reasons.push(`Elevated Random Blood Sugar (${params.bloodGlucose} mg/dL)`);
        recommendations.push('Evaluate for ketones/dehydration symptoms. Medical provider consultation recommended.');
      }
    }
  }

  // Temperature Analysis
  if (params.temperature >= 103) {
    level = 'Critical';
    reasons.push(`High Hyperpyrexia (${params.temperature}°F)`);
    recommendations.push('Cold sponging, oral paracetamol per protocol, investigate for acute bacterial or malaria infection.');
  } else if (params.temperature >= 100.4) {
    if (level === 'Normal') level = 'Moderate';
    reasons.push(`Febrile state (${params.temperature}°F)`);
    recommendations.push('Encourage hydration, paracetamol if uncomfortable, monitor for 48 hours.');
  }

  // Pulse Analysis
  if (params.pulse > 120) {
    if (level !== 'Critical') level = 'Moderate';
    reasons.push(`Tachycardia (${params.pulse} bpm)`);
  } else if (params.pulse < 50 && params.pulse > 0) {
    if (level !== 'Critical') level = 'Moderate';
    reasons.push(`Bradycardia (${params.pulse} bpm)`);
  }

  // BMI Category
  let bmiCategory = 'Normal';
  if (params.bmi > 0) {
    if (params.bmi < 18.5) bmiCategory = 'Underweight';
    else if (params.bmi >= 30) bmiCategory = 'Obese';
    else if (params.bmi >= 25) bmiCategory = 'Overweight';
  }

  // High Risk Red Flag Symptoms
  const criticalSymptoms = ['Chest Pain', 'Severe Shortness of Breath', 'Loss of Consciousness', 'Severe Dehydration / Lethargy', 'Convulsions'];
  for (const sym of params.symptoms) {
    if (criticalSymptoms.includes(sym)) {
      level = 'Critical';
      reasons.push(`Red-flag symptom: ${sym}`);
      recommendations.push('Red flag symptom detected! Priority transfer to Secondary Health Center.');
    }
  }

  // Maternal considerations
  if (params.isPregnant) {
    if (params.systolic >= 140 || params.diastolic >= 90) {
      level = 'Critical';
      reasons.push('Gestational Hypertension / Suspected Pre-eclampsia');
      recommendations.push('Urgent obstetric referral needed to evaluate for pre-eclampsia. Check urine protein.');
    }
  }

  if (reasons.length === 0) {
    recommendations.push('Vitals are within expected ranges. Continue regular preventative health routines.');
  }

  return {
    level,
    reasons,
    recommendations,
    bpCategory,
    glucoseCategory,
    bmiCategory
  };
}
