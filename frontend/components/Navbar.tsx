'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  FileText,
  MessageSquare,
  Award,
  Zap,
  Menu,
  X,
  ChevronRight,
  History,
  BarChart3,
  User,
  Key,
  Sun,
  Moon,
} from 'lucide-react';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analyze', label: 'Analyze', icon: FileText },
  { href: '/tenders', label: 'Tenders', icon: Search },
  { href: '/schemes', label: 'Schemes', icon: Award },
  { href: '/chat', label: 'AI Chat', icon: MessageSquare },
  { href: '/history', label: 'History', icon: History },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/keys', label: 'API Keys', icon: Key },
  { href: '/account', label: 'Account', icon: User },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Theme initialization
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.className = savedTheme;
      } else {
        document.documentElement.className = 'dark';
      }
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.className = nextTheme;
  };

  if (!mounted || pathname === '/auth' || pathname === '/profile' || pathname === '/keys') {
    return null;
  }

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: 'var(--navbar-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled
            ? '1px solid var(--border-color)'
            : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
              >
                <Zap size={16} className="text-white" />
              </div>
              <span
                className="text-xl font-bold"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  background: 'linear-gradient(135deg, #F1F5F9, #94A3B8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                TenderAI
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative group"
                    style={{
                      color: isActive ? 'var(--navbar-active-color)' : 'var(--navbar-inactive-color)',
                      background: isActive ? 'var(--navbar-active-bg)' : 'transparent',
                    }}
                  >
                    <Icon size={15} />
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ background: '#3B82F6' }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* CTA Button */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl border transition-all hover:bg-white/[0.05]"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <Link
                href="/analyze"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 btn-glow"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                  color: 'white',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <Zap size={14} />
                New Analysis
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: '#94A3B8' }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 md:hidden flex flex-col"
              style={{
                background: 'var(--bg-secondary)',
                backdropFilter: 'blur(20px)',
                borderLeft: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
                    <Zap size={16} className="text-white" />
                  </div>
                  <span className="font-bold text-lg" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--text-primary)' }}>TenderAI</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleTheme}
                    className="p-1.5 rounded-lg border transition-all"
                    style={{
                      background: 'var(--card-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  >
                    {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                  </button>
                  <button onClick={() => setMobileOpen(false)} style={{ color: '#64748B' }}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all"
                      style={{
                        color: isActive ? 'var(--navbar-active-color)' : 'var(--navbar-inactive-color)',
                        background: isActive ? 'var(--navbar-active-bg)' : 'transparent',
                        border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        {link.label}
                      </div>
                      <ChevronRight size={14} style={{ color: '#64748B' }} />
                    </Link>
                  );
                })}
              </div>

              <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <Link
                  href="/analyze"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
                >
                  <Zap size={16} />
                  Start New Analysis
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
