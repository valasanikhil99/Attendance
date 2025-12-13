import { AttendanceRecord, User, HolidayRecord } from '../types';
import { realtime } from './realtimeService';

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