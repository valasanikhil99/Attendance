import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TIMETABLE, SUBJECTS } from '../constants';
import { getDayIndex, getDayName } from '../utils/dateUtils';
import { AttendanceRecord, TimetableEntry, SubjectType } from '../types';
import {
  Check,
  X,
  Clock,
  Loader2,
  ArrowLeft,
  Palmtree,
  CalendarClock
} from 'lucide-react';
import { StorageService } from '../services/storageService';

interface DailyAttendanceProps {
  userId: string;
  date: string;
  records: AttendanceRecord[];
  isHoliday?: boolean;
  isFuture?: boolean;
  onBack?: () => void;
  title?: string;
  onRefresh?: () => void;
}

const DailyAttendance: React.FC<DailyAttendanceProps> = ({
  userId,
  date,
  records,
  isHoliday = false,
  isFuture = false,
  onBack,
  title,
  onRefresh
}) => {
  const [classes, setClasses] = useState<TimetableEntry[]>([]);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [togglingHoliday, setTogglingHoliday] = useState(false);
  const mountedRef = useRef(true);

  const dayIndex = getDayIndex(date);

  /** Prevent state updates after unmount */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /** Load classes for the day */
  useEffect(() => {
    const dayClasses = TIMETABLE
      .filter(t => t.dayIndex === dayIndex)
      .sort((a, b) => a.periodStart.localeCompare(b.periodStart));

    setClasses(dayClasses);
  }, [dayIndex]);

  /** Map records for O(1) access */
  const recordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    records.forEach(r => {
      map.set(`${r.timetableEntryId}_${r.date}`, r);
    });
    return map;
  }, [records]);

  const getRecord = (entryId: string) =>
    recordMap.get(`${entryId}_${date}`);

  const handleMark = async (
    entryId: string,
    status: 'PRESENT' | 'ABSENT'
  ) => {
    if (isFuture || isHoliday) return;

    setLoadingIds(prev => new Set(prev).add(entryId));

    try {
      await StorageService.markAttendance(userId, entryId, date, status);
      await onRefresh?.();
    } catch (e) {
      console.error('Mark attendance failed:', e);
    } finally {
      if (!mountedRef.current) return;

      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    }
  };

  const handleToggleHoliday = async () => {
    setTogglingHoliday(true);

    try {
      await StorageService.toggleHoliday(userId, date);
      await onRefresh?.();
    } catch (e) {
      console.error('Toggle holiday failed:', e);
    } finally {
      if (mountedRef.current) {
        setTogglingHoliday(false);
      }
    }
  };

  /** ---------- Header ---------- */
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
      <h2 className="text-2xl font-bold text-gray-900">
        {title || getDayName(dayIndex)}
      </h2>
      <p className="text-gray-500 text-sm">
        {new Date(date).toLocaleDateString(undefined, { dateStyle: 'long' })}
      </p>
    </div>
  );

  const HolidayToggleButton = ({ remove = false }: { remove?: boolean }) => (
    <button
      onClick={handleToggleHoliday}
      disabled={togglingHoliday}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition
        ${remove
          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
    >
      {togglingHoliday ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Palmtree size={16} />
      )}
      {remove ? 'Remove Holiday' : 'Mark as Holiday'}
    </button>
  );

  /** ---------- Holiday View ---------- */
  if (isHoliday) {
    return (
      <div>
        <Header />
        <div className="flex justify-end mb-4">
          <HolidayToggleButton remove />
        </div>
        <div className="flex flex-col items-center py-12 bg-purple-50 rounded-xl">
          <Palmtree size={32} className="text-purple-600 mb-4" />
          <h3 className="font-bold text-purple-800 text-xl">
            Enjoy your holiday!
          </h3>
          <p className="text-purple-600 text-sm">
            No classes tracked for today.
          </p>
        </div>
      </div>
    );
  }

  /** ---------- Sunday View ---------- */
  if (dayIndex === 0) {
    return (
      <div className="flex flex-col h-full">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 mb-4"
          >
            <ArrowLeft size={20} className="mr-1" /> Back
          </button>
        )}
        <div className="flex justify-end mb-4">
          <HolidayToggleButton />
        </div>
        <div className="flex flex-col items-center flex-1 text-gray-500">
          <Clock size={48} className="mb-4 text-brand-200" />
          <p className="font-medium">It’s Sunday!</p>
          <p className="text-sm">No classes scheduled.</p>
        </div>
      </div>
    );
  }

  /** ---------- Regular View ---------- */
  return (
    <div>
      <Header />
      <div className="flex justify-end mb-6">
        <HolidayToggleButton />
      </div>

      <div className="space-y-4">
        {classes.map(cls => {
          const subject = SUBJECTS[cls.subjectId];
          const record = getRecord(cls.id);
          const isLoading = loadingIds.has(cls.id);

          return (
            <div
              key={cls.id}
              className="bg-white p-4 rounded-xl border shadow-sm"
            >
              <h3 className="font-bold text-lg">
                {cls.displayName || subject.name}
              </h3>

              <div className="text-xs text-gray-500 mb-3">
                {cls.periodStart} – {cls.periodEnd}
                {subject.type === SubjectType.LAB && ' • 3 Periods'}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(['PRESENT', 'ABSENT'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => handleMark(cls.id, status)}
                    disabled={isLoading || isFuture}
                    className={`py-3 rounded-lg font-bold ${
                      record?.status === status
                        ? status === 'PRESENT'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                        : 'bg-gray-100'
                    }`}
                  >
                    {isLoading && record?.status === status ? (
                      <Loader2 className="animate-spin mx-auto" />
                    ) : status === 'PRESENT' ? (
                      <Check className="mx-auto" />
                    ) : (
                      <X className="mx-auto" />
                    )}
                  </button>
                ))}
              </div>

              {isFuture && (
                <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                  <CalendarClock size={12} />
                  Cannot mark future dates
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyAttendance;
