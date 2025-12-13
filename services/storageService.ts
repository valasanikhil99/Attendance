import { AttendanceRecord, User, HolidayRecord } from '../types';
import { realtime } from './realtimeService';
import { TIMETABLE, TERM_START_DATE } from '../constants';
import { getDayIndex, getTodayDateString } from '../utils/dateUtils';

const USERS_KEY = 'classtrack_users';
const ATTENDANCE_KEY = 'classtrack_attendance';
const HOLIDAYS_KEY = 'classtrack_holidays';
const SESSION_KEY = 'classtrack_session';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Safer ID generator that works in all contexts
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export const StorageService = {
  // User Auth
  async login(rollNumber: string, password: string): Promise<User | null> {
    await delay(500);
    const usersRaw = localStorage.getItem(USERS_KEY);
    const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
    
    // For demo purposes, password check is skipped or basic. 
    // In real app, this would verify hash.
    const user = users.find(u => u.rollNumber === rollNumber);
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  async register(name: string, rollNumber: string, password: string): Promise<User> {
    await delay(500);
    const usersRaw = localStorage.getItem(USERS_KEY);
    const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
    
    if (users.find(u => u.rollNumber === rollNumber)) {
      throw new Error("User already exists");
    }

    const newUser: User = { id: generateId(), name, rollNumber };
    users.push(newUser); // In real app, store hashed password
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    return newUser;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
  },

  async getSession(): Promise<User | null> {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  // Attendance
  async getAttendance(userId: string): Promise<AttendanceRecord[]> {
    const raw = localStorage.getItem(ATTENDANCE_KEY);
    const allRecords: AttendanceRecord[] = raw ? JSON.parse(raw) : [];
    // Fix: Use userId + '_' to prevent partial matches (e.g. user '1' matching user '12')
    return allRecords.filter(r => r.id.startsWith(userId + '_')); 
  },

  async markAttendance(userId: string, timetableEntryId: string, date: string, status: 'PRESENT' | 'ABSENT'): Promise<void> {
    const raw = localStorage.getItem(ATTENDANCE_KEY);
    let allRecords: AttendanceRecord[] = raw ? JSON.parse(raw) : [];

    // Check if exists
    // Fix: Use userId + '_' for precise matching
    const existingIndex = allRecords.findIndex(r => 
      r.id.startsWith(userId + '_') && r.timetableEntryId === timetableEntryId && r.date === date
    );

    if (existingIndex >= 0) {
      allRecords[existingIndex].status = status;
    } else {
      allRecords.push({
        id: `${userId}_${date}_${timetableEntryId}`,
        timetableEntryId,
        date,
        status
      });
    }

    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(allRecords));

    realtime.emit('ATTENDANCE_UPDATE', { 
      userId, 
      timetableEntryId, 
      status,
      timestamp: Date.now() 
    });
  },

  // Identify dates where no action was taken (Pending)
  async getMissingDates(userId: string): Promise<string[]> {
    // 1. Load all data
    const rawAtt = localStorage.getItem(ATTENDANCE_KEY);
    const rawHol = localStorage.getItem(HOLIDAYS_KEY);
    const allRecords: AttendanceRecord[] = rawAtt ? JSON.parse(rawAtt) : [];
    const allHolidays: HolidayRecord[] = rawHol ? JSON.parse(rawHol) : [];

    const userHolidays = new Set(
      allHolidays
        .filter(h => h.userId === userId)
        .map(h => h.date)
    );

    const missingDates: string[] = [];

    // 2. Determine Date Range (Term Start -> Yesterday)
    const todayStr = getTodayDateString();
    
    // Parse term start
    const [startYear, startMonth, startDay] = TERM_START_DATE.split('-').map(Number);
    const itrDate = new Date(startYear, startMonth - 1, startDay);
    
    // Loop until we reach today (exclusive)
    while (true) {
      // Format current iteration date to YYYY-MM-DD
      const y = itrDate.getFullYear();
      const m = String(itrDate.getMonth() + 1).padStart(2, '0');
      const d = String(itrDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      if (dateStr >= todayStr) break; // Stop if we reach today or future

      // Logic:
      // 1. Skip Holidays
      // 2. Skip Sundays
      // 3. Skip if ANY records exist for this day (even partial attendance is fine)
      
      if (!userHolidays.has(dateStr)) {
        const dayIndex = itrDate.getDay();
        
        if (dayIndex !== 0) { // Not Sunday
          // Check if there are any classes scheduled for this day index in the timetable
          const hasClasses = TIMETABLE.some(t => t.dayIndex === dayIndex);
          
          if (hasClasses) {
            // Check if ANY record exists for this date + user
            const hasRecord = allRecords.some(r => 
              r.id.startsWith(userId + '_') && 
              r.date === dateStr
            );

            if (!hasRecord) {
              missingDates.push(dateStr);
            }
          }
        }
      }

      // Move to next day
      itrDate.setDate(itrDate.getDate() + 1);
    }

    // Sort descending (most recent missing day first)
    return missingDates.sort((a, b) => b.localeCompare(a));
  },

  // Holidays
  async getHolidays(userId: string): Promise<HolidayRecord[]> {
    const raw = localStorage.getItem(HOLIDAYS_KEY);
    const allHolidays: HolidayRecord[] = raw ? JSON.parse(raw) : [];
    return allHolidays.filter(h => h.userId === userId);
  },

  async toggleHoliday(userId: string, date: string): Promise<boolean> {
    const rawHolidays = localStorage.getItem(HOLIDAYS_KEY);
    let allHolidays: HolidayRecord[] = rawHolidays ? JSON.parse(rawHolidays) : [];
    
    const existingIndex = allHolidays.findIndex(h => h.userId === userId && h.date === date);
    let isHoliday = false;

    if (existingIndex >= 0) {
      // Remove holiday
      allHolidays.splice(existingIndex, 1);
      isHoliday = false;
    } else {
      // Add holiday
      allHolidays.push({ id: generateId(), userId, date });
      isHoliday = true;

      // CRITICAL: Remove any attendance records for this day so they don't count in calculation
      const rawAttendance = localStorage.getItem(ATTENDANCE_KEY);
      if (rawAttendance) {
        try {
          const allRecords: AttendanceRecord[] = JSON.parse(rawAttendance);
          // We filter OUT records that belong to this user AND this date
          const filteredRecords = allRecords.filter(r => {
             const isUserRecord = r.id.startsWith(userId + '_');
             const isDateMatch = r.date === date;
             // If it's this user's record on this date, we want to REMOVE it (return false)
             return !(isUserRecord && isDateMatch);
          });
          localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(filteredRecords));
        } catch (e) {
          console.error("Failed to clear attendance for holiday", e);
        }
      }
    }

    localStorage.setItem(HOLIDAYS_KEY, JSON.stringify(allHolidays));
    
    realtime.emit('ATTENDANCE_UPDATE', { 
      userId, 
      timestamp: Date.now() 
    });

    return isHoliday;
  }
};