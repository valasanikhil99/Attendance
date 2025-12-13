import React from 'react';
import { getTodayDateString } from '../utils/dateUtils';
import { AttendanceRecord } from '../types';
import DailyAttendance from '../components/DailyAttendance';

interface TodayProps {
  userId: string;
  records: AttendanceRecord[];
  onRefresh?: () => void;
}

const Today: React.FC<TodayProps> = ({ userId, records, onRefresh }) => {
  const todayDate = getTodayDateString();

  return (
    <DailyAttendance 
      userId={userId} 
      date={todayDate} 
      records={records}
      title="Today's Classes"
      onRefresh={onRefresh}
    />
  );
};

export default Today;