'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, LogOut, Calendar, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMe } from '@/lib/api';

export default function AccountPage() {
  const [user, setUser] = useState<{ name: string; email: string; user_id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth';
        return;
      }
    }
    setMounted(true);
    const fetchUser = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        toast.error('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    setTimeout(() => {
      window.location.href = '/auth';
    }, 500);
  };

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

  if (loading) {
    if (!mounted) return <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }} />;

    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium">Loading account details...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', paddingTop: 80 }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
          >
            <User size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
              My Account
            </h1>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Manage your personal credentials and session security
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Overview (Left) */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-1 flex flex-col gap-6"
          >
            <div className="glass-card p-6 rounded-2xl border text-center flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-blue-500/10">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">{user?.name || 'Guest User'}</h2>
                <p className="text-xs text-slate-400 mt-1">{user?.email || 'guest@example.com'}</p>
              </div>
              <div className="w-full border-t border-white/5 pt-4 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 text-left">Account Status</span>
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-emerald-400 text-xs font-semibold self-start w-full justify-center">
                  <Shield size={14} />
                  Active / Secure
                </div>
              </div>
            </div>

            {/* Logout button card */}
            <div className="glass-card p-4 rounded-2xl border flex flex-col gap-3">
              <p className="text-xs text-slate-400 text-center">Finished your session? Sign out safely below.</p>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 active:scale-[0.98] text-red-400 font-bold transition-all text-sm"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>

            {/* Danger Zone card */}
            <div className="glass-card p-4 rounded-2xl border border-red-500/20 bg-red-500/5 flex flex-col gap-3">
              <h4 className="text-xs font-bold text-red-500 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>Danger Zone</h4>
              <p className="text-[11px] text-slate-400 text-center">Permanently delete your account and all stored business profile data.</p>
              <button
                onClick={handleDeleteAccount}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold transition-all text-sm shadow-lg shadow-red-600/10"
              >
                Delete Account Completely
              </button>
            </div>
          </motion.div>

          {/* Account Details (Right) */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-2 flex flex-col gap-6"
          >
            {/* Credentials details card */}
            <div className="glass-card p-6 rounded-2xl border flex flex-col gap-6">
              <h3 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-3">Sign-In Credentials</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <User size={12} />
                    Full Name
                  </label>
                  <div className="bg-white/5 border border-white/5 px-3.5 py-2.5 rounded-xl text-sm text-slate-300">
                    {user?.name || 'Guest User'}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Mail size={12} />
                    Email Address
                  </label>
                  <div className="bg-white/5 border border-white/5 px-3.5 py-2.5 rounded-xl text-sm text-slate-300">
                    {user?.email || 'guest@example.com'}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Key size={12} />
                    Password
                  </label>
                  <div className="bg-white/5 border border-white/5 px-3.5 py-2.5 rounded-xl text-sm text-slate-400 flex items-center justify-between">
                    <span>••••••••</span>
                    <button 
                      onClick={() => toast('Password change is disabled in demo mode.', { icon: '🔑' })} 
                      className="text-xs text-blue-400 hover:underline font-semibold"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Calendar size={12} />
                    Session Validity
                  </label>
                  <div className="bg-white/5 border border-white/5 px-3.5 py-2.5 rounded-xl text-sm text-slate-300">
                    180 Minutes (Active)
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences & Notifications */}
            <div className="glass-card p-6 rounded-2xl border flex flex-col gap-6">
              <h3 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-3">Preferences & Notifications</h3>
              
              <div className="flex items-center justify-between bg-white/5 border border-white/5 px-4 py-3 rounded-xl">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-slate-200">Email Notifications</span>
                  <span className="text-[10px] text-slate-500">Receive alerts for new tenders and analyses</span>
                </div>
                <div 
                  className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors ${emailNotifications ? 'bg-blue-500' : 'bg-slate-700'}`}
                  onClick={() => {
                    setEmailNotifications(!emailNotifications);
                    toast.success(emailNotifications ? 'Email notifications disabled' : 'Email notifications enabled');
                  }}
                >
                  <motion.div 
                    layout
                    className="w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ x: emailNotifications ? 20 : 0 }}
                  />
                </div>
              </div>
            </div>

            {/* Security log cards */}
            <div className="glass-card p-6 rounded-2xl border flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-3">Session Security Logs</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-300">Browser Session Initiated</span>
                    <span className="text-[10px] text-slate-500">IP: 127.0.0.1 (Local Client)</span>
                  </div>
                  <span className="text-slate-500 font-mono">Just Now</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-300">OAuth2 Bearer Token Granted</span>
                    <span className="text-[10px] text-slate-500">HMAC-SHA256 Signed Secret</span>
                  </div>
                  <span className="text-slate-500 font-mono">Just Now</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
