'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Zap, Search, FileText, CheckCircle, TrendingUp, Award,
  FileDown, ArrowRight, Bot, Target, Brain, Shield, BarChart3,
  Users, Cpu, Star,
} from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Smart Tender Discovery',
    description: 'Monitor GeM, CPPP, eProcure portals 24/7. Get instant alerts for matching tenders.',
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F630, #3B82F610)',
    span: 'col-span-1 md:col-span-2',
  },
  {
    icon: Brain,
    title: 'AI Document Analysis',
    description: '6 specialized AI agents extract, classify, and analyze every tender clause with 99% accuracy.',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF630, #8B5CF610)',
    span: 'col-span-1',
  },
  {
    icon: CheckCircle,
    title: 'Eligibility Analysis',
    description: 'Automated scoring against 20+ eligibility criteria. Know your chances before investing time.',
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B98130, #10B98110)',
    span: 'col-span-1',
  },
  {
    icon: TrendingUp,
    title: 'Bid Success Prediction',
    description: 'ML-powered win probability prediction with 81% accuracy based on historical data.',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B30, #F59E0B10)',
    span: 'col-span-1 md:col-span-2',
  },
  {
    icon: Award,
    title: 'Scheme Matching',
    description: 'Automatically match 50+ government schemes: Startup India, MSME, MeitY grants to reduce costs.',
    color: '#EC4899',
    gradient: 'linear-gradient(135deg, #EC489930, #EC489910)',
    span: 'col-span-1 md:col-span-2',
  },
  {
    icon: FileDown,
    title: 'PDF Report Generation',
    description: 'Professional, investor-ready PDF analysis report with all insights, charts, and proposals.',
    color: '#06B6D4',
    gradient: 'linear-gradient(135deg, #06B6D430, #06B6D410)',
    span: 'col-span-1',
  },
];

const agents = [
  { id: 1, name: 'Extraction & Classification', icon: FileText, color: '#3B82F6' },
  { id: 2, name: 'Eligibility Matcher', icon: CheckCircle, color: '#8B5CF6' },
  { id: 3, name: 'Compliance & Gap Auditor', icon: Shield, color: '#10B981' },
  { id: 4, name: 'Financial & Risk Assessor', icon: BarChart3, color: '#06B6D4' },
  { id: 5, name: 'Success & Competitor Intel', icon: Users, color: '#F59E0B' },
  { id: 6, name: 'Proposal & Report Builder', icon: FileDown, color: '#EC4899' },
];

const steps = [
  {
    step: '01',
    title: 'Upload Tender PDF',
    description: 'Drop your tender document or paste the portal URL. Our system handles any format.',
    icon: FileText,
    color: '#3B82F6',
  },
  {
    step: '02',
    title: 'AI Agents Analyze',
    description: '6 specialized agents work in parallel, analyzing eligibility, costs, risks, and opportunities.',
    icon: Bot,
    color: '#8B5CF6',
  },
  {
    step: '03',
    title: 'Download Your Report',
    description: 'Get a comprehensive PDF report with scores, gaps, scheme matches, and a winning proposal draft.',
    icon: FileDown,
    color: '#10B981',
  },
];

// Floating dot generator
const floatingDots = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  size: Math.random() * 3 + 1,
  left: `${Math.random() * 100}%`,
  animationDelay: `${Math.random() * 8}s`,
  animationDuration: `${Math.random() * 6 + 6}s`,
}));

export default function LandingPage() {
  const router = useRouter();
  const [showHomepage, setShowHomepage] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isHomepage = params.get('homepage') === 'true';
      if (isHomepage) {
        setShowHomepage(true);
      } else {
        setShowHomepage(false);
        router.replace('/auth');
      }
    }
  }, [router]);

  if (showHomepage !== true) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0A0F1E', minHeight: '100vh', paddingTop: 64 }}>
      {/* ===================== HERO ===================== */}
      <section className="hero-bg relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Floating Dots */}
        <div className="floating-dots">
          {floatingDots.map((dot) => (
            <div
              key={dot.id}
              className="floating-dot"
              style={{
                width: dot.size,
                height: dot.size,
                left: dot.left,
                animationDuration: dot.animationDuration,
                animationDelay: dot.animationDelay,
              }}
            />
          ))}
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10 py-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
            style={{
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#60A5FA',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <Bot size={16} />
            Powered by Groq Llama 3.3 + Gemini 2.5 Flash
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: '#10B981' }}
            />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight"
            style={{ fontFamily: 'Inter, sans-serif', color: '#F1F5F9' }}
          >
            AI-Powered{' '}
            <span 
              className="gradient-text animate-gradient" 
              style={{ 
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6, #10B981)', 
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Tender Intelligence
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}
          >
            Discover, analyze, and win government tenders with{' '}
            <strong style={{ color: '#F1F5F9' }}>6 specialized AI agents</strong> working in parallel.
            Stop guessing — start winning.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link
              href="/analyze"
              className="flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-lg text-white transition-all btn-glow"
              style={{
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                fontFamily: 'Inter, sans-serif',
                minWidth: 200,
                justifyContent: 'center',
              }}
            >
              <Zap size={20} />
              Start Analyzing
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all"
              style={{
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#F1F5F9',
                background: 'rgba(255,255,255,0.04)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              View Demo
            </Link>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="inline-flex flex-col sm:flex-row items-center gap-6 sm:gap-12 px-8 py-4 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {[
              { value: '500+', label: 'Tenders Analyzed' },
              { value: '92%', label: 'Avg Eligibility Found' },
              { value: '₹1200Cr+', label: 'Opportunities Discovered' },
              { value: '6', label: 'AI Agents' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="text-2xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6, #10B981)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {stat.value}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===================== FEATURES BENTO ===================== */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span
            className="text-sm font-semibold px-3 py-1 rounded-full mb-4 inline-block"
            style={{ background: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.25)' }}
          >
            PLATFORM FEATURES
          </span>
          <h2
            className="text-4xl sm:text-5xl font-black mb-4"
            style={{ fontFamily: 'Inter, sans-serif', color: '#F1F5F9' }}
          >
            Everything You Need to{' '}
            <span className="gradient-text">Win Tenders</span>
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: '#94A3B8' }}>
            From discovery to submission — our AI handles the entire tender lifecycle
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {features.map((feature, idx) => {
            const { icon: Icon } = feature;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                whileHover={{ y: -6 }}
                className={`glass-card p-6 flex flex-col gap-4 group ${feature.span}`}
              >
                <div
                  className="feature-icon-wrap"
                  style={{ background: feature.gradient, border: `1px solid ${feature.color}25` }}
                >
                  <Icon size={22} style={{ color: feature.color }} />
                </div>
                <div>
                  <h3
                    className="font-bold text-lg mb-2"
                    style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
                    {feature.description}
                  </p>
                </div>
                <div className="mt-auto">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: feature.color, opacity: 0, transition: 'opacity 0.2s' }}
                  >
                    Learn more →
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ===================== 13 AGENTS ===================== */}
      <section
        className="py-24 px-4 sm:px-6"
        style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span
              className="text-sm font-semibold px-3 py-1 rounded-full mb-4 inline-block"
              style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              THE AGENT PIPELINE
            </span>
            <h2
              className="text-4xl sm:text-5xl font-black mb-4"
              style={{ fontFamily: 'Inter, sans-serif', color: '#F1F5F9' }}
            >
              6 Specialized AI Agents,{' '}
              <span className="gradient-text">One Mission</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#94A3B8' }}>
              Each agent is purpose-built with deep domain expertise in government procurement
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {agents.map((agent, idx) => {
              const { icon: Icon } = agent;
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  className="glass-card p-4 flex flex-col items-center gap-3 text-center"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: `${agent.color}18`,
                      border: `1px solid ${agent.color}30`,
                    }}
                  >
                    <Icon size={18} style={{ color: agent.color }} />
                  </div>
                  <div>
                    <div
                      className="text-xs font-bold mb-0.5"
                      style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}
                    >
                      #{agent.id < 10 ? `0${agent.id}` : agent.id}
                    </div>
                    <div className="text-xs" style={{ color: '#94A3B8' }}>
                      {agent.name}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span
            className="text-sm font-semibold px-3 py-1 rounded-full mb-4 inline-block"
            style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            HOW IT WORKS
          </span>
          <h2
            className="text-4xl sm:text-5xl font-black"
            style={{ fontFamily: 'Inter, sans-serif', color: '#F1F5F9' }}
          >
            3 Steps to a Winning Bid
          </h2>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-0 items-stretch">
          {steps.map((step, idx) => {
            const { icon: Icon } = step;
            return (
              <div key={step.step} className="flex flex-col md:flex-row items-stretch flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  className="glass-card p-7 flex flex-col items-center text-center gap-4 flex-1"
                >
                  <div
                    className="text-5xl font-black"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      background: `linear-gradient(135deg, ${step.color}, transparent)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      opacity: 0.3,
                    }}
                  >
                    {step.step}
                  </div>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: `${step.color}18`, border: `1px solid ${step.color}30` }}
                  >
                    <Icon size={26} style={{ color: step.color }} />
                  </div>
                  <div>
                    <h3
                      className="font-bold text-lg mb-2"
                      style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
                      {step.description}
                    </p>
                  </div>
                </motion.div>
                {idx < steps.length - 1 && (
                  <div className="flex items-center justify-center py-4 md:px-4">
                    <ArrowRight size={20} style={{ color: '#3B82F6', opacity: 0.5 }} className="md:rotate-0 rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================== CTA SECTION ===================== */}
      <section className="py-24 px-4 sm:px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card p-10 sm:p-16 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))',
            border: '1px solid rgba(59,130,246,0.2)',
          }}
        >
          {/* Glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl opacity-30 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
          />

          <Zap size={36} className="mx-auto mb-5" style={{ color: '#3B82F6' }} />
          <h2
            className="text-3xl sm:text-5xl font-black mb-4"
            style={{ fontFamily: 'Inter, sans-serif', color: '#F1F5F9' }}
          >
            Ready to Win Your Next Tender?
          </h2>
          <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: '#94A3B8' }}>
            Join hundreds of companies using TenderAI to discover opportunities and win more bids.
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2.5 px-10 py-4 rounded-xl font-bold text-lg text-white btn-glow"
            style={{
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <Zap size={20} />
            Analyze a Tender Now
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 text-center border-t"
        style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#64748B' }}
      >
        <p className="text-sm">
          © 2026 TenderAI • Built with ❤️ for Indian MSMEs & Startups •{' '}
          <span style={{ color: '#3B82F6' }}>Powered by Groq + Gemini</span>
        </p>
      </footer>
    </div>
  );
}
