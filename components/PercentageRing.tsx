import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface PercentageRingProps {
  percentage: number;
  size?: number;
}

const PercentageRing: React.FC<PercentageRingProps> = ({ percentage, size = 160 }) => {
  const data = [
    { name: 'Attended', value: percentage },
    { name: 'Missed', value: 100 - percentage },
  ];

  let color = '#10b981'; // green-500
  if (percentage < 65) color = '#f43f5e'; // rose-500
  else if (percentage < 75) color = '#f59e0b'; // amber-500

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size / 2 - 10}
            outerRadius={size / 2}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            <Cell key="attended" fill={color} />
            <Cell key="missed" fill="#e5e7eb" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-gray-800">{percentage}%</span>
        <span className="text-xs text-gray-500 uppercase font-semibold">Overall</span>
      </div>
    </div>
  );
};

export default PercentageRing;