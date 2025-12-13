import React, { useState, useEffect, useCallback } from 'react';
import Login from '../views/Login';
import Dashboard from '../views/Dashboard';
import Today from '../views/Today';
import CalendarView from '../views/CalendarView';
import Layout from './Layout';
import { StorageService } from '../services/storageService';
import { realtime } from '../services/realtimeService';
import { User, AttendanceRecord, HolidayRecord } from '../types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] =
    useState<'dashboard' | 'today' | 'calendar'>('today');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Centralized data refresh
   */
  const refreshData = useCallback(async (userId: string) => {
    try {
      const [attData, holData] = await Promise.all([
        StorageService.getAttendance(userId),
        StorageService.getHolidays(userId),
      ]);

      setRecords(attData);
      setHolidays(holData);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, []);

  /**
   * Initial session check
   */
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const session = await StorageService.getSession();
        if (session && isMounted) {
          setUser(session);
          await refreshData(session.id);
        }
      } catch (error) {
        console.error('Session initialization failed:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [refreshData]);

  /**
   * Real-time updates
   */
  useEffect(() => {
    if (!user) return;

    const unsubscribe = realtime.subscribe((event) => {
      if (
        event.type === 'ATTENDANCE_UPDATE' &&
        event.payload.userId === user.id
      ) {
        console.log('Real-time update received:', event.payload);
        refreshData(user.id);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, refreshData]);

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    await refreshData(loggedInUser.id);
    setActiveTab('today');
  };

  const handleLogout = async () => {
    await StorageService.logout();
    setUser(null);
    setRecords([]);
    setHolidays([]);
    setActiveTab('today');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-brand-600">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {activeTab === 'today' && (
        <Today
          userId={user.id}
          records={records}
          onRefresh={() => refreshData(user.id)}
        />
      )}

      {activeTab === 'calendar' && (
        <CalendarView
          userId={user.id}
          records={records}
          holidays={holidays}
          onRefresh={() => refreshData(user.id)}
        />
      )}

      {activeTab === 'dashboard' && (
        <Dashboard records={records} />
      )}
    </Layout>
  );
}

export default App;
