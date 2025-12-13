import { AttendanceRecord, User, HolidayRecord } from '../types';
import { realtime } from './realtimeService';

const USERS_KEY = 'classtrack_users';
const ATTENDANCE_KEY = 'classtrack_attendance';
const HOLIDAYS_KEY = 'classtrack_holidays';
const SESSION_KEY = 'classtrack_session';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const safeParse = <T>(raw: string | null, fallback: T): T => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const generateId = () =>
  crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);

export const StorageService = {
  /* ---------------- AUTH ---------------- */

  async login(rollNumber: string, password: string): Promise<User | null> {
    await delay(300);
    if (!password) return null;

    const users = safeParse<User[]>(localStorage.getItem(USERS_KEY), []);
    const user = users.find(u => u.rollNumber === rollNumber);

    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  async register(name: string, rollNumber: string, password: string): Promise<User> {
    await delay(300);
    if (!password) throw new Error('Password required');

    const users = safeParse<User[]>(localStorage.getItem(USERS_KEY), []);

    if (users.some(u => u.rollNumber === rollNumber)) {
      throw new Error('User already exists');
    }

    const newUser: User = { id: generateId(), name, rollNumber };
    users.push(newUser);

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));

    return newUser;
  },

  async logout(): Promise<void> {
    await delay(100);
    localStorage.removeItem(SESSION_KEY);
  },

  async getSession(): Promise<User | null> {
    return safeParse<User | null>(localStorage.getItem(SESSION_KEY), null);
  },

  /* ---------------- ATTENDANCE ---------------- */

  async getAttendance(userId: string): Promise<AttendanceRecord[]> {
    const records = safeParse<AttendanceRecord[]>(
      localStorage.getItem(ATTENDANCE_KEY),
      []
    );

    // Backward-compatible: infer userId if missing
    return records
      .map(r => ({
        ...r,
        userId: r.userId ?? r.id.split('_')[0]
      }))
      .filter(r => r.userId === userId);
  },

  async markAttendance(
    userId: string,
    timetableEntryId: string,
    date: string,
    status: 'PRESENT' | 'ABSENT'
  ): Promise<void> {
    const records = safeParse<AttendanceRecord[]>(
      localStorage.getItem(ATTENDANCE_KEY),
      []
    );

    const index = records.findIndex(
      r =>
        (r.userId ?? r.id.split('_')[0]) === userId &&
        r.timetableEntryId === timetableEntryId &&
        r.date === date
    );

    if (index >= 0) {
      records[index].status = status;
    } else {
      records.push({
        id: generateId(),
        userId,
        timetableEntryId,
        date,
        status
      });
    }

    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));

    realtime.emit('ATTENDANCE_UPDATE', {
      userId,
      date,
      timetableEntryId,
      status
    });
  },

  /* ---------------- HOLIDAYS ---------------- */

  async getHolidays(userId: string): Promise<HolidayRecord[]> {
    const holidays = safeParse<HolidayRecord[]>(
      localStorage.getItem(HOLIDAYS_KEY),
      []
    );
    return holidays.filter(h => h.userId === userId);
  },

  async toggleHoliday(userId: string, date: string): Promise<boolean> {
    const holidays = safeParse<HolidayRecord[]>(
      localStorage.getItem(HOLIDAYS_KEY),
      []
    );

    const index = holidays.findIndex(h => h.userId === userId && h.date === date);
    let isHoliday = false;

    if (index >= 0) {
      holidays.splice(index, 1);
    } else {
      holidays.push({ id: generateId(), userId, date });
      isHoliday = true;

      // Remove attendance for that day
      const records = safeParse<AttendanceRecord[]>(
        localStorage.getItem(ATTENDANCE_KEY),
        []
      );

      const filtered = records.filter(
        r => !((r.userId ?? r.id.split('_')[0]) === userId && r.date === date)
      );

      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(filtered));
    }

    localStorage.setItem(HOLIDAYS_KEY, JSON.stringify(holidays));

    realtime.emit('HOLIDAY_UPDATE', { userId, date, isHoliday });

    return isHoliday;
  }
};
