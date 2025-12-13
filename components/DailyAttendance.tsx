import React, { useState, useEffect } from 'react';
import { TIMETABLE, SUBJECTS, TERM_START_DATE } from '../constants';
import { getDayIndex, getDayName } from '../utils/dateUtils';
import { AttendanceRecord, TimetableEntry, SubjectType } from '../types';
import { Check, X, Clock, Loader2, ArrowLeft, Palmtree, Lock, CalendarClock } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface DailyAttendanceProps {
  userId: string;
  date: string; // YYYY-MM-DD
  records: AttendanceRecord[];
  isHoliday?: boolean;
  isFuture?: boolean;
  onBack?: () => void;
  title?: string;
  onRefresh?: () => void;
}

const DailyAttendance: React.FC<DailyAttendanceProps> = ({ 
  userId, date, records, isHoliday, isFuture = false, onBack, title, onRefresh 
}) => {
  const [classes, setClasses] = useState<TimetableEntry[]>([]);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [togglingHoliday, setTogglingHoliday] = useState(false);
  const [canToggleHoliday, setCanToggleHoliday] = useState(true); 
  const [lockReason, setLockReason] = useState('');
  
  const dayIndex = getDayIndex(date);

  useEffect(() => {
    // Filter timetable for the specific day
    const dayClasses = TIMETABLE.filter(t => t.dayIndex === dayIndex);
    // Sort by time
    dayClasses.sort((a, b) => a.periodStart.localeCompare(b.periodStart));
    setClasses(dayClasses);
  }, [dayIndex]);

  // Always allow holiday toggling
  useEffect(() => {
    setCanToggleHoliday(true);
    setLockReason("");
  }, [date, classes]);

  const handleMark = async (entryId: string, status: 'PRESENT' | 'ABSENT') => {
    if (isFuture) return;
    setLoadingIds(prev => new Set(prev).add(entryId));
    try {
      await StorageService.markAttendance(userId, entryId, date, status);
      if (onRefresh) await onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    }
  };

  const handleToggleHoliday = async () => {
    if (!canToggleHoliday) return;
    setTogglingHoliday(true);
    try {
      await StorageService.toggleHoliday(userId, date);
      if (onRefresh) await onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingHoliday(false);
    }
  };

  const getRecord = (entryId: string) => {
    return records.find(r => r.timetableEntryId === entryId && r.date === date);
  };

  // Header Component
  const Header = () => (
    <div className="mb-4">
      {onBack && (
        <button 
          onClick={onBack} 
          className="flex items-center text-gray-600 mb-2 hover:text-brand-600"
        >
          <ArrowLeft size={20} className="mr-1" /> Back
        </button>
      )}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title || getDayName(dayIndex)}</h2>
          <p className="text-gray-500 text-sm">
            {new Date(date).toLocaleDateString(undefined, { dateStyle: 'long' })}
          </p>
        </div>
      </div>
    </div>
  );

  const HolidayToggleButton = ({ isRemove = false }: { isRemove?: boolean }) => (
    <div className="flex flex-col items-end">
      <button 
        onClick={handleToggleHoliday}
        disabled={togglingHoliday || !canToggleHoliday}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isRemove 
            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
        }`}
        title={!canToggleHoliday ? lockReason : ''}
      >
        {togglingHoliday ? (
          <Loader2 size={16} className="animate-spin" />
        ) : !canToggleHoliday ? (
          <Lock size={16} />
        ) : (
          <Palmtree size={16} />
        )}
        {isRemove ? 'Remove Holiday' : 'Mark as Holiday'}
      </button>
      {!canToggleHoliday && (
        <span className="text-[10px] text-gray-400 mt-1 max-w-[200px] text-right">
          {lockReason}
        </span>
      )}
    </div>
  );

  // Holiday View
  if (isHoliday) {
    return (
      <div>
        <Header />
        
        {/* Toggle Button */}
        <div className="mb-4 flex justify-end">
          <HolidayToggleButton isRemove />
        </div>

        <div className="flex flex-col items-center justify-center py-12 bg-purple-50 rounded-2xl border border-purple-100">
          <div className="bg-purple-100 p-4 rounded-full mb-4">
             <Palmtree size={32} className="text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-purple-800">Enjoy your holiday!</h3>
          <p className="text-purple-600 text-sm mt-1">No classes tracked for today.</p>
        </div>
      </div>
    );
  }

  // Sunday View
  if (dayIndex === 0) {
    return (
      <div className="flex flex-col h-full">
        {onBack && (
           <button 
             onClick={onBack} 
             className="flex items-center text-gray-600 mb-4 hover:text-brand-600 self-start"
           >
             <ArrowLeft size={20} className="mr-1" /> Back to Calendar
           </button>
        )}

        <div className="flex justify-end w-full mb-4">
           <HolidayToggleButton />
        </div>

        <div className="flex flex-col items-center justify-center flex-1 py-12 text-gray-500">
          <Clock size={48} className="mb-4 text-brand-200" />
          <p className="text-lg font-medium">It's Sunday!</p>
          <p className="text-sm">No classes scheduled for {date}.</p>
        </div>
      </div>
    );
  }

  // Regular Class View
  return (
    <div>
      <Header />

      {/* Toggle Button */}
      <div className="mb-6 flex justify-end">
          <HolidayToggleButton />
      </div>

      <div className="space-y-4">
        {classes.map(cls => {
          const subject = SUBJECTS[cls.subjectId];
          const record = getRecord(cls.id);
          const isMarked = !!record;
          const isPresent = record?.status === 'PRESENT';
          const isAbsent = record?.status === 'ABSENT';
          const isLoading = loadingIds.has(cls.id);

          return (
            <div key={cls.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {cls.displayName || subject.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                      {cls.periodStart} - {cls.periodEnd}
                    </span>
                    {subject.type === SubjectType.LAB && (
                      <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        3 Periods
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  onClick={() => handleMark(cls.id, 'PRESENT')}
                  disabled={isLoading || isFuture}
                  className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isPresent 
                      ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-200' 
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  } ${isFuture ? 'grayscale opacity-60' : ''}`}
                >
                  {isLoading && isPresent ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                  Present
                </button>
                <button
                  onClick={() => handleMark(cls.id, 'ABSENT')}
                  disabled={isLoading || isFuture}
                  className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isAbsent 
                      ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-200' 
                      : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  } ${isFuture ? 'grayscale opacity-60' : ''}`}
                >
                   {isLoading && isAbsent ? <Loader2 size={20} className="animate-spin" /> : <X size={20} />}
                  Absent
                </button>
              </div>
              {isFuture && (
                <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-amber-600 bg-amber-50 py-1.5 px-3 rounded border border-amber-100">
                  <CalendarClock size={12} />
                  <span>Cannot mark attendance for future dates</span>
                </div>
              )}
            </div>
          );
        })}

        {classes.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No classes found for this date.
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyAttendance;