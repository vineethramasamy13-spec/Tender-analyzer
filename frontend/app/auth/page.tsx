'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, User, ShieldCheck, Search, Brain, Award, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { login, register, sendOtp } from '@/lib/api';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      if (isLogin) {
        const token = await login(email, password);
        localStorage.setItem('token', token);
        toast.success('Logged in successfully!');
        router.push('/keys');
      } else {
        if (!showOtp) {
          await sendOtp(email);
          toast.success('Verification code sent to your email! Please check your inbox.');
          setShowOtp(true);
        } else {
          if (!otp || otp.length !== 6) {
            toast.error('Please enter the 6-digit verification code.');
            setLoading(false);
            return;
          }
          await register(name, email, password, otp);
          toast.success('Account verified and created successfully!');
          const token = await login(email, password);
          localStorage.setItem('token', token);
          router.push('/profile');
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Authentication failed. Please try again.';
      toast.error(errorMsg);
      // Auto-switch to Sign In tab if user already exists
      if (errorMsg.toLowerCase().includes('already exists')) {
        setIsLogin(true);
        setShowOtp(false);
        setOtp('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      await sendOtp(email);
      toast.success('Verification code resent! Please check your inbox.');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-4" style={{ background: '#0A0F1E' }}>
      {/* Mesh gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }}></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-8 rounded-3xl border border-white/5 relative z-10"
        style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)' }}
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {showOtp ? 'Verify Your Email' : isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 text-center">
            {showOtp 
              ? 'Enter the 6-digit code sent to your email address' 
              : isLogin 
                ? 'Sign in to access your tender analytics' 
                : 'Sign up to start analyzing government bids'}
          </p>
        </div>

        {/* Feature Badges inside the card */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-6 pb-5 border-b border-white/5">
          {[
            { label: 'Smart Discovery', color: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA' },
            { label: '6-Agent Pipeline', color: 'rgba(139, 92, 246, 0.15)', text: '#A78BFA' },
            { label: 'Bid Prediction', color: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24' },
            { label: 'Scheme Matching', color: 'rgba(16, 185, 129, 0.15)', text: '#34D399' },
          ].map((badge) => (
            <span 
              key={badge.label}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/5"
              style={{ background: badge.color, color: badge.text }}
            >
              {badge.label}
            </span>
          ))}
        </div>

        {showOtp ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-slate-400">
                Verification Code (6-Digit OTP)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <ShieldCheck size={16} />
                </span>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  className="w-full bg-white/5 border border-white/5 hover:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 tracking-[0.5em] font-mono text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 text-center">
                A 6-digit verification code has been sent to your email address. Please check your inbox and spam folder.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl py-2.5 text-sm font-semibold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'Verifying OTP...' : 'Verify & Register'}
            </button>

            <div className="flex items-center justify-between text-xs mt-4">
              <button
                type="button"
                className="text-slate-400 hover:underline"
                onClick={() => {
                  setShowOtp(false);
                  setOtp('');
                }}
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={resending}
                className="text-blue-400 hover:underline disabled:text-slate-500"
                onClick={handleResendOtp}
              >
                {resending ? 'Resending...' : 'Resend Code'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-slate-400">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/5 hover:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="relative">
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-slate-400">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="w-full bg-white/5 border border-white/5 hover:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-slate-400">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/5 hover:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl py-2.5 text-sm font-semibold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Send Verification OTP'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            className="text-xs text-blue-400 hover:underline"
            onClick={() => {
              setIsLogin(!isLogin);
              setShowOtp(false);
              setOtp('');
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </motion.div>

      {/* Small details footer below the card */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8 text-center max-w-sm px-4 relative z-10"
      >
        <p className="text-[11px] text-slate-500 leading-relaxed">
          TENDERAI: AI-Powered Tender Intelligence. 
          Analyze GeM & CPPP documents, score eligibility, and draft bids. 
          <br />
          <span className="text-[10px] text-slate-600 font-mono mt-1 block">
            500+ Bids Evaluated • 92% Match Accuracy • ₹1200Cr+ Opportunities Tracked
          </span>
        </p>
      </motion.div>
    </div>
  );
}
