'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import type { GapItem } from '@/lib/mockData';

interface GapAnalysisTableProps {
  gaps: GapItem[];
}

const gapTypeConfig = {
  critical: {
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
    label: 'Critical',
    rowBg: 'rgba(239,68,68,0.04)',
    Icon: XCircle,
  },
  important: {
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.3)',
    label: 'Important',
    rowBg: 'rgba(245,158,11,0.04)',
    Icon: AlertCircle,
  },
  optional: {
    color: '#94A3B8',
    bg: 'rgba(148,163,184,0.1)',
    border: 'rgba(148,163,184,0.2)',
    label: 'Optional',
    rowBg: 'transparent',
    Icon: CheckCircle,
  },
};

export function GapAnalysisTable({ gaps }: GapAnalysisTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sortedGaps = [...gaps].sort((a, b) => {
    const order = { critical: 0, important: 1, optional: 2 };
    return order[a.gapType] - order[b.gapType];
  });

  return (
    <div className="w-full overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 32 }}></th>
            <th>Requirement</th>
            <th className="hidden sm:table-cell">Required</th>
            <th className="hidden md:table-cell">Current Status</th>
            <th>Gap Type</th>
            <th className="hidden lg:table-cell">Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedGaps.map((gap) => {
            const config = gapTypeConfig[gap.gapType];
            const { Icon } = config;
            const isExpanded = expandedRows.has(gap.id);

            return (
              <>
                <tr
                  key={gap.id}
                  className="cursor-pointer transition-colors"
                  style={{ background: isExpanded ? `${config.rowBg}` : undefined }}
                  onClick={() => toggleRow(gap.id)}
                >
                  <td>
                    <span style={{ color: '#64748B' }}>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  </td>
                  <td>
                    <span className="font-medium text-sm" style={{ color: '#F1F5F9' }}>
                      {gap.requirement}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className="text-xs" style={{ color: '#94A3B8' }}>
                      {gap.required}
                    </span>
                  </td>
                  <td className="hidden md:table-cell">
                    <span className="text-xs" style={{ color: gap.met ? '#10B981' : '#94A3B8' }}>
                      {gap.currentStatus}
                    </span>
                  </td>
                  <td>
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full"
                      style={{
                        background: config.bg,
                        color: config.color,
                        border: `1px solid ${config.border}`,
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <Icon size={11} />
                      {config.label}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell">
                    {gap.met ? (
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#10B981' }}>
                        <CheckCircle size={13} /> Met
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#EF4444' }}>
                        <XCircle size={13} /> Gap
                      </span>
                    )}
                  </td>
                </tr>

                {/* Expanded recommendation row */}
                <AnimatePresence>
                  {isExpanded && (
                    <tr key={`${gap.id}-expanded`}>
                      <td colSpan={6} style={{ padding: 0 }}>
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div
                            className="px-6 py-4 mx-4 my-2 rounded-lg"
                            style={{
                              background: `${config.bg}`,
                              border: `1px solid ${config.border}`,
                            }}
                          >
                            <p className="text-xs font-semibold mb-1" style={{ color: config.color }}>
                              💡 Recommendation
                            </p>
                            <p className="text-sm" style={{ color: '#CBD5E1', lineHeight: 1.6 }}>
                              {gap.recommendation}
                            </p>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
