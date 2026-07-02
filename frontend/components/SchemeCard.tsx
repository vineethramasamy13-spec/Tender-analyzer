'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Calendar, Percent, CheckCircle } from 'lucide-react';
import type { Scheme } from '@/lib/mockData';

interface SchemeCardProps {
  scheme: Scheme;
}

const providerColors: Record<string, { color: string; bg: string }> = {
  central: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  state: { color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  ministry: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
};

function getMatchStyle(score: number) {
  if (score >= 80) return { color: '#10B981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' };
  if (score >= 60) return { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' };
  return { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' };
}

export function SchemeCard({ scheme }: SchemeCardProps) {
  const providerStyle = providerColors[scheme.providerType] || providerColors.central;
  const matchStyle = getMatchStyle(scheme.matchScore);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="glass-card flex flex-col gap-4 overflow-hidden h-full"
      style={{
        borderLeft: `3px solid ${providerStyle.color}`,
        padding: '20px',
      }}
    >
      {/* Top: Provider + Match Score */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: providerStyle.bg,
              color: providerStyle.color,
              border: `1px solid ${providerStyle.color}25`,
            }}
          >
            {scheme.provider}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#94A3B8' }}
          >
            {scheme.category}
          </span>
        </div>

        <span
          className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{
            background: matchStyle.bg,
            color: matchStyle.color,
            border: `1px solid ${matchStyle.border}`,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <Percent size={10} />
          {scheme.matchScore}% match
        </span>
      </div>

      {/* Scheme Name */}
      <div>
        <h3
          className="text-sm font-bold mb-1 leading-snug"
          style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}
        >
          {scheme.name}
        </h3>
        <p className="text-xs line-clamp-2" style={{ color: '#64748B', lineHeight: 1.6 }}>
          {scheme.description}
        </p>
      </div>

      {/* Benefit */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}
      >
        <CheckCircle size={14} style={{ color: '#10B981', flexShrink: 0 }} />
        <span className="text-sm font-semibold" style={{ color: '#34D399', fontFamily: 'Inter, sans-serif' }}>
          {scheme.benefit}
        </span>
      </div>

      {/* Eligibility */}
      <p className="text-xs" style={{ color: '#94A3B8', lineHeight: 1.5 }}>
        <span className="font-medium" style={{ color: '#F1F5F9' }}>Eligibility: </span>
        {scheme.eligibility}
      </p>

      {/* Footer: Deadline + Actions */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B' }}>
          <Calendar size={12} />
          {scheme.deadline === 'Ongoing' ? (
            <span style={{ color: '#10B981' }}>Always Open</span>
          ) : (
            <span>Deadline: {scheme.deadline}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={scheme.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
            style={{
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              color: 'white',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            Apply Now
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
