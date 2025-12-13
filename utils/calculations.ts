import { AttendanceRecord, OverallStats, SubjectStats, HolidayRecord } from '../types';
import { SUBJECTS, TIMETABLE, TERM_START_DATE } from '../constants';

export const calculateStats = (records: AttendanceRecord[], holidays: HolidayRecord[]): { overall: OverallStats, bySubject: SubjectStats[] } => {
  const subjectMap = new Map<string, { total: number, attended: number }>();
  
  // Initialize map
  Object.keys(SUBJECTS).forEach(key => {
    subjectMap.set(key, { total: 0, attended: 0 });
  });

  let grandTotal = 0;
  let grandAttended = 0;

  // Create a lookup set for Present records to speed up the loop
  // Format: "YYYY-MM-DD_timetableEntryId"
  const presentRecordSet = new Set<string>();
  records.forEach(r => {
    if (r.status === 'PRESENT') {
      presentRecordSet.add(`${r.date}_${r.timetableEntryId}`);
    }
  });

  // Create a lookup set for Holidays
  const holidaySet = new Set(holidays.map(h => h.date));

  // --- STEP 1: Process Past Dates (from Term Start up to Yesterday) ---
  // We count ALL scheduled classes as 'Total', even if not marked.
  // We count 'Attended' only if explicitly marked Present.
  
  const [startYear, startMonth, startDay] = TERM_START_DATE.split('-').map(Number);
  const currentDate = new Date(startYear, startMonth - 1, startDay);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper to format date as YYYY-MM-DD
  const toDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  while (currentDate < today) {
    const dateStr = toDateStr(currentDate);
    const dayIndex = currentDate.getDay(); // 0=Sun, 1=Mon...

    // Skip if Holiday
    if (!holidaySet.has(dateStr)) {
      // Get classes for this day index
      const dayClasses = TIMETABLE.filter(t => t.dayIndex === dayIndex);
      
      // If classes exist for this day (handles Sundays if timetable has them, otherwise empty)
      dayClasses.forEach(entry => {
        const subject = SUBJECTS[entry.subjectId];
        if (subject) {
          // It's a past day, so the class "Should have occurred"
          subjectMap.get(entry.subjectId)!.total += subject.weight;
          grandTotal += subject.weight;

          // Check if marked PRESENT
          if (presentRecordSet.has(`${dateStr}_${entry.id}`)) {
            subjectMap.get(entry.subjectId)!.attended += subject.weight;
            grandAttended += subject.weight;
          }
        }
      });
    }

    // Next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // --- STEP 2: Process Today & Future (if any records exist) ---
  // For today, we ONLY count classes that have been marked (Present OR Absent).
  // This prevents the percentage from dropping in the morning before classes start.
  
  const todayStr = toDateStr(today);

  // Filter records that are Today or Future (though Future shouldn't exist ideally)
  const recentRecords = records.filter(r => r.date >= todayStr);

  recentRecords.forEach(record => {
    const entry = TIMETABLE.find(t => t.id === record.timetableEntryId);
    if (!entry) return;

    const subject = SUBJECTS[entry.subjectId];
    if (!subject) return;

    // If a record exists (Present OR Absent), we count it in Total
    subjectMap.get(entry.subjectId)!.total += subject.weight;
    grandTotal += subject.weight;

    if (record.status === 'PRESENT') {
      subjectMap.get(entry.subjectId)!.attended += subject.weight;
      grandAttended += subject.weight;
    }
  });

  // --- Calculate Final Stats ---

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

  // Max Miss Calculation
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