import { Subject, SubjectType, TimetableEntry } from './types';

// Subject Definitions
export const SUBJECTS: Record<string, Subject> = {
  EVS: { id: 'EVS', name: 'Environmental Science', type: SubjectType.THEORY, weight: 1 },
  DL_CO: { id: 'DL_CO', name: 'DL & CO', type: SubjectType.THEORY, weight: 1 },
  P_S: { id: 'P_S', name: 'Prob & Stats', type: SubjectType.THEORY, weight: 1 },
  ML: { id: 'ML', name: 'Machine Learning', type: SubjectType.THEORY, weight: 1 },
  DTI: { id: 'DTI', name: 'Design Thinking', type: SubjectType.THEORY, weight: 1 },
  DBMS: { id: 'DBMS', name: 'DBMS', type: SubjectType.THEORY, weight: 1 },
  OT: { id: 'OT', name: 'Optimization Tech', type: SubjectType.THEORY, weight: 1 },
  COUNSELING: { id: 'COUNSELING', name: 'Counseling', type: SubjectType.THEORY, weight: 1 },
  AI_ML_LAB: { id: 'AI_ML_LAB', name: 'AI & ML Lab', type: SubjectType.LAB, weight: 3 },
  FSD_LAB: { id: 'FSD_LAB', name: 'Full Stack Lab', type: SubjectType.LAB, weight: 3 },
  DBMS_LAB: { id: 'DBMS_LAB', name: 'DBMS Lab', type: SubjectType.LAB, weight: 3 },
};

// Timetable Definition (1=Mon, 6=Sat)
// Mapped to new timings based on provided schedule

export const TIMETABLE: TimetableEntry[] = [
  // MONDAY
  { id: 'mon_1', dayIndex: 1, subjectId: 'EVS', periodStart: '09:30', periodEnd: '10:20' },
  { id: 'mon_2', dayIndex: 1, subjectId: 'DL_CO', periodStart: '10:20', periodEnd: '11:10' },
  { id: 'mon_3', dayIndex: 1, subjectId: 'P_S', periodStart: '11:10', periodEnd: '12:00' },
  { id: 'mon_4', dayIndex: 1, subjectId: 'DL_CO', displayName: 'DL&CO (CLC)', periodStart: '12:00', periodEnd: '12:50' },
  { id: 'mon_5', dayIndex: 1, subjectId: 'ML', displayName: 'ML (CLC)', periodStart: '13:50', periodEnd: '14:40' },
  { id: 'mon_6', dayIndex: 1, subjectId: 'DTI', periodStart: '14:40', periodEnd: '15:30' },
  { id: 'mon_7', dayIndex: 1, subjectId: 'COUNSELING', periodStart: '15:30', periodEnd: '16:20' },

  // TUESDAY
  { id: 'tue_1', dayIndex: 2, subjectId: 'DBMS', periodStart: '09:30', periodEnd: '10:20' },
  { id: 'tue_2', dayIndex: 2, subjectId: 'AI_ML_LAB', displayName: 'AI & ML LAB', periodStart: '10:20', periodEnd: '12:50' }, // 3 Periods
  { id: 'tue_3', dayIndex: 2, subjectId: 'P_S', periodStart: '13:50', periodEnd: '14:40' },
  { id: 'tue_4', dayIndex: 2, subjectId: 'OT', periodStart: '14:40', periodEnd: '15:30' },
  { id: 'tue_5', dayIndex: 2, subjectId: 'OT', displayName: 'OT (CLC)', periodStart: '15:30', periodEnd: '16:20' },

  // WEDNESDAY
  { id: 'wed_1', dayIndex: 3, subjectId: 'DL_CO', periodStart: '09:30', periodEnd: '10:20' },
  { id: 'wed_2', dayIndex: 3, subjectId: 'EVS', periodStart: '10:20', periodEnd: '11:10' },
  { id: 'wed_3', dayIndex: 3, subjectId: 'OT', periodStart: '11:10', periodEnd: '12:00' },
  { id: 'wed_4', dayIndex: 3, subjectId: 'DTI', periodStart: '12:00', periodEnd: '12:50' },
  { id: 'wed_5', dayIndex: 3, subjectId: 'DBMS', periodStart: '13:50', periodEnd: '14:40' },
  { id: 'wed_6', dayIndex: 3, subjectId: 'ML', periodStart: '14:40', periodEnd: '15:30' },
  { id: 'wed_7', dayIndex: 3, subjectId: 'P_S', periodStart: '15:30', periodEnd: '16:20' },

  // THURSDAY
  { id: 'thu_1', dayIndex: 4, subjectId: 'DBMS', periodStart: '09:30', periodEnd: '10:20' },
  { id: 'thu_2', dayIndex: 4, subjectId: 'ML', periodStart: '10:20', periodEnd: '11:10' },
  { id: 'thu_3', dayIndex: 4, subjectId: 'P_S', displayName: 'P&S (CLC)', periodStart: '11:10', periodEnd: '12:00' },
  { id: 'thu_4', dayIndex: 4, subjectId: 'OT', periodStart: '12:00', periodEnd: '12:50' },
  { id: 'thu_5', dayIndex: 4, subjectId: 'DTI', displayName: 'DTI (CLC)', periodStart: '13:50', periodEnd: '14:40' },
  { id: 'thu_6', dayIndex: 4, subjectId: 'DL_CO', periodStart: '14:40', periodEnd: '15:30' },
  { id: 'thu_7', dayIndex: 4, subjectId: 'DBMS', displayName: 'DBMS (CLC)', periodStart: '15:30', periodEnd: '16:20' },

  // FRIDAY
  { id: 'fri_1', dayIndex: 5, subjectId: 'ML', periodStart: '09:30', periodEnd: '10:20' },
  { id: 'fri_2', dayIndex: 5, subjectId: 'FSD_LAB', displayName: 'FSD-I LAB', periodStart: '10:20', periodEnd: '12:50' }, // 3 Periods
  { id: 'fri_3', dayIndex: 5, subjectId: 'P_S', periodStart: '13:50', periodEnd: '14:40' },
  { id: 'fri_4', dayIndex: 5, subjectId: 'DTI', periodStart: '14:40', periodEnd: '15:30' },
  { id: 'fri_5', dayIndex: 5, subjectId: 'OT', periodStart: '15:30', periodEnd: '16:20' },

  // SATURDAY
  { id: 'sat_1', dayIndex: 6, subjectId: 'DTI', periodStart: '09:30', periodEnd: '10:20' },
  { id: 'sat_2', dayIndex: 6, subjectId: 'ML', periodStart: '10:20', periodEnd: '11:10' },
  { id: 'sat_3', dayIndex: 6, subjectId: 'DBMS', periodStart: '11:10', periodEnd: '12:00' },
  { id: 'sat_4', dayIndex: 6, subjectId: 'DL_CO', periodStart: '12:00', periodEnd: '12:50' },
  { id: 'sat_5', dayIndex: 6, subjectId: 'DBMS_LAB', displayName: 'DBMS LAB', periodStart: '13:50', periodEnd: '16:20' }, // 3 Periods
];

export const TERM_START_DATE = '2025-12-10'; // YYYY-MM-DD