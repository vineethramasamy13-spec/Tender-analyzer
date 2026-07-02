'use client';

import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import type { AgentStep } from '@/lib/mockData';

interface AgentProgressTrackerProps {
  agents: AgentStep[];
  currentStep: number;
  overallProgress: number;
}

const statusConfig = {
  pending: { color: '#64748B', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)', label: 'Pending' },
  running: { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', label: 'Running' },
  completed: { color: '#10B981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', label: 'Done' },
  error: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', label: 'Error' },
};

function StatusIcon({ status, size = 16 }: { status: AgentStep['status']; size?: number }) {
  if (status === 'completed') return <CheckCircle size={size} style={{ color: '#10B981' }} />;
  if (status === 'error') return <AlertCircle size={size} style={{ color: '#EF4444' }} />;
  if (status === 'running') return <Loader2 size={size} style={{ color: '#3B82F6' }} className="animate-spin" />;
  return <Clock size={size} style={{ color: '#64748B' }} />;
}

export function AgentProgressTracker({ agents, currentStep, overallProgress }: AgentProgressTrackerProps) {
  return (
    <div className="w-full">
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
            Analysis Progress
          </span>
          <span className="text-sm font-bold" style={{ color: '#3B82F6' }}>
            {Math.round(overallProgress)}%
          </span>
        </div>
        <div className="progress-bar-container">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs" style={{ color: '#64748B' }}>
            {agents.filter((a) => a.status === 'completed').length} of {agents.length} agents completed
          </span>
          {currentStep < agents.length && (
            <span className="text-xs" style={{ color: '#3B82F6' }}>
              Est. {(agents.length - currentStep) * 2}s remaining
            </span>
          )}
        </div>
      </div>

      {/* Agent Steps */}
      <div className="flex flex-col gap-0">
        {agents.map((agent, idx) => {
          const config = statusConfig[agent.status];
          const isLast = idx === agents.length - 1;

          return (
            <div key={agent.id} className="flex gap-4">
              {/* Left: Icon + Connector */}
              <div className="flex flex-col items-center">
                <motion.div
                  className="agent-step-icon"
                  style={{
                    background: config.bg,
                    border: `2px solid ${config.border}`,
                    color: config.color,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                  }}
                  animate={
                    agent.status === 'running'
                      ? {
                          boxShadow: [
                            '0 0 0 0 rgba(59,130,246,0.5)',
                            '0 0 0 8px rgba(59,130,246,0)',
                          ],
                        }
                      : {}
                  }
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="text-xs font-bold">{agent.id}</span>
                </motion.div>
                {!isLast && (
                  <motion.div
                    style={{
                      width: 2,
                      flexGrow: 1,
                      minHeight: 24,
                      background:
                        agent.status === 'completed'
                          ? 'linear-gradient(180deg, #10B981, rgba(16,185,129,0.3))'
                          : 'rgba(255,255,255,0.06)',
                      margin: '4px 0',
                      borderRadius: 2,
                    }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  />
                )}
              </div>

              {/* Right: Content */}
              <motion.div
                className="flex-1 pb-5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
              >
                <div className="flex items-start justify-between gap-2 pt-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color: agent.status === 'pending' ? '#64748B' : '#F1F5F9',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {agent.name}
                      </span>
                      <StatusIcon status={agent.status} size={14} />
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                      {agent.description}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: config.bg,
                        color: config.color,
                        border: `1px solid ${config.border}`,
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {config.label}
                    </span>
                    {agent.duration && (
                      <span className="text-xs" style={{ color: '#64748B' }}>
                        {agent.duration}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
