'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, TrendingUp, TrendingDown, Clock, FileText,
  CheckCircle, AlertCircle, ArrowRight, Zap, Search, Award, Bell,
  IndianRupee, Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { RiskBadge } from '@/components/RiskBadge';
import { MOCK_DASHBOARD_STATS, MOCK_SCHEMES } from '@/lib/mockData';
import { SchemeCard } from '@/components/SchemeCard';
import { getAnalyses } from '@/lib/api';

function StatCard({
  title, value, subtitle, trend, trendUp, icon: Icon, color, delay,
}: {
  title: string; value: string | number; subtitle: string; trend?: string;
  trendUp?: boolean; icon: React.ElementType; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="stat-card group"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        {trend && (
          <span
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
            style={{
              background: trendUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color: trendUp ? '#10B981' : '#EF4444',
            }}
          >
            {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend}
          </span>
        )}
      </div>
      <div
        className="text-3xl font-black mb-1"
        style={{ color, fontFamily: 'Inter, sans-serif' }}
      >
        {value}
      </div>
      <div className="text-sm font-semibold mb-0.5" style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
        {title}
      </div>
      <div className="text-xs" style={{ color: '#64748B' }}>
        {subtitle}
      </div>
    </motion.div>
  );
}

function getRiskColor(risk: string) {
  if (risk === 'low') return '#10B981';
  if (risk === 'medium') return '#F59E0B';
  return '#EF4444';
}

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [allAnalyses, setAllAnalyses] = useState<any[]>([]);

  // Computed real stats from fetched analyses
  const totalAnalyses = allAnalyses.length;
  const avgWinProbability = totalAnalyses > 0
    ? Math.round(
        allAnalyses.reduce((sum, a) => {
          const prob = a.result?.bid_prediction?.win_probability ?? a.win_probability ?? 0;
          return sum + (prob <= 1.0 ? prob * 100 : prob);
        }, 0) / totalAnalyses
      )
    : 0;
  const tendersDiscovered = totalAnalyses > 0 ? totalAnalyses * 3 : 0;
  const schemesMatched = allAnalyses.reduce((sum, a) => {
    const recs = a.result?.scheme_recommendations ?? a.scheme_recommendations ?? [];
    return sum + (Array.isArray(recs) ? recs.length : 0);
  }, 0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth';
        return;
      }
    }
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    const loadAnalyses = async () => {
      try {
        const data = await getAnalyses();
        if (data && data.length > 0) {
          setAllAnalyses(data);
          setAnalyses(data.slice(0, 5));
        } else {
          setAnalyses(MOCK_DASHBOARD_STATS.recentAnalyses);
        }
      } catch (e) {
        console.error(e);
        setAnalyses(MOCK_DASHBOARD_STATS.recentAnalyses);
      }
    };
    loadAnalyses();

    return () => clearInterval(timer);
  }, []);

  if (!mounted) return <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }} />;


  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', paddingTop: 80 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8 flex-wrap gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <LayoutDashboard size={20} style={{ color: '#3B82F6' }} />
              <h1
                className="text-2xl font-black"
                style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}
              >
                Dashboard
              </h1>
            </div>
            <p className="text-sm" style={{ color: '#64748B' }}>
              {mounted ? currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
            </p>
          </div>

          {/* Alert Banner */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.3)',
              color: '#FCD34D',
            }}
          >
            <Bell size={15} className="animate-pulse-slow" />
            <span className="font-semibold">3 tenders closing this week</span>
          </motion.div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Analyses"
            value={totalAnalyses > 0 ? totalAnalyses : '--'}
            subtitle="Tenders analyzed"
            trend={totalAnalyses > 0 ? `${totalAnalyses} total` : undefined}
            trendUp
            icon={FileText}
            color="#3B82F6"
            delay={0}
          />
          <StatCard
            title="Avg Win Probability"
            value={avgWinProbability > 0 ? `${avgWinProbability}%` : '--'}
            subtitle="Across all analyses"
            trend={avgWinProbability > 0 ? `${avgWinProbability}% avg` : undefined}
            trendUp={avgWinProbability >= 50}
            icon={CheckCircle}
            color="#10B981"
            delay={0.08}
          />
          <StatCard
            title="Tenders Discovered"
            value={tendersDiscovered > 0 ? tendersDiscovered : '--'}
            subtitle="Estimated from analyses"
            trend={tendersDiscovered > 0 ? `+${tendersDiscovered}` : undefined}
            trendUp
            icon={AlertCircle}
            color="#F59E0B"
            delay={0.16}
          />
          <StatCard
            title="Schemes Matched"
            value={schemesMatched > 0 ? schemesMatched : '--'}
            subtitle="Across all tenders"
            trend={schemesMatched > 0 ? `${schemesMatched} schemes` : undefined}
            trendUp
            icon={TrendingUp}
            color="#8B5CF6"
            delay={0.24}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Analyses Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 glass-card-static rounded-2xl overflow-hidden"
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <h2 className="font-bold text-base" style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
                Recent Analyses
              </h2>
              <Link
                href="/analyze"
                className="flex items-center gap-1 text-xs font-semibold transition-all"
                style={{ color: '#3B82F6' }}
              >
                View All <ArrowRight size={13} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tender Name</th>
                    <th>Eligibility</th>
                    <th>Win Prob</th>
                    <th>Risk</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {analyses.map((analysis, idx) => {
                    const id = analysis.analysis_id || analysis.id;
                    const res = analysis.result || {};
                    const elig = res.eligibility_result || {};
                    const bid = res.bid_prediction || {};
                    
                    const score = elig.overall_score !== undefined 
                      ? Math.round(elig.overall_score * 100) 
                      : (analysis.eligibility || 75);
                      
                    const prob = bid.win_probability !== undefined 
                      ? Math.round(bid.win_probability * 100) 
                      : (analysis.winProbability || 70);

                    const riskLevel = (res.risk_report?.overall_risk || analysis.risk || 'medium').toLowerCase();
                    const dateStr = analysis.date || (analysis.created_at ? analysis.created_at.slice(0, 10) : '2026-06-25');

                    return (
                      <motion.tr
                        key={id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + idx * 0.05 }}
                      >
                        <td>
                          <div>
                            <div className="font-medium text-sm" style={{ color: '#F1F5F9', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {analysis.tender_title || analysis.tenderName || 'Tender Analysis'}
                            </div>
                            <div className="text-xs" style={{ color: '#64748B' }}>#{id}</div>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div
                              className="text-sm font-bold"
                              style={{
                                color: score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444',
                                fontFamily: 'Inter, sans-serif',
                              }}
                            >
                              {score}%
                            </div>
                            <div
                              className="h-1.5 w-16 rounded-full overflow-hidden"
                              style={{ background: 'rgba(255,255,255,0.08)' }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${score}%`,
                                  background: score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444',
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className="font-bold text-sm"
                            style={{ color: getRiskColor(riskLevel), fontFamily: 'Inter, sans-serif' }}
                          >
                            {prob}%
                          </span>
                        </td>
                        <td>
                          <RiskBadge level={riskLevel} size="sm" />
                        </td>
                        <td>
                          <span className="text-xs" style={{ color: '#64748B' }}>
                            {mounted ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                          </span>
                        </td>
                        <td>
                          <Link
                            href={`/analyze?analysis_id=${id}`}
                            className="flex items-center gap-1 text-xs font-semibold transition-all hover:gap-2 whitespace-nowrap"
                            style={{ color: '#3B82F6' }}
                          >
                            Open <ArrowRight size={11} />
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Right Column */}
          <div className="flex flex-col gap-5">
            {/* Upcoming Deadlines */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card-static rounded-2xl overflow-hidden"
            >
              <div
                className="flex items-center gap-2 px-5 py-4 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <Clock size={16} style={{ color: '#F59E0B' }} />
                <h2 className="font-bold text-sm" style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
                  Upcoming Deadlines
                </h2>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {MOCK_DASHBOARD_STATS.upcomingDeadlinesList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold truncate mb-1"
                        style={{ color: '#F1F5F9' }}
                      >
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Calendar size={11} style={{ color: '#64748B' }} />
                        <span className="text-xs" style={{ color: '#64748B' }}>{item.deadline}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: item.daysLeft <= 7 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                          color: item.daysLeft <= 7 ? '#EF4444' : '#F59E0B',
                        }}
                      >
                        {item.daysLeft}d left
                      </span>
                      <span className="text-xs font-semibold" style={{ color: '#10B981' }}>{item.budget}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card-static rounded-2xl p-5"
            >
              <h2 className="font-bold text-sm mb-4" style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
                Quick Actions
              </h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Analyze New Tender', href: '/analyze', icon: Zap, color: '#3B82F6' },
                  { label: 'Discover Tenders', href: '/tenders', icon: Search, color: '#10B981' },
                  { label: 'Find Schemes', href: '/schemes', icon: Award, color: '#8B5CF6' },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
                      style={{
                        background: `${action.color}0D`,
                        border: `1px solid ${action.color}20`,
                      }}
                    >
                      <Icon size={16} style={{ color: action.color }} />
                      <span className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                        {action.label}
                      </span>
                      <ArrowRight size={14} className="ml-auto" style={{ color: '#64748B' }} />
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Recommended Schemes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Award size={18} style={{ color: '#8B5CF6' }} />
              <h2 className="font-bold text-lg" style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
                Recommended Schemes
              </h2>
            </div>
            <Link
              href="/schemes"
              className="flex items-center gap-1 text-sm font-semibold"
              style={{ color: '#8B5CF6' }}
            >
              See All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
            {MOCK_SCHEMES.slice(0, 5).map((scheme) => (
              <div key={scheme.id} className="flex-shrink-0 w-72">
                <SchemeCard scheme={scheme} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
