import React from 'react';
import { getTodayDateString } from '../utils/dateUtils';
import { AttendanceRecord } from '../types';
import DailyAttendance from '../components/DailyAttendance';
import { AlertTriangle, ChevronRight } from 'lucide-react';

interface TodayProps {
  userId: string;
  records: AttendanceRecord[];
  missingDates?: string[];
  onSwitchToCalendar?: () => void;
  onRefresh?: () => void;
}

const Today: React.FC<TodayProps> = ({ userId, records, missingDates = [], onSwitchToCalendar, onRefresh }) => {
  const todayDate = getTodayDateString();

  return (
    <div className="space-y-4">
      {/* Missing Attendance Warning */}
      {missingDates.length > 0 && (
        <div 
          onClick={onSwitchToCalendar}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:bg-amber-100 transition-colors"
        >
          <div className="bg-amber-100 p-2 rounded-full text-amber-600">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-amber-800 text-sm">Action Required</h3>
            <p className="text-xs text-amber-700 mt-1">
              You haven't marked attendance for {missingDates.length} past days.
              <span className="block mt-1 font-semibold">
                {missingDates.slice(0, 2).join(', ')} {missingDates.length > 2 && `+ ${missingDates.length - 2} more`}
              </span>
            </p>
          </div>
          <ChevronRight className="text-amber-400 self-center" size={20} />
        </div>
      )}

      <DailyAttendance 
        userId={userId} 
        date={todayDate} 
        records={records}
        title="Today's Classes"
        onRefresh={onRefresh}
      />
    </div>
  );
};

export default Today;