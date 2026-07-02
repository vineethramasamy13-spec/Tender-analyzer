'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

const CERTIFICATIONS_OPTS = ['ISO 9001', 'ISO 27001', 'CMMI Level 3', 'CMMI Level 5', 'ISO 14001', 'PCI DSS', 'SOC 2'];
const COMPANY_TYPES = ['Startup (DPIIT Recognized)', 'MSME', 'SME', 'Enterprise', 'NGO', 'Public Sector'];
const INDUSTRIES = ['IT/Software', 'Cybersecurity', 'Data Analytics', 'IoT', 'Cloud Services', 'EdTech', 'HealthTech', 'FinTech', 'Consulting'];

interface BusinessProfileFormProps {
  profile: {
    name: string;
    type: string;
    annual_turnover: number;
    turnover_unit: string;
    experience: number;
    teamSize: number;
    industry: string;
    state: string;
  };
  setProfile: (p: any) => void;
  selectedCerts: string[];
  setSelectedCerts: (c: string[]) => void;
}

export function BusinessProfileForm({ profile, setProfile, selectedCerts, setSelectedCerts }: BusinessProfileFormProps) {
  const [newCert, setNewCert] = useState('');

  const toggleCert = (cert: string) => {
    if (selectedCerts.includes(cert)) {
      setSelectedCerts(selectedCerts.filter((c) => c !== cert));
    } else {
      setSelectedCerts([...selectedCerts, cert]);
    }
  };

  const handleAddCustomCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCert.trim() && !selectedCerts.includes(newCert.trim())) {
      setSelectedCerts([...selectedCerts, newCert.trim()]);
      setNewCert('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company Name */}
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: '#94A3B8' }}>Company Name</label>
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
        </div>

        {/* Company Type */}
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: '#94A3B8' }}>Company Type</label>
          <select
            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            value={profile.type}
            onChange={(e) => setProfile({ ...profile, type: e.target.value })}
          >
            {COMPANY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Turnover value & unit */}
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: '#94A3B8' }}>Annual Turnover</label>
          <div className="flex gap-2">
            <input
              type="number"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              value={profile.annual_turnover}
              onChange={(e) => {
                const v = e.target.value;
                const clean = v.startsWith('0') && v.length > 1 ? v.replace(/^0+/, '') : v;
                setProfile({ ...profile, annual_turnover: clean === '' ? '' : parseFloat(clean) });
              }}
            />
            <select
              className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              value={profile.turnover_unit}
              onChange={(e) => setProfile({ ...profile, turnover_unit: e.target.value })}
            >
              <option value="lakhs">Lakhs (INR)</option>
              <option value="crores">Crores (INR)</option>
              <option value="absolute">Absolute (INR)</option>
            </select>
          </div>
        </div>

        {/* Experience years */}
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: '#94A3B8' }}>Years of Experience</label>
          <input
            type="number"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            value={profile.experience}
            onChange={(e) => {
              const v = e.target.value;
              const clean = v.startsWith('0') && v.length > 1 ? v.replace(/^0+/, '') : v;
              setProfile({ ...profile, experience: clean === '' ? '' : parseInt(clean, 10) });
            }}
          />
        </div>

        {/* Team Size */}
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: '#94A3B8' }}>Team Size</label>
          <input
            type="number"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            value={profile.teamSize}
            onChange={(e) => {
              const v = e.target.value;
              const clean = v.startsWith('0') && v.length > 1 ? v.replace(/^0+/, '') : v;
              setProfile({ ...profile, teamSize: clean === '' ? '' : parseInt(clean, 10) });
            }}
          />
        </div>

        {/* Industry */}
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: '#94A3B8' }}>Industry</label>
          <select
            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            value={profile.industry}
            onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
          >
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: '#94A3B8' }}>Registered State</label>
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            value={profile.state}
            onChange={(e) => setProfile({ ...profile, state: e.target.value })}
          />
        </div>
      </div>

      {/* Certifications Checkbox Chips */}
      <div>
        <label className="text-xs font-semibold block mb-2" style={{ color: '#94A3B8' }}>Company Certifications</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {CERTIFICATIONS_OPTS.map((cert) => {
            const selected = selectedCerts.includes(cert);
            return (
              <button
                type="button"
                key={cert}
                onClick={() => toggleCert(cert)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  selected
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/50'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                }`}
              >
                {cert}
              </button>
            );
          })}
        </div>

        {/* Custom Certs */}
        <form onSubmit={handleAddCustomCert} className="flex gap-2 max-w-sm">
          <input
            type="text"
            placeholder="Add other certification (e.g. ISO 14001)"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            value={newCert}
            onChange={(e) => setNewCert(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
          >
            <Plus size={14} /> Add
          </button>
        </form>
      </div>
    </div>
  );
}
