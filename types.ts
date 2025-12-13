export enum SubjectType {
  THEORY = 'THEORY',
  LAB = 'LAB'
}

export interface Subject {
  id: string;
  name: string;
  type: SubjectType;
  weight: number; // 1 for theory, 3 for lab
}

export interface TimetableEntry {
  id: string;
  dayIndex: number; // 1 (Mon) to 6 (Sat), 0 (Sun)
  subjectId: string;
  displayName?: string; // e.g. "DL&CO (CLC)"
  periodStart: string; // "09:00"
  periodEnd: string;
}

export interface User {
  id: string;
  name: string;
  rollNumber: string;
}

export interface AttendanceRecord {
  id: string;
  timetableEntryId: string;
  date: string; // ISO Date string YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT';
}

export interface HolidayRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
}

export interface SubjectStats {
  subjectId: string;
  subjectName: string;
  totalClasses: number; // Weighted
  attendedClasses: number; // Weighted
  percentage: number;
}

export interface OverallStats {
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  status: 'SAFE' | 'WARNING' | 'DANGER';
  bunksAvailable: number; // How many can I miss?
}