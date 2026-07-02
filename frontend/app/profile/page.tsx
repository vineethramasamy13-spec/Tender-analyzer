'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Briefcase, Building, ShieldCheck, Award, ArrowRight, Save, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBusinessProfile, saveBusinessProfile } from '@/lib/api';

const COMMON_CERTS = [
  'ISO 9001',
  'ISO 27001',
  'ISO 20000',
  'CMMI Level 3',
  'CMMI Level 5',
  'DPIIT Recognition',
  'MSME Registered'
];

const INDUSTRIES = [
  'IT/Software',
  'Infrastructure',
  'Consulting',
  'Healthcare',
  'Education',
  'Cybersecurity',
  'Data Analytics',
  'Other'
];

const STATES = [
  'Tamil Nadu',
  'Maharashtra',
  'Delhi',
  'Karnataka',
  'Telangana',
  'Gujarat',
  'Haryana',
  'Uttar Pradesh',
  'West Bengal',
  'Kerala',
  'All India'
];

export default function BusinessProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('startup');
  const [turnover, setTurnover] = useState<string | number>('10');
  const [turnoverUnit, setTurnoverUnit] = useState<'absolute' | 'lakhs' | 'crores'>('lakhs');
  const [experience, setExperience] = useState<string | number>('3');
  const [teamSize, setTeamSize] = useState<string | number>('10');
  const [industry, setIndustry] = useState('IT/Software');
  const [state, setState] = useState('All India');
  const [certifications, setCertifications] = useState<string[]>([]);
  const [customCert, setCustomCert] = useState('');

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm(
      "WARNING: Are you absolutely sure you want to delete your account completely?\n\nThis will permanently delete your user login, all business profile data, and saved tender evaluations. This action cannot be undone."
    );
    if (confirmDelete) {
      const confirmText = window.prompt("Please type 'DELETE' to confirm deletion:");
      if (confirmText === 'DELETE') {
        const id = toast.loading('Deleting account and purging data...');
        setTimeout(() => {
          localStorage.clear();
          toast.success('Account deleted successfully.', { id });
          setTimeout(() => {
            window.location.href = '/auth';
          }, 1000);
        }, 1500);
      } else {
        toast.error('Deletion cancelled. Confirmation text did not match.');
      }
    }
  };

  // Fetch existing profile if any
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getBusinessProfile();
        if (profile) {
          setCompanyName(profile.name || '');
          setCompanyType(profile.company_type || 'startup');
          // Support both turnover and annual_turnover field variations
          const rawTurnover = profile.annual_turnover || profile.turnover || 0;
          
          if (profile.turnover_unit) {
            setTurnoverUnit(profile.turnover_unit);
            if (profile.turnover_unit === 'lakhs') {
              setTurnover(rawTurnover / 100000);
            } else if (profile.turnover_unit === 'crores') {
              setTurnover(rawTurnover / 10000000);
            } else {
              setTurnover(rawTurnover);
            }
          } else {
            // Estimate unit based on magnitude
            if (rawTurnover >= 10000000) {
              setTurnover(rawTurnover / 10000000);
              setTurnoverUnit('crores');
            } else if (rawTurnover >= 100000) {
              setTurnover(rawTurnover / 100000);
              setTurnoverUnit('lakhs');
            } else {
              setTurnover(rawTurnover);
              setTurnoverUnit('absolute');
            }
          }
          
          setExperience(profile.experience_years ?? 3);
          setTeamSize(profile.team_size ?? 10);
          setIndustry(profile.industry || 'IT/Software');
          setState(profile.state || 'All India');
          setCertifications(profile.certifications || []);
        }
      } catch (err) {
        console.error('Error fetching existing profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleAddCert = (cert: string) => {
    const cleanCert = cert.trim();
    if (!cleanCert) return;
    if (certifications.includes(cleanCert)) {
      toast.error('Certification already added!');
      return;
    }
    setCertifications([...certifications, cleanCert]);
    setCustomCert('');
  };

  const handleRemoveCert = (cert: string) => {
    setCertifications(certifications.filter((c) => c !== cert));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error('Please enter your company name');
      return;
    }

    setSaving(true);
    try {
      // Calculate absolute turnover in INR
      let absoluteTurnover = Number(turnover);
      if (turnoverUnit === 'lakhs') {
        absoluteTurnover = Number(turnover) * 100000;
      } else if (turnoverUnit === 'crores') {
        absoluteTurnover = Number(turnover) * 10000000;
      }

      const payload = {
        name: companyName,
        company_type: companyType,
        turnover: absoluteTurnover,
        annual_turnover: absoluteTurnover,
        turnover_unit: turnoverUnit,
        experience_years: Number(experience),
        team_size: Number(teamSize),
        industry,
        state,
        certifications
      };

      await saveBusinessProfile(payload);
      if (typeof window !== 'undefined') {
        localStorage.setItem('business_profile', JSON.stringify({
          name: companyName,
          type: companyType === 'startup' ? 'Startup (DPIIT Recognized)' : companyType === 'msme' ? 'MSME' : companyType === 'enterprise' ? 'Enterprise' : 'NGO',
          annual_turnover: Number(turnover),
          turnover_unit: turnoverUnit,
          experience: Number(experience),
          teamSize: Number(teamSize),
          industry,
          state
        }));
        localStorage.setItem('business_certs', JSON.stringify(certifications));
      }
      toast.success('Business profile saved successfully!');
      router.push('/keys');
    } catch (err: any) {
      console.error('Error saving business profile:', err);
      toast.error('Failed to save business profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium font-mono">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-2xl w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl mb-3 text-emerald-400">
            <Building size={24} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Setup Business Profile
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            Provide your business capabilities to automatically evaluate bidding eligibility and government subsidy matching.
          </p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Row 1: Company Name & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Technologies Private Limited"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Company Type
                </label>
                <select
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value)}
                  className="bg-[#0b1329] border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-all cursor-pointer"
                >
                  <option value="startup">Startup</option>
                  <option value="msme">MSME</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="ngo">NGO</option>
                </select>
              </div>
            </div>

            {/* Row 2: Annual Turnover */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Average Annual Turnover
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="0.0"
                  value={turnover}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTurnover(v.startsWith('0') && v.length > 1 ? v.replace(/^0+/, '') : v);
                  }}
                  className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-all"
                />
                <select
                  value={turnoverUnit}
                  onChange={(e) => setTurnoverUnit(e.target.value as any)}
                  className="w-32 bg-[#0b1329] border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-all cursor-pointer"
                >
                  <option value="lakhs">Lakhs (INR)</option>
                  <option value="crores">Crores (INR)</option>
                  <option value="absolute">Absolute (INR)</option>
                </select>
              </div>
            </div>

            {/* Row 3: Experience & Team Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Years of Experience
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="0"
                  value={experience}
                  onChange={(e) => {
                    const v = e.target.value;
                    setExperience(v.startsWith('0') && v.length > 1 ? v.replace(/^0+/, '') : v);
                  }}
                  className="bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Active Team Size
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="1"
                  value={teamSize}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTeamSize(v.startsWith('0') && v.length > 1 ? v.replace(/^0+/, '') : v);
                  }}
                  className="bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-all"
                />
              </div>
            </div>

            {/* Row 4: Industry & State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Industry Vertical
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="bg-[#0b1329] border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-all cursor-pointer"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  State of Registration
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="bg-[#0b1329] border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-all cursor-pointer"
                >
                  {STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Certifications Selection */}
            <div className="flex flex-col gap-2 border-t border-white/5 pt-5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Certifications / Credentials
              </label>
              
              {/* Quick-add Common Certifications */}
              <div className="flex flex-wrap gap-2 mb-2">
                {COMMON_CERTS.map((cert) => {
                  const exists = certifications.includes(cert);
                  return (
                    <button
                      key={cert}
                      type="button"
                      onClick={() => exists ? handleRemoveCert(cert) : handleAddCert(cert)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-all border ${
                        exists
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-semibold'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      {exists ? '✓ ' : '+ '}
                      {cert}
                    </button>
                  );
                })}
              </div>

              {/* Custom Cert Entry */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter other custom certifications..."
                  value={customCert}
                  onChange={(e) => setCustomCert(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCert(customCert);
                    }
                  }}
                  className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleAddCert(customCert)}
                  className="px-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white rounded-xl text-slate-300 flex items-center justify-center transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Added Cert Chips */}
              {certifications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 bg-white/5 border border-white/5 p-3 rounded-xl max-h-32 overflow-y-auto">
                  {certifications.map((cert) => (
                    <div
                      key={cert}
                      className="flex items-center gap-1.5 bg-white/10 border border-white/10 text-slate-200 text-xs px-3 py-1 rounded-lg"
                    >
                      <span>{cert}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCert(cert)}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons Row */}
            <div className="flex flex-col sm:flex-row gap-3 border-t border-white/5 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold transition-all"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)',
                  opacity: saving ? 0.8 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                <Save size={16} />
                {saving ? 'Saving Profile...' : 'Save & Proceed'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/keys')}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all border border-white/10 hover:bg-white/5 text-slate-300 text-sm"
              >
                Skip Setup
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Danger Zone */}
            <div className="mt-8 p-6 rounded-2xl border border-red-500/20 bg-red-500/5 flex flex-col gap-4">
              <div>
                <h4 className="text-sm font-bold text-red-500" style={{ fontFamily: 'Inter, sans-serif' }}>Danger Zone</h4>
                <p className="text-xs text-slate-400 mt-1">Permanently delete your user account and completely wipe all business profile data.</p>
              </div>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold transition-all text-sm shadow-lg shadow-red-600/10"
              >
                Delete Account Completely
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </div>
  );
}
