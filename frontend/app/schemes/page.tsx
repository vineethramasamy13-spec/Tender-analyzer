'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, AlertCircle, Award, CheckCircle, ArrowRight } from 'lucide-react';
import { MOCK_SCHEMES } from '@/lib/mockData';
import { SchemeCard } from '@/components/SchemeCard';

export default function SchemesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'central' | 'state' | 'ministry'>('all');
  const [matchOnly, setMatchOnly] = useState(false);

  // Filter schemes
  const filteredSchemes = MOCK_SCHEMES.filter((scheme) => {
    const matchesSearch =
      scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'all' || scheme.providerType === activeTab;
    const matchesProfile = !matchOnly || scheme.matchScore >= 75;

    return matchesSearch && matchesTab && matchesProfile;
  });

  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-3">
            <Sparkles size={12} />
            Government Subsidies & Benefits
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl">
            Government Schemes & Subsidies
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">
            Find and match government schemes, tax benefits, grants, and collateral-free funding programs applicable to your business profile.
          </p>
        </div>
      </div>

      {/* Filters Area */}
      <div className="glass-card p-6 flex flex-col gap-6 md:flex-row md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search schemes, benefits, or agencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filters and Toggle */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Tabs */}
          <div className="flex items-center bg-slate-900/60 border border-slate-800 rounded-xl p-1">
            {(['all', 'central', 'state', 'ministry'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-semibold px-4 py-2 rounded-lg capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'all' ? 'All Schemes' : `${tab} Govt`}
              </button>
            ))}
          </div>

          {/* Profile Match Toggle */}
          <button
            onClick={() => setMatchOnly(!matchOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              matchOnly
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle size={14} className={matchOnly ? 'text-emerald-400' : 'text-slate-400'} />
            High Match Profile ({'>'}75%)
          </button>
        </div>
      </div>

      {/* Grid List */}
      {filteredSchemes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme, idx) => (
            <motion.div
              key={scheme.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(0.12, idx * 0.01) }}
            >
              <SchemeCard scheme={scheme} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-500">
            <AlertCircle size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-200">No schemes found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Try adjusting your filters, search terms, or check back later for newly announced government schemes.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveTab('all');
              setMatchOnly(false);
            }}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all mt-2"
          >
            Clear All Filters
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
