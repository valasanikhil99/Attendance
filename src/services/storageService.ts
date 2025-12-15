import api from './api';
import { AttendanceRecord, User, HolidayRecord } from '../types';
import { realtime } from './realtimeService';
import { TIMETABLE, TERM_START_DATE } from '../constants';
import { getTodayDateString } from '../utils/dateUtils';

// We only store the Token and minimal Session info in localStorage now.
// The heavy data lives in the database.
const SESSION_KEY = 'classtrack_session';

export const StorageService = {
  // --- Auth ---
  
  async login(rollNumber: string, password: string): Promise<User | null> {
    try {
      const response = await api.post('/auth/login', { rollNumber, password });
      const { user, token } = response.data;
      
      // Save Token for future API calls
      localStorage.setItem('token', token);
      // Save Basic User Info for UI
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error("Login failed", error);
      return null;
    }
  },

  async register(name: string, rollNumber: string, password: string): Promise<User> {
    const response = await api.post('/auth/register', { name, rollNumber, password });
    const { user, token } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    
    return user;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem(SESSION_KEY);
  },

  async getSession(): Promise<User | null> {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  // --- Attendance ---

  async getAttendance(userId: string): Promise<AttendanceRecord[]> {
    // API automatically handles identifying the user via Token
    try {
      const response = await api.get('/attendance');
      return response.data;
    } catch (e) {
      console.error("Failed to fetch attendance", e);
      return [];
    }
  },

  async markAttendance(userId: string, timetableEntryId: string, date: string, status: 'PRESENT' | 'ABSENT'): Promise<void> {
    await api.post('/attendance', { timetableEntryId, date, status });

    // Emit realtime event (optional, but keeps existing feature working)
    realtime.emit('ATTENDANCE_UPDATE', { 
      userId, 
      timetableEntryId, 
      status,
      timestamp: Date.now() 
    });
  },

  // --- Calculations (Hybrid Approach) ---
  // The backend doesn't calculate "missing dates" yet, so we keep this logic on the frontend.
  // However, we must ensure we have the latest data first.
  async getMissingDates(userId: string): Promise<string[]> {
    try {
      // 1. Fetch fresh data from API
      const [attResponse, holResponse] = await Promise.all([
        api.get('/attendance'),
        api.get('/holidays')
      ]);

      const allRecords: AttendanceRecord[] = attResponse.data;
      const allHolidays: HolidayRecord[] = holResponse.data;

      const userHolidays = new Set(allHolidays.map(h => h.date));
      const missingDates: string[] = [];
      const todayStr = getTodayDateString();
      
      // Parse term start
      const [startYear, startMonth, startDay] = TERM_START_DATE.split('-').map(Number);
      const itrDate = new Date(startYear, startMonth - 1, startDay);
      
      // Loop until today
      while (true) {
        const y = itrDate.getFullYear();
        const m = String(itrDate.getMonth() + 1).padStart(2, '0');
        const d = String(itrDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        if (dateStr >= todayStr) break;

        if (!userHolidays.has(dateStr)) {
          const dayIndex = itrDate.getDay();
          if (dayIndex !== 0) { // Not Sunday
            const hasClasses = TIMETABLE.some(t => t.dayIndex === dayIndex);
            if (hasClasses) {
              // Check if record exists in the DB data
              const hasRecord = allRecords.some(r => r.date === dateStr);
              if (!hasRecord) {
                missingDates.push(dateStr);
              }
            }
          }
        }
        itrDate.setDate(itrDate.getDate() + 1);
      }
      return missingDates.sort((a, b) => b.localeCompare(a));
    } catch (e) {
      console.error("Error calculating missing dates", e);
      return [];
    }
  },

  // --- Holidays ---

  async getHolidays(userId: string): Promise<HolidayRecord[]> {
    try {
      const response = await api.get('/holidays');
      return response.data;
    } catch (e) {
      console.error("Failed to fetch holidays", e);
      return [];
    }
  },

  async toggleHoliday(userId: string, date: string): Promise<boolean> {
    const response = await api.post('/holidays/toggle', { date });
    
    realtime.emit('ATTENDANCE_UPDATE', { 
      userId, 
      timestamp: Date.now() 
    });

    return response.data.isHoliday;
  }
};