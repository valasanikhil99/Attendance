import { AttendanceRecord, OverallStats, SubjectStats } from '../types';
import { SUBJECTS, TIMETABLE } from '../constants';

export const calculateStats = (records: AttendanceRecord[]): { overall: OverallStats, bySubject: SubjectStats[] } => {
  const subjectMap = new Map<string, { total: number, attended: number }>();
  
  // Initialize map
  Object.keys(SUBJECTS).forEach(key => {
    subjectMap.set(key, { total: 0, attended: 0 });
  });

  let grandTotal = 0;
  let grandAttended = 0;

  // We need to calculate total classes occurred SO FAR. 
  // In a real app, we'd query the DB for "all distinct dates marked".
  // For this mock, we assume the records array contains everything relevant.
  
  // However, users might miss marking a day entirely. 
  // For the sake of this simpler "Tracker", we only calculate based on Marked Entries.
  // Ideally, the system should auto-populate "ABSENT" if a day passes without entry.
  
  records.forEach(record => {
    const entry = TIMETABLE.find(t => t.id === record.timetableEntryId);
    if (!entry) return;

    const subject = SUBJECTS[entry.subjectId];
    if (!subject) return;

    const weight = subject.weight;
    const currentStats = subjectMap.get(entry.subjectId)!;

    // Add to subject stats
    currentStats.total += weight;
    grandTotal += weight;

    if (record.status === 'PRESENT') {
      currentStats.attended += weight;
      grandAttended += weight;
    }
  });

  // Transform to SubjectStats array
  const bySubject: SubjectStats[] = Array.from(subjectMap.entries()).map(([id, stats]) => {
    const subject = SUBJECTS[id];
    return {
      subjectId: id,
      subjectName: subject.name,
      totalClasses: stats.total,
      attendedClasses: stats.attended,
      percentage: stats.total === 0 ? 100 : Math.round((stats.attended / stats.total) * 100)
    };
  });

  const percentage = grandTotal === 0 ? 100 : (grandAttended / grandTotal) * 100;

  // Max Miss Calculation: floor((attended / 0.75) - total)
  // This formula tells you how many future classes you can miss while staying above 75%
  // assuming you have a buffer.
  const bunksAvailable = Math.floor((grandAttended / 0.75) - grandTotal);
  
  let status: 'SAFE' | 'WARNING' | 'DANGER' = 'SAFE';
  if (percentage < 65) status = 'DANGER';
  else if (percentage < 75) status = 'WARNING';

  return {
    overall: {
      totalClasses: grandTotal,
      attendedClasses: grandAttended,
      percentage: parseFloat(percentage.toFixed(1)),
      status,
      bunksAvailable: bunksAvailable > 0 ? bunksAvailable : 0
    },
    bySubject
  };
};