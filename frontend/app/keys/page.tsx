'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Eye, EyeOff, Save, AlertCircle, Trash2, Settings, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { getApiKeys, saveApiKeys } from '@/lib/api';

export default function ApiKeysPage() {
  const router = useRouter();
  const [groqKey, setGroqKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [showGroq, setShowGroq] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [configuredKeys, setConfiguredKeys] = useState<{
    groq_api_key_configured: boolean;
    gemini_api_key_configured: boolean;
    groq_api_key_masked: string;
    gemini_api_key_masked: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchKeys = async () => {
    try {
      const data = await getApiKeys();
      setConfiguredKeys(data);
    } catch (err) {
      console.error('Error fetching API key configuration:', err);
      toast.error('Failed to load API key status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groqKey && !geminiKey) {
      toast.error('Please enter at least one API key to save.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: { groq_api_key?: string; gemini_api_key?: string } = {};
      if (groqKey) payload.groq_api_key = groqKey;
      if (geminiKey) payload.gemini_api_key = geminiKey;

      await saveApiKeys(payload);
      toast.success('API keys updated successfully!');
      router.push('/dashboard');
    } catch (err) {
      console.error('Error saving API keys:', err);
      toast.error('Failed to save API keys.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = async (provider: 'groq' | 'gemini') => {
    setSubmitting(true);
    try {
      const payload: { groq_api_key?: string; gemini_api_key?: string } = {};
      if (provider === 'groq') payload.groq_api_key = '';
      if (provider === 'gemini') payload.gemini_api_key = '';

      await saveApiKeys(payload);
      toast.success(`${provider.toUpperCase()} API key removed.`);
      await fetchKeys();
    } catch (err) {
      console.error('Error clearing API key:', err);
      toast.error('Failed to remove API key.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium font-mono">Loading key configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', paddingTop: 90 }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #22C55E, #10B981)', boxShadow: '0 0 15px rgba(34, 197, 94, 0.2)' }}
          >
            <Key size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Fira Sans, sans-serif' }}>
              LLM API Key Settings
            </h1>
            <p className="text-sm text-slate-400" style={{ fontFamily: 'Fira Sans, sans-serif' }}>
              Configure your own private keys to secure your daily limits and run agent flows
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Security details (Left Panel) */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-1 flex flex-col gap-6"
          >
            <div className="glass-card p-6 border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl rounded-2xl flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Lock size={20} />
              </div>
              <h2 className="text-md font-bold text-white leading-tight">Private & Encrypted</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your keys are stored securely under your account in our database profile and sent in authorized payloads only.
              </p>
              <div className="w-full border-t border-white/5 pt-4 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Security Mode</span>
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-emerald-400 text-xs font-semibold">
                  <Settings size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
                  Custom User Keys Enabled
                </div>
              </div>
            </div>

            <div className="glass-card p-5 border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl rounded-2xl flex items-start gap-3">
              <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={16} />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                If no custom keys are entered, the system will fall back to using default backend server settings where available.
              </p>
            </div>
          </motion.div>

          {/* Key Form inputs (Right Panel) */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-2 flex flex-col gap-6"
          >
            <form onSubmit={handleSave} className="glass-card p-6 border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl rounded-2xl flex flex-col gap-6">
              <h3 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-3">Update API Credentials</h3>

              {/* Groq Key Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Groq API Key (Llama 3.3 70B Agent Reasoning)</span>
                  {configuredKeys?.groq_api_key_configured && (
                    <span className="text-emerald-400 normal-case font-medium">Configured: {configuredKeys.groq_api_key_masked}</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showGroq ? 'text' : 'password'}
                    placeholder={configuredKeys?.groq_api_key_configured ? '••••••••••••••••' : 'gsk_...'}
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 pr-20 text-sm text-slate-200 outline-none transition-all font-mono"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowGroq(!showGroq)}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showGroq ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {configuredKeys?.groq_api_key_configured && (
                      <button
                        type="button"
                        onClick={() => handleClear('groq')}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete key"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Need a key?</span>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline transition-colors font-sans"
                  >
                    Get Groq API Key →
                  </a>
                </div>
              </div>

              {/* Gemini Key Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Google Gemini API Key (PDF Document Extraction)</span>
                  {configuredKeys?.gemini_api_key_configured && (
                    <span className="text-emerald-400 normal-case font-medium">Configured: {configuredKeys.gemini_api_key_masked}</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showGemini ? 'text' : 'password'}
                    placeholder={configuredKeys?.gemini_api_key_configured ? '••••••••••••••••' : 'AIzaSy...'}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 pr-20 text-sm text-slate-200 outline-none transition-all font-mono"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowGemini(!showGemini)}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showGemini ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {configuredKeys?.gemini_api_key_configured && (
                      <button
                        type="button"
                        onClick={() => handleClear('gemini')}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete key"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Need a key?</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline transition-colors font-sans"
                  >
                    Get Gemini API Key →
                  </a>
                </div>
              </div>
              {/* Form buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #22C55E, #10B981)',
                    boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)',
                    opacity: submitting ? 0.8 : 1,
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Save size={16} />
                  {submitting ? 'Saving Configuration...' : 'Save API Keys'}
                </button>
                <Link
                  href="/?homepage=true"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all border border-white/10 hover:bg-white/5 text-slate-300 text-sm"
                >
                  Proceed to Homepage
                  <ArrowRight size={16} />
                </Link>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
