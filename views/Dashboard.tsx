import React, { useMemo } from 'react';
import { AttendanceRecord, OverallStats, SubjectStats, HolidayRecord } from '../types';
import { calculateStats } from '../utils/calculations';
import PercentageRing from '../components/PercentageRing';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface DashboardProps {
  records: AttendanceRecord[];
  holidays: HolidayRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ records, holidays }) => {
  const { overall, bySubject } = useMemo(() => calculateStats(records, holidays), [records, holidays]);

  const getStatusColor = (status: OverallStats['status']) => {
    switch (status) {
      case 'SAFE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'WARNING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'DANGER': return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  const getStatusIcon = (status: OverallStats['status']) => {
    switch (status) {
      case 'SAFE': return <CheckCircle size={20} />;
      case 'WARNING': return <AlertTriangle size={20} />;
      case 'DANGER': return <ShieldAlert size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
        <PercentageRing percentage={overall.percentage} />
        
        <div className={`mt-6 flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(overall.status)}`}>
          {getStatusIcon(overall.status)}
          <span className="font-bold text-sm tracking-wide">{overall.status}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full mt-6 text-center">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 uppercase">Attended</p>
            <p className="text-xl font-bold text-gray-800">
              {overall.attendedClasses} <span className="text-gray-400 text-sm">/ {overall.totalClasses}</span>
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 uppercase">Can Bunk</p>
            <p className="text-xl font-bold text-gray-800">{overall.bunksAvailable}</p>
          </div>
        </div>
      </div>

      {/* Subject Wise List */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">Subject Wise</h3>
        <div className="space-y-3">
          {bySubject.map((sub) => (
            <div key={sub.subjectId} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{sub.subjectName}</h4>
                  <p className="text-xs text-gray-500">{sub.attendedClasses} / {sub.totalClasses} periods</p>
                </div>
                <div className={`text-sm font-bold px-2 py-1 rounded ${
                  sub.percentage >= 75 ? 'text-emerald-600 bg-emerald-50' : 
                  sub.percentage >= 65 ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50'
                }`}>
                  {sub.percentage}%
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className={`h-1.5 rounded-full ${
                    sub.percentage >= 75 ? 'bg-emerald-500' : 
                    sub.percentage >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${sub.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;