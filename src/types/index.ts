export interface MajorGroup {
  id: string;
  schoolName: string;
  groupName: string;
  planCount: number;
  previousRank: number;
  previousScore?: number;
}

export interface Volunteer {
  majorGroupId: string;
}

export interface Candidate {
  id: string;
  name: string;
  rank: number;
  score?: number;
  volunteers: Volunteer[];
}

export interface AdmissionResult {
  candidateId: string;
  majorGroupId: string | null;
  isSlid: boolean;
}

export interface MajorGroupResult {
  majorGroupId: string;
  actualCutoffRank: number;
  actualCutoffScore?: number;
  admittedCount: number;
  remainingCount: number;
  admittedCandidateIds: string[];
}

export interface SimulationResult {
  candidateResults: Map<string, AdmissionResult>;
  majorGroupResults: Map<string, MajorGroupResult>;
  slidCount: number;
  totalCandidates: number;
}

export type ProbabilityLevel = 'high' | 'medium' | 'low';

export type RiskLevel = 'safe' | 'moderate' | 'risky' | 'dangerous';

export interface VolunteerAssessment {
  majorGroupId: string;
  probability: number;
  level: ProbabilityLevel;
  label: '冲' | '稳' | '保';
}

export interface VolunteerTableAssessment {
  volunteerAssessments: VolunteerAssessment[];
  overallSlidProbability: number;
  riskLevel: RiskLevel;
  warnings: string[];
}

export interface AppData {
  majorGroups: MajorGroup[];
  myVolunteers: string[];
  myRank: number;
}
