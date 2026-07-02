'use client';

import { ShieldCheck, AlertTriangle, AlertOctagon, Skull } from 'lucide-react';
import { motion } from 'framer-motion';

interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high' | 'critical';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const riskConfig = {
  low: {
    color: '#10B981',
    bg: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.35)',
    label: 'Low Risk',
    Icon: ShieldCheck,
  },
  medium: {
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.35)',
    label: 'Medium Risk',
    Icon: AlertTriangle,
  },
  high: {
    color: '#F97316',
    bg: 'rgba(249,115,22,0.15)',
    border: 'rgba(249,115,22,0.35)',
    label: 'High Risk',
    Icon: AlertOctagon,
  },
  critical: {
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.4)',
    label: 'Critical Risk',
    Icon: Skull,
  },
};

const sizeConfig = {
  sm: { padding: '2px 8px', fontSize: 11, iconSize: 12, gap: 4 },
  md: { padding: '4px 12px', fontSize: 12, iconSize: 14, gap: 6 },
  lg: { padding: '6px 16px', fontSize: 14, iconSize: 16, gap: 8 },
};

export function RiskBadge({ level, size = 'md', showLabel = true }: RiskBadgeProps) {
  const normalizedLevel = (level && riskConfig[level as keyof typeof riskConfig]) ? level : 'medium';
  const config = riskConfig[normalizedLevel as keyof typeof riskConfig];
  const sizing = sizeConfig[size] || sizeConfig.md;
  const { Icon } = config;
  const isCritical = normalizedLevel === 'critical';

  return (
    <motion.span
      className="inline-flex items-center font-semibold rounded-full"
      style={{
        padding: sizing.padding,
        fontSize: sizing.fontSize,
        gap: sizing.gap,
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontFamily: 'Inter, sans-serif',
      }}
      animate={
        isCritical
          ? {
              boxShadow: [
                '0 0 0 0 rgba(239,68,68,0.4)',
                '0 0 0 6px rgba(239,68,68,0)',
              ],
            }
          : {}
      }
      transition={isCritical ? { duration: 2, repeat: Infinity } : {}}
    >
      <Icon size={sizing.iconSize} />
      {showLabel && config.label}
    </motion.span>
  );
}
