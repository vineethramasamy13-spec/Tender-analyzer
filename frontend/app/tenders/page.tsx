'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, X, ChevronDown, IndianRupee, MapPin } from 'lucide-react';
import { TenderCard } from '@/components/TenderCard';
import { MOCK_TENDERS } from '@/lib/mockData';
import { getTenders, getWatchlist, watchTender, unwatchTender } from '@/lib/api';
import { toast } from 'react-hot-toast';

const CATEGORIES = ['IT/Software', 'Cybersecurity', 'Healthcare IT', 'API Development', 'IoT/Software', 'Web Development', 'Data Analytics', 'Mobile App', 'HPC/Software', 'Enterprise Software', 'IoT/Smart City', 'FinTech Analytics', 'EdTech', 'Enterprise Portal'];
const DEADLINE_FILTERS = [
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'quarter', label: 'Next 3 Months' },
];
const SORT_OPTIONS = [
  { id: 'matchScore', label: 'Match Score' },
  { id: 'deadline', label: 'Deadline (Soonest)' },
  { id: 'budget', label: 'Budget (High to Low)' },
];

const STATES = [
  'All States',
  'Central/RBI',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu & Kashmir',
  'Ladakh',
  'Puducherry',
  'Chandigarh',
  'Other'
];

const getTenderState = (location: string, department?: string): string => {
  const dep = department ? department.toLowerCase() : '';
  if (dep.includes('rbi') || dep.includes('reserve bank')) return 'Central/RBI';
  
  const loc = location.toLowerCase();
  
  // Direct state matches first
  if (loc.includes('andhra pradesh')) return 'Andhra Pradesh';
  if (loc.includes('arunachal pradesh')) return 'Arunachal Pradesh';
  if (loc.includes('assam')) return 'Assam';
  if (loc.includes('bihar')) return 'Bihar';
  if (loc.includes('chhattisgarh')) return 'Chhattisgarh';
  if (loc.includes('goa')) return 'Goa';
  if (loc.includes('gujarat')) return 'Gujarat';
  if (loc.includes('haryana')) return 'Haryana';
  if (loc.includes('himachal pradesh')) return 'Himachal Pradesh';
  if (loc.includes('jharkhand')) return 'Jharkhand';
  if (loc.includes('karnataka')) return 'Karnataka';
  if (loc.includes('kerala')) return 'Kerala';
  if (loc.includes('madhya pradesh')) return 'Madhya Pradesh';
  if (loc.includes('maharashtra')) return 'Maharashtra';
  if (loc.includes('manipur')) return 'Manipur';
  if (loc.includes('meghalaya')) return 'Meghalaya';
  if (loc.includes('mizoram')) return 'Mizoram';
  if (loc.includes('nagaland')) return 'Nagaland';
  if (loc.includes('odisha') || loc.includes('orissa')) return 'Odisha';
  if (loc.includes('punjab')) return 'Punjab';
  if (loc.includes('rajasthan')) return 'Rajasthan';
  if (loc.includes('sikkim')) return 'Sikkim';
  if (loc.includes('tamil nadu')) return 'Tamil Nadu';
  if (loc.includes('telangana')) return 'Telangana';
  if (loc.includes('tripura')) return 'Tripura';
  if (loc.includes('uttar pradesh')) return 'Uttar Pradesh';
  if (loc.includes('uttarakhand')) return 'Uttarakhand';
  if (loc.includes('west bengal')) return 'West Bengal';
  if (loc.includes('delhi')) return 'Delhi';
  if (loc.includes('jammu') || loc.includes('kashmir')) return 'Jammu & Kashmir';
  if (loc.includes('ladakh')) return 'Ladakh';
  if (loc.includes('puducherry') || loc.includes('pondicherry')) return 'Puducherry';
  if (loc.includes('chandigarh')) return 'Chandigarh';

  // Major city mappings
  if (loc.includes('mumbai') || loc.includes('pune') || loc.includes('nagpur') || loc.includes('thane') || loc.includes('navi mumbai') || loc.includes('nasik') || loc.includes('aurangabad')) return 'Maharashtra';
  if (loc.includes('bengaluru') || loc.includes('bangalore') || loc.includes('mysore') || loc.includes('mangalore') || loc.includes('hubli')) return 'Karnataka';
  if (loc.includes('chennai') || loc.includes('coimbatore') || loc.includes('madurai') || loc.includes('trichy') || loc.includes('salem')) return 'Tamil Nadu';
  if (loc.includes('hyderabad') || loc.includes('secunderabad') || loc.includes('warangal')) return 'Telangana';
  if (loc.includes('ahmedabad') || loc.includes('surat') || loc.includes('vadodara') || loc.includes('rajkot') || loc.includes('gandhinagar')) return 'Gujarat';
  if (loc.includes('bhopal') || loc.includes('indore') || loc.includes('jabalpur') || loc.includes('gwalior')) return 'Madhya Pradesh';
  if (loc.includes('kolkata') || loc.includes('calcutta') || loc.includes('howrah') || loc.includes('durgapur')) return 'West Bengal';
  if (loc.includes('jaipur') || loc.includes('jodhpur') || loc.includes('udaipur') || loc.includes('ajmer') || loc.includes('kota')) return 'Rajasthan';
  if (loc.includes('lucknow') || loc.includes('kanpur') || loc.includes('noida') || loc.includes('ghaziabad') || loc.includes('agra') || loc.includes('varanasi') || loc.includes('allahabad') || loc.includes('prayagraj')) return 'Uttar Pradesh';
  if (loc.includes('patna') || loc.includes('gaya') || loc.includes('muzaffarpur')) return 'Bihar';
  if (loc.includes('kochi') || loc.includes('trivandrum') || loc.includes('thiruvananthapuram') || loc.includes('calicut') || loc.includes('kozhikode')) return 'Kerala';
  if (loc.includes('gurgaon') || loc.includes('gurugram') || loc.includes('faridabad') || loc.includes('panchkula') || loc.includes('ambala')) return 'Haryana';
  if (loc.includes('bhubaneswar') || loc.includes('cuttack') || loc.includes('rourkela')) return 'Odisha';
  if (loc.includes('guwahati') || loc.includes('dibrugarh') || loc.includes('silchar')) return 'Assam';
  if (loc.includes('ludhiana') || loc.includes('amritsar') || loc.includes('jalandhar') || loc.includes('patiala')) return 'Punjab';
  if (loc.includes('visakhapatnam') || loc.includes('vizag') || loc.includes('vijayawada') || loc.includes('tirupati') || loc.includes('guntur') || loc.includes('nellore')) return 'Andhra Pradesh';
  if (loc.includes('ranchi') || loc.includes('jamshedpur') || loc.includes('dhanbad') || loc.includes('bokaro')) return 'Jharkhand';
  if (loc.includes('raipur') || loc.includes('bilaspur') || loc.includes('durg')) return 'Chhattisgarh';
  if (loc.includes('dehradun') || loc.includes('haridwar') || loc.includes('rishikesh') || loc.includes('nainital')) return 'Uttarakhand';
  if (loc.includes('panaji') || loc.includes('margao') || loc.includes('vasco')) return 'Goa';
  if (loc.includes('shimla') || loc.includes('manali') || loc.includes('dharamshala')) return 'Himachal Pradesh';
  if (loc.includes('srinagar') || loc.includes('jammu tawi')) return 'Jammu & Kashmir';

  return 'Other';
};

export default function TendersPage() {
  const [mounted, setMounted] = useState(false);
  const [tenders, setTenders] = useState<any[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [deadlineFilter, setDeadlineFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('matchScore');
  const [minBudget, setMinBudget] = useState(0);
  const [maxBudget, setMaxBudget] = useState(50000000);
  const [matchMyProfile, setMatchMyProfile] = useState(false);
  const [selectedState, setSelectedState] = useState('All States');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [lastSynced, setLastSynced] = useState<string>('');
  const [displayCount, setDisplayCount] = useState(12);

  useEffect(() => {
    setDisplayCount(12);
  }, [selectedState, search, selectedCategories, deadlineFilter, sortBy, minBudget, maxBudget, matchMyProfile]);

  const handleToggleWatch = async (tenderId: string) => {
    const isCurrentlyWatched = watchlistIds.includes(tenderId);
    try {
      if (isCurrentlyWatched) {
        await unwatchTender(tenderId);
        setWatchlistIds(prev => prev.filter(id => id !== tenderId));
        toast.success('Removed from watchlist');
      } else {
        await watchTender(tenderId);
        setWatchlistIds(prev => [...prev, tenderId]);
        toast.success('Added to watchlist! You will receive email deadline alerts for this tender.');
      }
    } catch (err) {
      console.error('Error toggling watchlist:', err);
      toast.error('Failed to update watchlist.');
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
    let active = true;

    // Load profile from localStorage if available
    let currentProfile = {
      name: 'TechVenture Solutions Pvt Ltd',
      type: 'Startup (DPIIT Recognized)',
      annual_turnover: 180,
      turnover_unit: 'lakhs',
      experience: 5,
      teamSize: 45,
      industry: 'IT/Software',
      state: 'Tamil Nadu',
    };
    let currentCerts = ['ISO 9001'];

    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('business_profile');
      if (savedProfile) {
        try {
          currentProfile = JSON.parse(savedProfile);
        } catch (e) {}
      }
      const savedCerts = localStorage.getItem('business_certs');
      if (savedCerts) {
        try {
          currentCerts = JSON.parse(savedCerts);
        } catch (e) {}
      }
    }

    const calculateMatchScore = (tender: any) => {
      const budget = Number(tender.budget || 0);

      // 1. Estimate Experience Required (scales with budget)
      let expRequired = 3;
      if (budget < 2500000) expRequired = 2;
      else if (budget < 10000000) expRequired = 3;
      else if (budget < 30000000) expRequired = 4;
      else if (budget < 50000000) expRequired = 5;
      else expRequired = 7;

      const expHave = Number(currentProfile.experience || 0);
      const expScore = Math.min(100, (expHave / expRequired) * 100);

      // 2. Estimate Turnover Required (estimated at 50% of budget)
      const turnoverRequired = budget * 0.5;
      let turnoverHave = Number(currentProfile.annual_turnover || 0);
      if (currentProfile.turnover_unit === 'lakhs') turnoverHave *= 100000;
      else if (currentProfile.turnover_unit === 'crores') turnoverHave *= 10000000;

      const turnoverScore = turnoverRequired > 0
        ? Math.min(100, (turnoverHave / turnoverRequired) * 100)
        : 100;

      // 3. Estimate Certifications Required (scales with budget for IT tenders)
      let certsRequired: string[] = ['ISO 9001'];
      const category = tender.category || 'IT/Software';
      const isIT = ['IT/Software', 'Cybersecurity', 'Data Analytics', 'Cloud Services', 'Enterprise Software', 'IoT/Software'].includes(category);

      if (isIT) {
        if (budget >= 30000000) certsRequired = ['ISO 9001', 'ISO 27001', 'CMMI Level 3'];
        else if (budget >= 10000000) certsRequired = ['ISO 9001', 'ISO 27001'];
      }

      const certsHave = currentCerts.map(c => c.toLowerCase());
      let matchedCerts = 0;
      certsRequired.forEach(req => {
        if (certsHave.some(have => have.includes(req.toLowerCase()) || req.toLowerCase().includes(have))) {
          matchedCerts++;
        }
      });
      const certScore = (matchedCerts / certsRequired.length) * 100;

      // 4. Estimate Team Size Score
      const teamSize = Number(currentProfile.teamSize || 0);
      const teamScore = Math.min(100, (teamSize / 20) * 100);

      // 5. Weighted Score (exactly matches the backend eligibility formula)
      const matchScore = Math.round(
        expScore * 0.30 +
        turnoverScore * 0.25 +
        certScore * 0.25 +
        teamScore * 0.20
      );

      return matchScore;
    };

    const fetchTenders = async () => {
      try {
        const data = await getTenders();
        if (active) {
          const normalized = data.map((t: any) => {
            const budgetVal = Number(t.budget || t.budget_max || 0);

            // Format budget display
            let budgetDisp = '';
            if (budgetVal >= 10000000) {
              budgetDisp = `Rs. ${(budgetVal / 10000000).toFixed(2)} Cr`;
            } else if (budgetVal >= 100000) {
              budgetDisp = `Rs. ${(budgetVal / 100000).toFixed(1)} L`;
            } else {
              budgetDisp = `Rs. ${budgetVal.toLocaleString()}`;
            }

            // Calculate days left
            let days = 30;
            if (t.deadline) {
              try {
                const diff = new Date(t.deadline).getTime() - new Date().getTime();
                days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
              } catch (e) {
                days = 30;
              }
            }

            const category = t.category || 'IT/Software';
            const expRequired = budgetVal < 2500000 ? 2 : budgetVal < 10000000 ? 3 : budgetVal < 30000000 ? 4 : budgetVal < 50000000 ? 5 : 7;
            const turnoverRequired = budgetVal * 0.5;
            let certsRequired = ['ISO 9001'];
            const isIT = ['IT/Software', 'Cybersecurity', 'Data Analytics', 'Cloud Services', 'Enterprise Software', 'IoT/Software'].includes(category);
            if (isIT) {
              if (budgetVal >= 30000000) certsRequired = ['ISO 9001', 'ISO 27001', 'CMMI Level 3'];
              else if (budgetVal >= 10000000) certsRequired = ['ISO 9001', 'ISO 27001'];
            }

            return {
              id: t.tender_id || t.id || 'T000',
              title: t.title || 'Government Tender',
              department: t.department || 'Government Department',
              ministry: t.ministry || 'Govt',
              budget: budgetVal,
              budgetDisplay: budgetDisp,
              category: category,
              deadline: t.deadline || '',
              daysLeft: days,
              matchScore: calculateMatchScore(t),
              description: t.description || '',
              location: t.location || t.state || 'India',
              tenderNo: t.reference_number || t.tenderNo || 'REF/001',
              status: t.status || 'open',
              stateCode: getTenderState(t.location || t.state || 'India', t.department || ''),
              applyUrl: t.apply_url || t.link || (t.source === 'GeM' ? 'https://bidplus.gem.gov.in/all-bids' : 'https://eprocure.gov.in/eprocure/app?page=FrontEndTenderSearchExternal&service=page'),
              metadata: t.metadata || {
                title: t.title || 'Government Tender',
                department: t.department || 'Government Department',
                budget: budgetVal,
                deadline: t.deadline || '',
                category: category,
                reference_number: t.reference_number || t.tenderNo || 'REF/001',
                experience_required: expRequired,
                turnover_required: turnoverRequired,
                certifications: certsRequired,
                technical_requirements: [category],
                timeline: '12 months',
                evaluation_criteria: ['Technical Score (70%)', 'Financial Score (30%)']
              }
            };
          });
          setTenders(normalized);
          setLastSynced(new Date().toLocaleTimeString());
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching tenders:', err);
        if (active) {
          setTenders(MOCK_TENDERS);
          setLoading(false);
        }
      }
    };

    const fetchWatchlist = async () => {
      try {
        const data = await getWatchlist();
        if (active && Array.isArray(data)) {
          setWatchlistIds(data.map((item: any) => item.tender_id || item.id));
        }
      } catch (err) {
        console.error('Error fetching watchlist:', err);
      }
    };

    fetchWatchlist();
    fetchTenders();
    const interval = setInterval(() => {
      fetchTenders();
      fetchWatchlist();
    }, 10000); // Polling every 10 seconds

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const filteredExceptState = useMemo(() => {
    let result = [...tenders];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    if (selectedCategories.length > 0) {
      result = result.filter((t) => selectedCategories.includes(t.category));
    }

    if (deadlineFilter === 'week') {
      result = result.filter((t) => t.daysLeft <= 7);
    } else if (deadlineFilter === 'month') {
      result = result.filter((t) => t.daysLeft <= 30);
    } else if (deadlineFilter === 'quarter') {
      result = result.filter((t) => t.daysLeft <= 90);
    }

    if (matchMyProfile) {
      result = result.filter((t) => t.matchScore >= 70);
    }

    result = result.filter((t) => t.budget >= minBudget && t.budget <= maxBudget);

    return result;
  }, [tenders, search, selectedCategories, deadlineFilter, matchMyProfile, minBudget, maxBudget]);

  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All States': filteredExceptState.length };
    filteredExceptState.forEach((t) => {
      const s = t.stateCode || 'Other';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [filteredExceptState]);

  const activeStates = useMemo(() => {
    return STATES.filter((s) => {
      if (s === 'All States') return true;
      return (stateCounts[s] || 0) > 0;
    });
  }, [stateCounts]);

  const filtered = useMemo(() => {
    let result = [...filteredExceptState];

    if (selectedState && selectedState !== 'All States') {
      result = result.filter((t) => t.stateCode === selectedState);
    }

    result.sort((a, b) => {
      if (sortBy === 'matchScore') return b.matchScore - a.matchScore;
      if (sortBy === 'deadline') return a.daysLeft - b.daysLeft;
      if (sortBy === 'budget') return b.budget - a.budget;
      return 0;
    });

    return result;
  }, [filteredExceptState, selectedState, sortBy]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategories([]);
    setDeadlineFilter('');
    setSortBy('matchScore');
    setMinBudget(0);
    setMaxBudget(50000000);
    setMatchMyProfile(false);
    setSelectedState('All States');
  };

  const activeFilterCount =
    selectedCategories.length +
    (deadlineFilter ? 1 : 0) +
    (matchMyProfile ? 1 : 0) +
    (minBudget > 0 || maxBudget < 50000000 ? 1 : 0) +
    (selectedState !== 'All States' ? 1 : 0);

  if (!mounted) return <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }} />;


  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', paddingTop: 80 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1
              className="text-3xl font-black"
              style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}
            >
              Tender Discovery
            </h1>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(16,185,129,0.12)',
                color: '#34D399',
                border: '1px solid rgba(16,185,129,0.25)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Auto-Syncing (India)
            </div>
            {lastSynced && (
              <span className="text-xs" style={{ color: '#64748B' }}>
                (Synced {lastSynced})
              </span>
            )}
          </div>
          <p style={{ color: '#64748B' }}>
            {filtered.length} tenders found across GeM, CPPP, eProcure portals
          </p>
        </motion.div>

        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: '#64748B' }}
            />
            <input
              type="text"
              placeholder="Search tenders by title, department, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#F1F5F9',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: '#64748B' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-4 pr-8 py-3 rounded-xl text-sm outline-none appearance-none cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#F1F5F9',
                minWidth: 180,
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id} style={{ background: '#0D1526' }}>
                  Sort: {o.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#64748B' }} />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: filtersOpen ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${filtersOpen ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: filtersOpen ? '#60A5FA' : '#94A3B8',
            }}
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#3B82F6', color: 'white' }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick State Filtering Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {activeStates.map((state) => {
              const isActive = selectedState === state;
              const count = stateCounts[state] || 0;
              return (
                <button
                  key={state}
                  onClick={() => setSelectedState(state)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border"
                  style={{
                    background: isActive ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))' : 'rgba(255,255,255,0.03)',
                    borderColor: isActive ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.06)',
                    color: isActive ? '#60A5FA' : '#94A3B8',
                  }}
                >
                  <MapPin size={11} className={isActive ? 'text-blue-400' : 'text-slate-500'} />
                  {state}
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                    style={{
                      background: isActive ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.06)',
                      color: isActive ? '#F1F5F9' : '#64748B',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters Panel */}
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-static rounded-2xl p-6 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Categories */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Filter size={14} style={{ color: '#3B82F6' }} />
                  <span className="text-xs font-bold" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                    CATEGORY
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.slice(0, 8).map((cat) => {
                    const selected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className="text-xs px-2.5 py-1 rounded-full transition-all"
                        style={{
                          background: selected ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${selected ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          color: selected ? '#60A5FA' : '#64748B',
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Deadline */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                    DEADLINE
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {DEADLINE_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setDeadlineFilter(deadlineFilter === f.id ? '' : f.id)}
                      className="text-left text-sm px-3 py-2 rounded-lg transition-all"
                      style={{
                        background: deadlineFilter === f.id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${deadlineFilter === f.id ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        color: deadlineFilter === f.id ? '#60A5FA' : '#94A3B8',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* State Filter */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                    STATE
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#F1F5F9',
                    }}
                  >
                    {STATES.map((s) => (
                      <option key={s} value={s} style={{ background: '#0D1526' }}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#64748B' }} />
                </div>
              </div>

              {/* Options */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                    OPTIONS
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className="w-10 h-6 rounded-full transition-all relative"
                      style={{
                        background: matchMyProfile ? '#3B82F6' : 'rgba(255,255,255,0.1)',
                      }}
                      onClick={() => setMatchMyProfile(!matchMyProfile)}
                    >
                      <div
                        className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: matchMyProfile ? 22 : 2 }}
                      />
                    </div>
                    <span className="text-sm" style={{ color: '#94A3B8' }}>
                      Match my profile (≥70%)
                    </span>
                  </label>

                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all mt-2"
                      style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      <X size={14} />
                      Clear All Filters
                    </button>
                  )}
                </div>

                {/* Budget Range */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <IndianRupee size={12} style={{ color: '#10B981' }} />
                    <span className="text-xs font-bold" style={{ color: '#94A3B8' }}>
                      BUDGET: ₹{(minBudget / 100000).toFixed(0)}L – ₹{(maxBudget / 100000).toFixed(0)}L
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50000000}
                    step={500000}
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tender Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <p className="text-sm" style={{ color: '#64748B' }}>Loading and synchronizing active tenders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Search size={48} className="mx-auto mb-4 opacity-20" style={{ color: '#64748B' }} />
            <h3 className="text-xl font-bold mb-2" style={{ color: '#F1F5F9' }}>No tenders found</h3>
            <p style={{ color: '#64748B' }}>Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="mt-4 text-sm" style={{ color: '#3B82F6' }}>
              Clear all filters
            </button>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.slice(0, displayCount).map((tender, idx) => (
                <motion.div
                  key={tender.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.12, idx * 0.01), duration: 0.2 }}
                >
                  <TenderCard 
                    tender={tender} 
                    isWatched={watchlistIds.includes(tender.id)}
                    onToggleWatch={() => handleToggleWatch(tender.id)}
                  />
                </motion.div>
              ))}
            </div>
            {filtered.length > displayCount && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setDisplayCount((prev) => prev + 12)}
                  className="px-6 py-3 rounded-xl font-bold transition-all border border-blue-500/20 hover:border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 text-sm hover:scale-[1.02]"
                >
                  Load More Tenders (+12)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
