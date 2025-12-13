import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface PercentageRingProps {
  percentage: number;
  size?: number;
}

const clamp = (value: number) =>
  Math.min(100, Math.max(0, Math.round(value)));

const PercentageRing: React.FC<PercentageRingProps> = ({
  percentage,
  size = 160
}) => {
  const safePercentage = clamp(percentage);

  const { data, color } = useMemo(() => {
    const attended = safePercentage === 0 ? 0.0001 : safePercentage;
    const missed = 100 - safePercentage;

    let ringColor = '#10b981'; // green
    if (safePercentage < 65) ringColor = '#f43f5e'; // red
    else if (safePercentage < 75) ringColor = '#f59e0b'; // amber

    return {
      data: [
        { name: 'Attended', value: attended },
        { name: 'Missed', value: missed }
      ],
      color: ringColor
    };
  }, [safePercentage]);

  const outerRadius = size / 2;
  const innerRadius = outerRadius * 0.8;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Attendance percentage ${safePercentage}%`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill={color} />
            <Cell fill="#e5e7eb" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-gray-800">
          {safePercentage}%
        </span>
        <span className="text-xs text-gray-500 uppercase font-semibold">
          Overall
        </span>
      </div>
    </div>
  );
};

export default PercentageRing;
