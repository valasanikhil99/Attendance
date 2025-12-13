import { AttendanceRecord, OverallStats, SubjectStats } from '../types';
import { SUBJECTS, TIMETABLE } from '../constants';

export const calculateStats = (
  records: AttendanceRecord[]
): { overall: OverallStats; bySubject: SubjectStats[] } => {
  // Fast lookup for timetable entries
  const timetableMap = new Map(
    TIMETABLE.map(t => [t.id, t])
  );

  /**
   * Deduplicate records:
   * key = date + timetableEntryId
   * last record wins
   */
  const uniqueRecords = new Map<string, AttendanceRecord>();
  for (const r of records) {
    uniqueRecords.set(`${r.date}_${r.timetableEntryId}`, r);
  }

  const subjectMap = new Map<
    string,
    { total: number; attended: number }
  >();

  Object.keys(SUBJECTS).forEach(id => {
    subjectMap.set(id, { total: 0, attended: 0 });
  });

  let grandTotal = 0;
  let grandAttended = 0;

  uniqueRecords.forEach(record => {
    const entry = timetableMap.get(record.timetableEntryId);
    if (!entry) return;

    const subject = SUBJECTS[entry.subjectId];
    if (!subject) return;

    const weight = subject.weight;
    const stats = subjectMap.get(entry.subjectId)!;

    stats.total += weight;
    grandTotal += weight;

    if (record.status === 'PRESENT') {
      stats.attended += weight;
      grandAttended += weight;
    }
  });

  const bySubject: SubjectStats[] = Array.from(subjectMap.entries()).map(
    ([subjectId, stats]) => {
      const subject = SUBJECTS[subjectId];
      const percentage =
        stats.total === 0
          ? null
          : Math.round((stats.attended / stats.total) * 100);

      return {
        subjectId,
        subjectName: subject.name,
        totalClasses: stats.total,
        attendedClasses: stats.attended,
        percentage
      };
    }
  );

  const percentage =
    grandTotal === 0
      ? 100
      : (grandAttended / grandTotal) * 100;

  /**
   * Bunks logic:
   * If already below 75%, you cannot bunk
   */
  let bunksAvailable = 0;
  if (percentage >= 75) {
    bunksAvailable = Math.floor(
      grandAttended / 0.75 - grandTotal
    );
  }

  let status: 'SAFE' | 'WARNING' | 'DANGER' = 'SAFE';
  if (percentage < 65) status = 'DANGER';
  else if (percentage < 75) status = 'WARNING';

  return {
    overall: {
      totalClasses: grandTotal,
      attendedClasses: grandAttended,
      percentage: parseFloat(percentage.toFixed(1)),
      status,
      bunksAvailable: Math.max(0, bunksAvailable)
    },
    bySubject
  };
};
