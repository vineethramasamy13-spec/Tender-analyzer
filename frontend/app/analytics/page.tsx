'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Loader2, TrendingUp, ShieldCheck, Award, Percent } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAnalyticsSummary } from '@/lib/api';
import Navbar from '@/components/Navbar';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const summary = await getAnalyticsSummary();
      setData(summary);
    } catch (e) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth';
        return;
      }
    }
    setMounted(true);
    fetchAnalytics();
  }, []);

  if (loading) {
    if (!mounted) return <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }} />;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <Loader2 size={36} className="animate-spin text-blue-500" />
        <p className="text-sm text-slate-400">Compiling analytics summary...</p>
      </div>
    );
  }

  const categoryData = Object.entries(data?.tenders_by_category || {}).map(([name, value]) => ({
    name,
    value
  }));

  const eligiblePercentage = Math.round(data?.eligible_rate * 100) || 0;
  const radialData = [
    {
      name: 'Eligible Rate',
      value: eligiblePercentage,
      fill: '#10B981',
    }
  ];

  return (
    <div className="min-h-screen pb-12" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Performance Analytics</h1>
            <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
              Track bid success metrics, qualification trends, and capabilities gaps.
            </p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 text-xs bg-white/5 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-slate-300 transition-all"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          {/* Total Analyses */}
          <div className="glass-card p-6 rounded-2xl border flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider" style={{ color: '#94A3B8' }}>Total Analyses</span>
              <p className="text-3xl font-extrabold text-white mt-1">{data?.total_analyses}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
              <TrendingUp size={22} />
            </div>
          </div>

          {/* Average Eligibility */}
          <div className="glass-card p-6 rounded-2xl border flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider" style={{ color: '#94A3B8' }}>Avg Eligibility</span>
              <p className="text-3xl font-extrabold text-white mt-1">{Math.round(data?.avg_eligibility_score * 100)}%</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <ShieldCheck size={22} />
            </div>
          </div>

          {/* Average Win Probability */}
          <div className="glass-card p-6 rounded-2xl border flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider" style={{ color: '#94A3B8' }}>Avg Win Prob</span>
              <p className="text-3xl font-extrabold text-white mt-1">{Math.round(data?.avg_win_probability * 100)}%</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
              <Award size={22} />
            </div>
          </div>

          {/* Qualification Rate */}
          <div className="glass-card p-6 rounded-2xl border flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider" style={{ color: '#94A3B8' }}>Eligible Rate</span>
              <p className="text-3xl font-extrabold text-white mt-1">{eligiblePercentage}%</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <Percent size={22} />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Eligibility Score Trend */}
          <div className="glass-card p-6 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-semibold mb-4 text-white">Eligibility & Win Probability Trends</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.score_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} domain={[0, 1]} tickFormatter={(v) => `${v*100}%`} />
                  <Tooltip 
                    contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                    labelStyle={{ color: '#94A3B8', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="eligibility" stroke="#3B82F6" strokeWidth={2.5} name="Eligibility" />
                  <Line type="monotone" dataKey="win_probability" stroke="#8B5CF6" strokeWidth={2.5} name="Win Probability" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gaps Frequency */}
          <div className="glass-card p-6 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-semibold mb-4 text-white">Most Frequent Gaps</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.most_common_gaps || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="#64748B" fontSize={10} />
                  <YAxis dataKey="gap" type="category" stroke="#64748B" fontSize={10} width={120} />
                  <Tooltip
                    contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Occurrences" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Composition */}
          <div className="glass-card p-6 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-semibold mb-4 text-white">Tenders by Category</h3>
            <div className="h-72 w-full flex items-center justify-center">
              {categoryData.length === 0 ? (
                <p className="text-slate-400 italic text-xs">No category data available</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Eligible Rate gauge */}
          <div className="glass-card p-6 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-semibold mb-4 text-white">Tender Qualification Summary</h3>
            <div className="h-72 w-full flex flex-col items-center justify-center relative">
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-extrabold text-white">{eligiblePercentage}%</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Eligible</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="90%" barSize={15} data={radialData} startAngle={90} endAngle={-270}>
                  <RadialBar
                    background
                    dataKey="value"
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
