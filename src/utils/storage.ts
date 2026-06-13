import type { AppData, MajorGroup } from '../types';
import { mockMajorGroups } from '../data/mockData';

const STORAGE_KEY = 'parallel-volunteer-simulator-data';

export function loadFromStorage(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }

  return getDefaultData();
}

export function saveToStorage(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function getDefaultData(): AppData {
  return {
    majorGroups: [...mockMajorGroups],
    myVolunteers: ['mg-001', 'mg-003', 'mg-006', 'mg-010', 'mg-015', 'mg-018'],
    myRank: 2000,
  };
}

export function exportToJSON(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importFromJSON(jsonString: string): AppData {
  const data = JSON.parse(jsonString);
  if (!validateAppData(data)) {
    throw new Error('无效的数据格式');
  }
  return data;
}

function validateAppData(data: unknown): data is AppData {
  if (typeof data !== 'object' || data === null) return false;

  const d = data as Record<string, unknown>;

  if (!Array.isArray(d.majorGroups)) return false;
  if (!d.majorGroups.every((mg: unknown) => validateMajorGroup(mg))) return false;

  if (!Array.isArray(d.myVolunteers)) return false;
  if (!d.myVolunteers.every((id: unknown) => typeof id === 'string')) return false;

  if (typeof d.myRank !== 'number' || d.myRank <= 0) return false;

  return true;
}

function validateMajorGroup(mg: unknown): mg is MajorGroup {
  if (typeof mg !== 'object' || mg === null) return false;

  const m = mg as Record<string, unknown>;

  return (
    typeof m.id === 'string' &&
    typeof m.schoolName === 'string' &&
    typeof m.groupName === 'string' &&
    typeof m.planCount === 'number' &&
    m.planCount > 0 &&
    typeof m.previousRank === 'number' &&
    m.previousRank > 0
  );
}

export function downloadJSON(data: AppData, filename: string = 'volunteer-data.json'): void {
  const jsonStr = exportToJSON(data);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
