'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';

interface EligibilityGaugeProps {
  score: number;
  size?: number;
}

function getScoreColor(score: number) {
  if (score >= 75) return '#10B981';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'Highly Eligible';
  if (score >= 65) return 'Eligible';
  if (score >= 50) return 'Partially Eligible';
  if (score >= 35) return 'Low Eligibility';
  return 'Not Eligible';
}

export function EligibilityGauge({ score, size = 180 }: EligibilityGaugeProps) {
  const controls = useAnimation();
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const center = size / 2;

  useEffect(() => {
    controls.start({
      strokeDashoffset,
      transition: { duration: 0.4, ease: 'easeOut', delay: 0 },
    });
  }, [score, strokeDashoffset, controls]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={14}
          />
          {/* Progress arc */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0 }}
            style={{
              filter: `drop-shadow(0 0 8px ${color}80)`,
            }}
          />
        </svg>

        {/* Center text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ gap: 2 }}
        >
          <motion.span
            className="font-black"
            style={{
              color,
              fontSize: size * 0.22,
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {score}%
          </motion.span>
          <span
            className="text-xs"
            style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}
          >
            Score
          </span>
        </div>
      </div>

      <div className="text-center">
        <span
          className="text-sm font-semibold px-3 py-1 rounded-full"
          style={{
            background: `${color}18`,
            color,
            border: `1px solid ${color}30`,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {label}
        </span>
        <p className="text-xs mt-2" style={{ color: '#64748B' }}>
          Eligibility Score
        </p>
      </div>
    </div>
  );
}
