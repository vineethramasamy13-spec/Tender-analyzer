'use client';

import { motion } from 'framer-motion';
import { AgentProgressTracker } from '../AgentProgressTracker';

interface AgentStep {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  duration?: string;
  icon: string;
}

interface ProgressPanelProps {
  steps: AgentStep[];
  agentLogs: string[];
  currentStep: number;
  overallProgress: number;
}

export function AnalysisProgressPanel({ steps, agentLogs, currentStep, overallProgress }: ProgressPanelProps) {
  return (
    <div className="w-full glass-card p-6 rounded-2xl border" style={{ background: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
      <h3 className="text-lg font-bold mb-6 gradient-text text-white">Deploying AI Agent Pipeline</h3>
      
      <AgentProgressTracker 
        agents={steps} 
        currentStep={currentStep} 
        overallProgress={overallProgress} 
      />
      
      {/* Real-time Agent Log Viewer */}
      <div className="mt-8 border-t pt-4" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
        <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>
          Live Pipeline Agent Logs
        </h4>
        <div className="max-h-48 overflow-y-auto rounded-lg p-3 font-mono text-[10px] leading-relaxed flex flex-col gap-1.5" style={{ background: 'rgba(0, 0, 0, 0.2)', color: '#10B981' }}>
          {agentLogs.length === 0 ? (
            <p className="text-gray-500 italic">Initializing agent pipeline logs...</p>
          ) : (
            agentLogs.map((log, i) => (
              <motion.p 
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="py-0.5 border-b border-white/5 border-dashed"
              >
                {log}
              </motion.p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
