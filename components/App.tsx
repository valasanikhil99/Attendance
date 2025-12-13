import React, { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'today' | 'calendar'>('today');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial Session Check
  useEffect(() => {
    const init = async () => {
      const session = await StorageService.getSession();
      if (session) {
        setUser(session);
        await refreshData(session.id);
      }
      setLoading(false);
    };
    init();
  }, []);

  // Real-time Subscription
  useEffect(() => {
    if (!user) return;

    // Subscribe to "WebSocket" push events
    const unsubscribe = realtime.subscribe((event) => {
      if (event.type === 'ATTENDANCE_UPDATE') {
        // Ensure we only update if the event belongs to this user
        if (event.payload.userId === user.id) {
          console.log("Real-time update received!", event.payload);
          refreshData(user.id);
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  const refreshData = async (userId: string) => {
    const attData = await StorageService.getAttendance(userId);
    const holData = await StorageService.getHolidays(userId);
    setRecords(attData);
    setHolidays(holData);
  };

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
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-brand-600">Loading...</div>;

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