'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Minus, TrendingDown } from 'lucide-react';

interface WinProbabilityChartProps {
  probability: number;
  confidence?: string;
}

function getConfidenceConfig(probability: number) {
  if (probability >= 70) return { label: 'High Confidence', color: '#10B981', Icon: TrendingUp };
  if (probability >= 45) return { label: 'Moderate Confidence', color: '#F59E0B', Icon: Minus };
  return { label: 'Low Confidence', color: '#EF4444', Icon: TrendingDown };
}

export function WinProbabilityChart({ probability, confidence }: WinProbabilityChartProps) {
  const config = getConfidenceConfig(probability);
  const { Icon } = config;

  const data = [
    { name: 'Win Probability', value: probability },
    { name: 'Remaining', value: 100 - probability },
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 160, height: 160 }}>
          <PieChart width={160} height={160}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
              isAnimationActive={false}
            >
              <Cell
                key="win"
                fill={config.color}
                style={{ filter: `drop-shadow(0 0 6px ${config.color}60)` }}
              />
              <Cell key="remaining" fill="rgba(255,255,255,0.06)" />
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'rgba(13,21,38,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#F1F5F9',
                fontSize: 12,
              }}
            />
          </PieChart>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.span
            className="font-black text-3xl"
            style={{ color: config.color, fontFamily: 'Inter, sans-serif', lineHeight: 1 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {probability}%
          </motion.span>
          <span className="text-xs mt-0.5" style={{ color: '#64748B' }}>
            Win Rate
          </span>
        </div>
      </div>

      <div className="text-center">
        <span
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full"
          style={{
            background: `${config.color}18`,
            color: config.color,
            border: `1px solid ${config.color}30`,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <Icon size={14} />
          {confidence || config.label}
        </span>
        <p className="text-xs mt-2" style={{ color: '#64748B' }}>
          Win Probability
        </p>
      </div>
    </div>
  );
}
