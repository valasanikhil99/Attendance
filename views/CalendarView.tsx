import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AttendanceRecord, HolidayRecord } from '../types';
import { TIMETABLE, TERM_START_DATE } from '../constants';
import DailyAttendance from '../components/DailyAttendance';

interface CalendarViewProps {
  userId: string;
  records: AttendanceRecord[];
  holidays: HolidayRecord[];
  onRefresh?: () => void;
}

type DayStatus = 'full' | 'partial' | 'absent' | 'empty' | 'weekend' | 'holiday' | 'disabled';

const CalendarView: React.FC<CalendarViewProps> = ({ userId, records, holidays, onRefresh }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  // State to track if a specific date is opened for editing
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper to change month
  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  // Helper to format Date object to YYYY-MM-DD local string safely
  const formatDateLocal = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDayStatus = (date: Date): DayStatus => {
    const dateStr = formatDateLocal(date);
    const dayIndex = date.getDay(); // 0 = Sun

    // Check if holiday (Priority over disabled/weekend)
    if (holidays.some(h => h.date === dateStr)) return 'holiday';

    // Check if before term start
    const [startYear, startMonth, startDay] = TERM_START_DATE.split('-').map(Number);
    const startDate = new Date(startYear, startMonth - 1, startDay);
    // Reset time components for accurate comparison
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (compareDate < startDate) return 'disabled';

    if (dayIndex === 0) return 'weekend';

    // Get expected classes for this day of week from Timetable
    const expectedClasses = TIMETABLE.filter(t => t.dayIndex === dayIndex);
    if (expectedClasses.length === 0) return 'weekend';

    // Get records for this specific date
    const dayRecords = records.filter(r => r.date === dateStr);

    if (dayRecords.length === 0) return 'empty'; // No data entered

    // Calculate totals
    const presentCount = dayRecords.filter(r => r.status === 'PRESENT').length;
    const absentCount = dayRecords.filter(r => r.status === 'ABSENT').length;
    
    if (presentCount === expectedClasses.length && absentCount === 0) return 'full';
    if (presentCount === 0 && absentCount > 0) return 'absent';
    return 'partial';
  };

  const handleDateClick = (date: Date, status: DayStatus, isFuture: boolean) => {
    // Prevent disabled dates (before term start), but allow future dates for holiday marking
    if (status === 'disabled') return;
    
    setSelectedDate(formatDateLocal(date));
  };

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 Sun - 6 Sat
    
    const days = [];
    
    // Empty slots for prev month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [year, month]);

  const getStatusColor = (status: DayStatus, isFuture: boolean) => {
    // Base classes for clickable items
    const base = 'cursor-pointer transition-transform active:scale-95';

    // Check holiday first so future holidays look like holidays
    if (status === 'holiday') return `${base} bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200`;
    
    // Check disabled (past dates before term start)
    if (status === 'disabled') return 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed';

    // Future dates (clickable now, but visually distinct if not a holiday)
    if (isFuture) return `${base} bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-200 hover:bg-white`;

    switch (status) {
      case 'full': return `${base} bg-emerald-100 text-emerald-700 border-emerald-200 font-bold hover:bg-emerald-200`;
      case 'absent': return `${base} bg-rose-100 text-rose-700 border-rose-200 font-bold hover:bg-rose-200`;
      case 'partial': return `${base} bg-amber-100 text-amber-700 border-amber-200 font-bold hover:bg-amber-200`;
      case 'weekend': return `${base} bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100`;
      case 'empty': return `${base} bg-white text-gray-500 border-gray-200 hover:border-brand-300 hover:shadow-sm`;
      default: return `${base} bg-white`;
    }
  };

  const today = new Date();
  today.setHours(0,0,0,0);

  // If a date is selected, show the DailyAttendance view for that date
  if (selectedDate) {
    const isHoliday = holidays.some(h => h.date === selectedDate);
    const todayStr = formatDateLocal(today);
    const isFutureDate = selectedDate > todayStr;

    return (
      <DailyAttendance 
        userId={userId} 
        date={selectedDate} 
        records={records}
        isHoliday={isHoliday}
        isFuture={isFutureDate}
        onBack={() => setSelectedDate(null)}
        title={new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long' })}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-gray-800">
            {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Grid Header */}
        <div className="grid grid-cols-7 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => {
            if (!date) return <div key={`empty-${index}`} />;

            const isFuture = date > today;
            const status = getDayStatus(date);
            const isToday = date.getTime() === today.getTime();

            return (
              <div 
                key={date.getDate()}
                onClick={() => handleDateClick(date, status, isFuture)}
                className={`
                  aspect-square rounded-lg flex items-center justify-center text-sm border
                  ${getStatusColor(status, isFuture)}
                  ${isToday && status !== 'disabled' && !isFuture ? 'ring-2 ring-brand-500 ring-offset-1' : ''}
                `}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div>
            <span className="text-xs text-gray-600">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-rose-100 border border-rose-200"></div>
            <span className="text-xs text-gray-600">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div>
            <span className="text-xs text-gray-600">Partial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-100 border border-purple-200"></div>
            <span className="text-xs text-gray-600">Holiday</span>
          </div>
        </div>
      </div>
      
      <div className="text-center text-xs text-gray-400">
        Select a date to view or modify attendance.
      </div>
    </div>
  );
};

export default CalendarView;