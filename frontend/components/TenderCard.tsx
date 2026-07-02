'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  IndianRupee, 
  Building2, 
  Tag, 
  ArrowRight, 
  Clock, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MapPin,
  Shield,
  Briefcase,
  Users,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import type { Tender } from '@/lib/mockData';

interface TenderCardProps {
  tender: Tender;
  isWatched?: boolean;
  onToggleWatch?: () => void;
}

function getMatchColor(score: number) {
  if (score >= 80) return { color: '#10B981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' };
  if (score >= 60) return { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' };
  return { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' };
}

function getDeadlineColor(daysLeft: number) {
  if (daysLeft <= 7) return { color: '#EF4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' };
  if (daysLeft <= 30) return { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' };
  return { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' };
}

const categoryColors: Record<string, string> = {
  'IT/Software': '#3B82F6',
  'Cybersecurity': '#8B5CF6',
  'Healthcare IT': '#10B981',
  'API Development': '#06B6D4',
  'IoT/Software': '#F59E0B',
  'Web Development': '#6366F1',
  'Data Analytics': '#EC4899',
  'Mobile App': '#14B8A6',
  'HPC/Software': '#8B5CF6',
  'Enterprise Software': '#3B82F6',
  'IoT/Smart City': '#10B981',
  'FinTech Analytics': '#F59E0B',
  'EdTech': '#6366F1',
  'Enterprise Portal': '#06B6D4',
  'Infrastructure': '#A78BFA',
};

export function TenderCard({ tender, isWatched = false, onToggleWatch }: TenderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [certs, setCerts] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('business_profile');
      if (savedProfile) {
        try {
          setProfile(JSON.parse(savedProfile));
        } catch (e) {}
      }
      const savedCerts = localStorage.getItem('business_certs');
      if (savedCerts) {
        try {
          setCerts(JSON.parse(savedCerts));
        } catch (e) {}
      }
    }
  }, []);

  const matchStyle = getMatchColor(tender.matchScore);
  const deadlineStyle = getDeadlineColor(tender.daysLeft);
  const categoryColor = categoryColors[tender.category] || '#64748B';

  // Extract metadata parameters
  const metadata = tender.metadata || {
    experience_required: 3,
    turnover_required: tender.budget * 0.5,
    certifications: ['ISO 9001'],
    timeline: '12 months',
    evaluation_criteria: ['Technical Score (70%)', 'Financial Score (30%)']
  };

  const expRequired = Number(metadata.experience_required || 3);
  const turnoverRequired = Number(metadata.turnover_required || 0);
  const certsRequired = metadata.certifications || [];
  const timeline = metadata.timeline || '12 months';
  const evalCriteria = metadata.evaluation_criteria || ['QCBS 70:30'];

  // Check eligibility matches
  const expHave = profile ? Number(profile.experience || 0) : 5;
  const expMet = expHave >= expRequired;

  let turnoverHave = profile ? Number(profile.annual_turnover || 0) : 180;
  if (profile?.turnover_unit === 'lakhs') {
    turnoverHave *= 100000;
  } else if (profile?.turnover_unit === 'crores') {
    turnoverHave *= 10000000;
  } else {
    // Default to lakhs if unit is unspecified
    turnoverHave *= 100000;
  }
  const turnoverMet = turnoverRequired > 0 ? turnoverHave >= turnoverRequired : true;

  const certsHave = certs.map(c => c.toLowerCase());
  const certsStatus = certsRequired.map(req => {
    const met = certsHave.some(have => have.includes(req.toLowerCase()) || req.toLowerCase().includes(have));
    return { name: req, met };
  });
  const certsMet = certsStatus.every(c => c.met);

  const teamHave = profile ? Number(profile.teamSize || 0) : 45;
  const teamRequired = (tender as any).min_team_size || (tender as any).team_size_required || 20;
  const teamMet = teamHave >= teamRequired;

  // Format currencies for display
  const formatINR = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} Lakhs`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <motion.div
      layout
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      onClick={() => setIsExpanded(!isExpanded)}
      className="glass-card p-5 flex flex-col gap-4 cursor-pointer relative overflow-hidden"
      style={{
        border: isExpanded ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
        background: isExpanded ? 'rgba(13,21,41,0.6)' : 'rgba(255,255,255,0.04)',
      }}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1"
            style={{
              background: 'rgba(59,130,246,0.12)',
              color: '#60A5FA',
              border: '1px solid rgba(59,130,246,0.25)',
            }}
          >
            <Building2 size={11} />
            {tender.source}
          </span>
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1"
            style={{
              background: `${categoryColor}18`,
              color: categoryColor,
              border: `1px solid ${categoryColor}30`,
            }}
          >
            <Tag size={10} />
            {tender.category}
          </span>
          {tender.location && (
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{
                background: 'rgba(255,255,255,0.03)',
                color: '#94A3B8',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <MapPin size={10} />
              {tender.location.split(',')[0]}
            </span>
          )}
        </div>

        {/* Match Score Badge */}
        <div
          className="flex items-center gap-2"
          title="Match score is based on tender category and budget range"
        >
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0 font-bold text-sm"
            style={{
              width: 40,
              height: 40,
              background: matchStyle.bg,
              border: `2px solid ${matchStyle.border}`,
              color: matchStyle.color,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {tender.matchScore ? `${tender.matchScore}%` : '--'}
          </div>
          {isExpanded ? <ChevronUp size={16} style={{ color: '#64748B' }} /> : <ChevronDown size={16} style={{ color: '#64748B' }} />}
        </div>
      </div>

      {/* Title */}
      <div>
        <h3
          className={`text-sm font-bold leading-snug mb-1 transition-all ${isExpanded ? '' : 'line-clamp-2'}`}
          style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}
        >
          {tender.title}
        </h3>
        <p className="text-xs font-semibold" style={{ color: '#3B82F6' }}>
          {tender.department}
        </p>
      </div>

      {/* Budget + Deadline */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
          style={{
            background: 'rgba(16,185,129,0.1)',
            color: '#34D399',
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          <IndianRupee size={13} />
          {tender.budgetDisplay}
        </div>

        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            background: deadlineStyle.bg,
            color: deadlineStyle.color,
            border: `1px solid ${deadlineStyle.border}`,
          }}
        >
          {tender.daysLeft <= 7 ? <Clock size={12} /> : <Calendar size={12} />}
          {tender.daysLeft <= 0
            ? 'Closed'
            : tender.daysLeft === 1
            ? '1 day left'
            : `${tender.daysLeft} days left`}
        </div>
      </div>

      {/* Expandable Content Drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4 overflow-hidden pt-3 border-t text-left"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scope of Work Section */}
            <div>
              <h4 className="text-xs font-bold uppercase mb-1.5 tracking-wider" style={{ color: '#94A3B8' }}>
                Scope & Description
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: '#CBD5E1', whiteSpace: 'pre-line' }}>
                {tender.description}
              </p>
            </div>

            {/* Profile Matching Section */}
            <div>
              <h4 className="text-xs font-bold uppercase mb-2 tracking-wider" style={{ color: '#94A3B8' }}>
                Profile Eligibility Checklist
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Experience */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-blue-400" />
                    <div>
                      <p className="font-semibold text-slate-300">Technical Experience</p>
                      <p className="text-[10px] text-slate-500">Req: {expRequired} yrs | Have: {expHave} yrs</p>
                    </div>
                  </div>
                  {expMet ? (
                    <Check size={16} className="text-emerald-400 flex-shrink-0" />
                  ) : (
                    <X size={16} className="text-rose-400 flex-shrink-0" />
                  )}
                </div>

                {/* Turnover */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <IndianRupee size={14} className="text-emerald-400" />
                    <div>
                      <p className="font-semibold text-slate-300">Annual Turnover</p>
                      <p className="text-[10px] text-slate-500">Req: {formatINR(turnoverRequired)} | Have: {formatINR(turnoverHave)}</p>
                    </div>
                  </div>
                  {turnoverMet ? (
                    <Check size={16} className="text-emerald-400 flex-shrink-0" />
                  ) : (
                    <X size={16} className="text-rose-400 flex-shrink-0" />
                  )}
                </div>

                {/* Certifications */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-purple-400" />
                    <div>
                      <p className="font-semibold text-slate-300">Certifications</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[150px]" title={certsRequired.join(', ')}>
                        Req: {certsRequired.join(', ')}
                      </p>
                    </div>
                  </div>
                  {certsMet ? (
                    <Check size={16} className="text-emerald-400 flex-shrink-0" />
                  ) : (
                    <X size={16} className="text-rose-400 flex-shrink-0" />
                  )}
                </div>

                {/* Team size */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-amber-400" />
                    <div>
                      <p className="font-semibold text-slate-300">Team Capacity</p>
                      <p className="text-[10px] text-slate-500">Req: {teamRequired} staff | Have: {teamHave} staff</p>
                    </div>
                  </div>
                  {teamMet ? (
                    <Check size={16} className="text-emerald-400 flex-shrink-0" />
                  ) : (
                    <X size={16} className="text-rose-400 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>

            {/* Extra Metadata Section */}
            <div className="flex justify-between items-center bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl text-xs flex-wrap gap-2">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Project Timeline</span>
                <span className="text-slate-300 font-semibold">{timeline}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Evaluation Method</span>
                <span className="text-slate-300 font-semibold">{evalCriteria.join(' / ')}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex flex-col gap-2.5 mt-auto pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between text-[11px]" style={{ color: '#64748B' }}>
          <span>Ref: {tender.tenderNo}</span>
          {tender.location && (
            <span className="flex items-center gap-0.5">
              <MapPin size={10} />
              {tender.location.split(',')[0]}
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 flex-1">
            <Link
              href={`/chat?tender=${tender.id}`}
              className="flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all hover:bg-opacity-80 flex-1 text-center"
              style={{
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.2)',
                color: '#60A5FA',
              }}
            >
              <MessageSquare size={10} />
              Chat
            </Link>
            <Link
              href={`/analyze?tender=${tender.id}`}
              className="flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all hover:gap-1.5 flex-1 text-center"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94A3B8',
              }}
            >
              Analyze
              <ArrowRight size={10} />
            </Link>

          </div>
          <a
            href={tender.applyUrl || (tender.source === 'GeM' ? 'https://bidplus.gem.gov.in/all-bids' : 'https://eprocure.gov.in/eprocure/app?page=FrontEndTenderSearchExternal&service=page')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all text-center sm:w-auto w-full sm:min-w-[80px]"
            style={{
              background: 'linear-gradient(135deg, #22C55E, #16A34A)',
              color: 'white',
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.2)'
            }}
          >
            Apply
          </a>
        </div>
      </div>
    </motion.div>
  );
}
