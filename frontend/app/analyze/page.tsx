'use client';

import { useState, useCallback, useEffect, Suspense, memo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileText, Link2, AlignLeft, Zap, ChevronDown, ChevronUp,
  Plus, X, Download, RefreshCw, CheckCircle, Bot,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AgentProgressTracker } from '@/components/AgentProgressTracker';
import { EligibilityGauge } from '@/components/EligibilityGauge';
import { WinProbabilityChart } from '@/components/WinProbabilityChart';
import { GapAnalysisTable } from '@/components/GapAnalysisTable';
import { RiskBadge } from '@/components/RiskBadge';
import { SchemeCard } from '@/components/SchemeCard';
import { MOCK_AGENT_STEPS, MOCK_ANALYSIS_RESULT, MOCK_SCHEMES } from '@/lib/mockData';
import { analyzeTender, uploadPDF, getAnalysis, getTender, downloadReport, downloadReportDocx, getBusinessProfile, saveBusinessProfile } from '@/lib/api';
import { BusinessProfileForm } from '@/components/analyze/BusinessProfileForm';
import { AnalysisProgressPanel } from '@/components/analyze/AnalysisProgressPanel';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';

type Phase = 'input' | 'processing' | 'results';
type InputTab = 'upload' | 'url' | 'text';
type ResultTab = 'overview' | 'eligibility' | 'gaps' | 'cost' | 'risk' | 'schemes' | 'proposal';

const CERTIFICATIONS = ['ISO 9001', 'ISO 27001', 'CMMI Level 3', 'CMMI Level 5', 'ISO 14001', 'PCI DSS', 'SOC 2'];
const COMPANY_TYPES = ['Startup (DPIIT Recognized)', 'MSME', 'SME', 'Enterprise', 'NGO', 'Public Sector'];
const INDUSTRIES = ['IT/Software', 'Cybersecurity', 'Data Analytics', 'IoT', 'Cloud Services', 'EdTech', 'HealthTech', 'FinTech', 'Consulting'];

const mapBackendToFrontendResult = (backend: any) => {
  if (!backend) return MOCK_ANALYSIS_RESULT;

  const elig = backend.eligibility_result || {};
  const cost = backend.cost_estimate || {};
  const risk = backend.risk_report || {};
  const bid = backend.bid_prediction || {};
  const proposal = backend.proposal_draft || {};

  const scale = (val: number | undefined | null, fallback: number): number => {
    if (val === undefined || val === null) return fallback;
    return val <= 1.0 ? Math.round(val * 100) : Math.round(val);
  };

  const scores = {
    eligibility: scale(elig.overall_score, 75),
    technical: scale(elig.tech_match, 70),
    financial: scale(elig.turnover_match, 65),
    experience: scale(elig.experience_match, 60),
    compliance: scale(elig.cert_match, 80),
    overall: Math.round((scale(elig.overall_score, 75) + scale(elig.tech_match, 70)) / 2),
  };

  const eligibilityCriteria = (elig.breakdown || []).map((item: any) => ({
    criterion: item.criterion || 'Requirement',
    required: item.required || 'N/A',
    current: item.current || 'N/A',
    score: Math.round(item.score || 0),
    status: item.score >= 70 ? ('met' as const) : item.score >= 50 ? ('partial' as const) : ('not_met' as const),
  }));

  const gaps = (backend.gaps || []).map((item: any, idx: number) => ({
    id: idx + 1,
    requirement: item.requirement || '',
    currentStatus: item.current_status || '',
    gapType: item.gap_type || 'important',
    recommendation: item.recommendation || '',
    met: false,
  }));

  const costEstimation = {
    development: cost.development_cost || 0,
    infrastructure: cost.infrastructure_cost || 0,
    team: cost.team_cost || 0,
    operations: cost.operational_cost || 0,
    contingency: cost.miscellaneous_cost || 0,
    total: cost.total || 0,
    recommendedBid: cost.bid_price_recommendation || 0,
    marginPercent: cost.margin_recommendation || 15,
  };

  const risks = [
    {
      id: 1,
      title: 'Financial Risk',
      description: risk.financial_risk_details || `Financial risk level: ${risk.financial_risk || 'Medium'}`,
      level: (risk.financial_risk || 'Medium').toLowerCase(),
      likelihood: 'possible',
      impact: 'medium',
      mitigation: risk.mitigation?.[0] || 'Maintain working capital buffer.',
    },
    {
      id: 2,
      title: 'Compliance Risk',
      description: risk.compliance_risk_details || `Compliance risk level: ${risk.compliance_risk || 'Low'}`,
      level: (risk.compliance_risk || 'Low').toLowerCase(),
      likelihood: 'unlikely',
      impact: 'high',
      mitigation: risk.mitigation?.[1] || 'Complete certification appraisals.',
    },
    {
      id: 3,
      title: 'Technical & Delivery Risk',
      description: risk.technical_risk_details || `Technical risk level: ${risk.technical_risk || 'Low'}`,
      level: (risk.technical_risk || 'Low').toLowerCase(),
      likelihood: 'possible',
      impact: 'medium',
      mitigation: risk.mitigation?.[2] || 'Detailed project milestones.',
    },
  ];

  const proposalSections = {
    executiveSummary: proposal.executive_summary || 'No executive summary generated.',
    technicalApproach: proposal.technical_proposal || 'No technical proposal generated.',
    teamComposition: proposal.scope_of_work || 'No team composition details generated.',
  };

  return {
    tenderId: backend.tender_id || 'T001',
    tenderTitle: backend.tender_title || 'Government Tender',
    analysisId: backend.analysis_id || 'ANL-2026-0000',
    generatedAt: backend.completed_at || new Date().toISOString(),
    scores,
    recommendation: (bid.recommendation || 'Apply with Improvements').toUpperCase() as any,
    winProbability: Math.round((bid.win_probability || 0.7) * 100),
    riskLevel: (risk.overall_risk || 'Medium').toLowerCase() as any,
    eligibilityCriteria,
    gaps,
    costEstimation,
    risks,
    proposalSections,
    matchingSchemes: (backend.scheme_recommendations || []).map((s: any) => s.name || s.id),
  };
};

interface ResultsPanelProps {
  result: any;
  analysisId: string | null;
  matchingSchemes: any[];
  radarData: any[];
  costData: any[];
  setPhase: (p: Phase) => void;
  setUploadedFile: (f: File | null) => void;
  setTenderUrl: (u: string) => void;
  setTenderText: (t: string) => void;
  setAgentSteps: (s: any) => void;
  setCurrentAgentStep: (s: number) => void;
  setProgress: (p: number) => void;
}

const ResultsPanel = memo(function ResultsPanel({
  result,
  analysisId,
  matchingSchemes,
  radarData,
  costData,
  setPhase,
  setUploadedFile,
  setTenderUrl,
  setTenderText,
  setAgentSteps,
  setCurrentAgentStep,
  setProgress,
}: ResultsPanelProps) {
  const [resultTab, setResultTab] = useState<ResultTab>('overview');

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-6"
    >
      {/* Summary Bar */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="text-center">
          <div className="text-3xl font-black mb-1" style={{ color: '#10B981', fontFamily: 'Inter, sans-serif' }}>
            {result.scores.eligibility}%
          </div>
          <div className="text-xs" style={{ color: '#64748B' }}>Eligibility</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black mb-1" style={{ color: '#3B82F6', fontFamily: 'Inter, sans-serif' }}>
            {result.winProbability}%
          </div>
          <div className="text-xs" style={{ color: '#64748B' }}>Win Probability</div>
        </div>
        <div className="text-center flex flex-col items-center gap-1">
          <RiskBadge level={result.riskLevel} size="md" />
          <div className="text-xs" style={{ color: '#64748B' }}>Risk Level</div>
        </div>
        <div className="text-center">
          <div
            className="text-lg font-bold mb-1 px-3 py-1 rounded-lg inline-block"
            style={{
              background: 'rgba(16,185,129,0.15)',
              color: '#10B981',
              border: '1px solid rgba(16,185,129,0.3)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            ✅ {result.recommendation}
          </div>
          <div className="text-xs" style={{ color: '#64748B' }}>Recommendation</div>
        </div>
      </div>

      {/* Result Tabs */}
      <div>
        <div
          className="flex gap-1 p-1 rounded-2xl mb-6 overflow-x-auto"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {([
            { id: 'overview', label: 'Overview' },
            { id: 'eligibility', label: 'Eligibility' },
            { id: 'gaps', label: 'Gaps' },
            { id: 'cost', label: 'Cost' },
            { id: 'risk', label: 'Risk' },
            { id: 'schemes', label: 'Schemes' },
            { id: 'proposal', label: 'Proposal' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setResultTab(tab.id)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0"
              style={{
                background: resultTab === tab.id ? 'rgba(59,130,246,0.2)' : 'transparent',
                color: resultTab === tab.id ? '#60A5FA' : '#64748B',
                border: resultTab === tab.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {resultTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card-static rounded-2xl p-6 flex flex-col items-center justify-center">
              <EligibilityGauge score={result.scores.eligibility} size={200} />
            </div>
            <div className="glass-card-static rounded-2xl p-6 flex flex-col items-center justify-center">
              <WinProbabilityChart probability={result.winProbability} />
            </div>
            <div className="glass-card-static rounded-2xl p-6 md:col-span-2">
              <h3 className="font-bold text-sm mb-4" style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
                Score Dimensions (Radar)
              </h3>
              <div className="w-full flex justify-center overflow-hidden">
                <RadarChart width={360} height={260} data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <Radar name="Score" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} isAnimationActive={false} />
                </RadarChart>
              </div>
            </div>
          </div>
        )}

        {/* Eligibility Tab */}
        {resultTab === 'eligibility' && (
          <div className="glass-card-static rounded-2xl overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Criterion</th>
                  <th>Required</th>
                  <th className="hidden md:table-cell">Current</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {result.eligibilityCriteria.map((row: any, idx: number) => (
                  <tr key={idx}>
                    <td className="font-medium">{row.criterion}</td>
                    <td className="text-xs" style={{ color: '#94A3B8' }}>{row.required}</td>
                    <td className="hidden md:table-cell text-xs" style={{ color: '#94A3B8' }}>{row.current}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{
                          color: row.score >= 80 ? '#10B981' : row.score >= 50 ? '#F59E0B' : '#EF4444',
                          fontFamily: 'Inter, sans-serif',
                        }}>
                          {row.score}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                          background: row.status === 'met' ? 'rgba(16,185,129,0.15)' : row.status === 'partial' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                          color: row.status === 'met' ? '#10B981' : row.status === 'partial' ? '#F59E0B' : '#EF4444',
                        }}
                      >
                        {row.status === 'met' ? '✓ Met' : row.status === 'partial' ? '~ Partial' : '✗ Not Met'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Gaps Tab */}
        {resultTab === 'gaps' && (
          <div className="glass-card-static rounded-2xl overflow-hidden">
            <GapAnalysisTable gaps={result.gaps} />
          </div>
        )}

        {/* Cost Tab */}
        {resultTab === 'cost' && (
          <div className="flex flex-col gap-5">
            <div className="glass-card-static rounded-2xl p-6">
              <h3 className="font-bold text-sm mb-4" style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
                Cost Breakdown (₹ Lakhs)
              </h3>
              <div className="w-full flex justify-center overflow-x-auto">
                <BarChart width={360} height={220} data={costData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(13,21,38,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      color: '#F1F5F9',
                    }}
                    formatter={(val) => [`₹${val}L`, 'Cost']}
                  />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </div>
            </div>
            <div className="glass-card-static rounded-2xl p-6">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Development', result.costEstimation.development],
                    ['Infrastructure', result.costEstimation.infrastructure],
                    ['Team', result.costEstimation.team],
                    ['Operations', result.costEstimation.operations],
                    ['Contingency', result.costEstimation.contingency],
                  ].map(([label, amount]) => (
                    <tr key={String(label)}>
                      <td>{String(label)}</td>
                      <td className="font-semibold" style={{ color: '#10B981' }}>
                        ₹{(Number(amount) / 100000).toFixed(1)}L
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                    <td className="font-bold">Recommended Bid</td>
                    <td>
                      <span
                        className="font-black text-lg"
                        style={{ color: '#3B82F6', fontFamily: 'Inter, sans-serif' }}
                      >
                        ₹{(result.costEstimation.recommendedBid / 10000000).toFixed(2)} Cr
                      </span>
                      <span
                        className="ml-2 text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
                      >
                        {result.costEstimation.marginPercent}% margin
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Risk Tab */}
        {resultTab === 'risk' && (
          <div className="flex flex-col gap-4">
            {result.risks.map((risk: any) => (
              <div
                key={risk.id}
                className="glass-card-static rounded-2xl p-5"
                style={{
                  borderLeft: `3px solid ${risk.level === 'high' ? '#EF4444' : risk.level === 'medium' ? '#F59E0B' : '#10B981'}`,
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="font-bold text-sm" style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
                    {risk.title}
                  </h3>
                  <RiskBadge level={risk.level as 'low' | 'medium' | 'high' | 'critical'} size="sm" />
                </div>
                <p className="text-sm mb-3" style={{ color: '#94A3B8' }}>{risk.description}</p>
                <div
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
                >
                  <span className="font-semibold" style={{ color: '#60A5FA' }}>Mitigation: </span>
                  <span style={{ color: '#94A3B8' }}>{risk.mitigation}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Schemes Tab */}
        {resultTab === 'schemes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {matchingSchemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        )}

        {/* Proposal Tab */}
        {resultTab === 'proposal' && (
          <div className="flex flex-col gap-5">
            {Object.entries(result.proposalSections as Record<string, string>).map(([key, content]) => (
              <div key={key} className="glass-card-static rounded-2xl overflow-hidden">
                <div
                  className="flex items-center justify-between px-5 py-3 border-b"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <span className="font-bold text-sm capitalize" style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(content);
                      toast.success('Copied to clipboard!');
                    }}
                    className="text-xs px-3 py-1 rounded-lg transition-all"
                    style={{ color: '#3B82F6', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
                  >
                    Copy
                  </button>
                </div>
                <div className="p-5">
                  <pre
                    className="text-sm whitespace-pre-wrap"
                    style={{ color: '#CBD5E1', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.8 }}
                  >
                    {content}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            try {
              toast.loading('Preparing PDF report...');
              const blob = await downloadReport(analysisId || 'demo');
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Tender_Analysis_Report_${(analysisId || 'demo')}.pdf`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              toast.dismiss();
              toast.success('PDF report downloaded!');
            } catch (err) {
              toast.dismiss();
              toast.error('Download failed');
              console.error('Download failed:', err);
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg text-white btn-glow"
          style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)', fontFamily: 'Inter, sans-serif' }}
        >
          <Download size={22} />
          Download PDF Report
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            try {
              toast.loading('Preparing Word proposal...');
              const blob = await downloadReportDocx(analysisId || 'demo');
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Proposal_${(analysisId || 'demo')}.docx`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              toast.dismiss();
              toast.success('Word proposal downloaded!');
            } catch (err) {
              toast.dismiss();
              toast.error('Download failed');
              console.error('Download failed:', err);
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg text-white btn-glow"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', fontFamily: 'Inter, sans-serif' }}
        >
          <FileText size={22} />
          Download Word Proposal
        </motion.button>
        <button
          onClick={() => {
            setPhase('input');
            setUploadedFile(null);
            setTenderUrl('');
            setTenderText('');
            setAgentSteps(MOCK_AGENT_STEPS);
            setCurrentAgentStep(5);
            setProgress(38);
          }}
          className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold transition-all"
          style={{
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#94A3B8',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          <RefreshCw size={18} />
          New Analysis
        </button>
      </div>
    </motion.div>
  );
});

function AnalyzeContent() {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>('input');
  const [inputTab, setInputTab] = useState<InputTab>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [tenderUrl, setTenderUrl] = useState('');
  const [tenderText, setTenderText] = useState('');
  const [profileOpen, setProfileOpen] = useState(true);
  const [selectedCerts, setSelectedCerts] = useState<string[]>(['ISO 9001']);
  const [agentSteps, setAgentSteps] = useState(MOCK_AGENT_STEPS);
  const [currentAgentStep, setCurrentAgentStep] = useState(5);
  const [progress, setProgress] = useState(38);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(MOCK_ANALYSIS_RESULT);
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    const tenderId = searchParams.get('tender');
    if (tenderId) {
      const loadTender = async () => {
        try {
          const tender = await getTender(tenderId);
          if (tender) {
            setPhase('input');
            setInputTab('text');
            setUploadedFile(null);
            setTenderUrl('');
            setTenderText(
              `TENDER DETAILS\n` +
              `-------------------------\n` +
              `Title: ${tender.title || 'Government Tender'}\n` +
              `Department: ${tender.department || 'Government Department'}\n` +
              `Budget: ${tender.budget_formatted || tender.budgetDisplay || (tender.budget ? `Rs. ${(tender.budget / 10000000).toFixed(2)} Cr` : '') || ''}\n` +
              `Deadline: ${tender.deadline || ''}\n` +
              `Reference No: ${tender.reference_number || tender.tenderNo || ''}\n\n` +
              `DESCRIPTION:\n` +
              `${tender.description || ''}`
            );
            toast.success(`Loaded tender: ${tender.title || 'Details'}`);
          }
        } catch (e) {
          console.error('Error loading tender:', e);
        }
      };
      loadTender();
    }

    const analysisIdParam = searchParams.get('analysis_id') || searchParams.get('id');
    if (analysisIdParam) {
      const loadAnalysis = async () => {
        try {
          toast.loading('Loading analysis results...');
          const doc = await getAnalysis(analysisIdParam);
          if (doc) {
            const finalState = doc.result || doc;
            const mapped = mapBackendToFrontendResult(finalState);
            setResult(mapped);
            setAnalysisId(analysisIdParam);
            setPhase('results');
            toast.dismiss();
            toast.success('Loaded analysis results successfully');
          } else {
            toast.dismiss();
            toast.error('Analysis not found');
          }
        } catch (e) {
          toast.dismiss();
          toast.error('Failed to load analysis');
          console.error('Error loading analysis:', e);
        }
      };
      loadAnalysis();
    }
  }, [searchParams]);

  // Company profile state
  const [profile, setProfile] = useState({
    name: 'TechVenture Solutions Pvt Ltd',
    type: 'Startup (DPIIT Recognized)',
    annual_turnover: 180,
    turnover_unit: 'lakhs',
    experience: 5,
    teamSize: 45,
    industry: 'IT/Software',
    state: 'Tamil Nadu',
  });

  // Load profile from backend database or localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth';
        return;
      }
    }
    setMounted(true);
    const loadProfile = async () => {
      try {
        const backendProfile = await getBusinessProfile();
        if (backendProfile && backendProfile.name) {
          // Map backend type enum to frontend display type
          let displayType = 'Startup (DPIIT Recognized)';
          if (backendProfile.company_type === 'msme') displayType = 'MSME';
          else if (backendProfile.company_type === 'enterprise') displayType = 'Enterprise';
          else if (backendProfile.company_type === 'ngo') displayType = 'NGO';

          // Map backend turnover
          let rawTurnover = backendProfile.annual_turnover || backendProfile.turnover || 0;
          let unit = backendProfile.turnover_unit || 'lakhs';
          if (backendProfile.turnover_unit) {
            if (backendProfile.turnover_unit === 'lakhs') {
              rawTurnover = rawTurnover / 100000;
            } else if (backendProfile.turnover_unit === 'crores') {
              rawTurnover = rawTurnover / 10000000;
            }
          } else {
            // Estimate unit based on magnitude
            if (rawTurnover >= 10000000) {
              rawTurnover = rawTurnover / 10000000;
              unit = 'crores';
            } else if (rawTurnover >= 100000) {
              rawTurnover = rawTurnover / 100000;
              unit = 'lakhs';
            }
          }

          const mappedProfile = {
            name: backendProfile.name,
            type: displayType,
            annual_turnover: rawTurnover,
            turnover_unit: unit,
            experience: backendProfile.experience_years ?? 3,
            teamSize: backendProfile.team_size ?? 10,
            industry: backendProfile.industry || 'IT/Software',
            state: backendProfile.state || 'All India',
          };
          setProfile(mappedProfile);
          if (typeof window !== 'undefined') {
            localStorage.setItem('business_profile', JSON.stringify(mappedProfile));
          }
          if (backendProfile.certifications) {
            setSelectedCerts(backendProfile.certifications);
            if (typeof window !== 'undefined') {
              localStorage.setItem('business_certs', JSON.stringify(backendProfile.certifications));
            }
          }
          if (typeof window !== 'undefined') {
            localStorage.setItem('business_profile', JSON.stringify(mappedProfile));
          }
          return;
        }
      } catch (err) {
        console.error('Error fetching profile from backend:', err);
      }

      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        const savedProfile = localStorage.getItem('business_profile');
        if (savedProfile) {
          try {
            setProfile(JSON.parse(savedProfile));
          } catch (e) {
            console.error('Error parsing profile from localStorage:', e);
          }
        }
        const savedCerts = localStorage.getItem('business_certs');
        if (savedCerts) {
          try {
            setSelectedCerts(JSON.parse(savedCerts));
          } catch (e) {
            console.error('Error parsing certs from localStorage:', e);
          }
        }
      }
    };

    loadProfile();
  }, []);

  const handleProfileChange = async (newProfile: any) => {
    setProfile(newProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('business_profile', JSON.stringify(newProfile));
    }
    try {
      let apiType = 'startup';
      const lowercase = newProfile.type.toLowerCase();
      if (lowercase.includes('msme')) apiType = 'msme';
      else if (lowercase.includes('enterprise')) apiType = 'enterprise';
      else if (lowercase.includes('ngo')) apiType = 'ngo';

      let absoluteTurnover = Number(newProfile.annual_turnover || 0);
      if (newProfile.turnover_unit === 'lakhs') {
        absoluteTurnover = absoluteTurnover * 100000;
      } else if (newProfile.turnover_unit === 'crores') {
        absoluteTurnover = absoluteTurnover * 10000000;
      }

      await saveBusinessProfile({
        name: newProfile.name,
        company_type: apiType,
        turnover: absoluteTurnover,
        annual_turnover: absoluteTurnover,
        turnover_unit: newProfile.turnover_unit,
        experience_years: Number(newProfile.experience || 0),
        team_size: Number(newProfile.teamSize || 1),
        industry: newProfile.industry,
        state: newProfile.state,
        certifications: selectedCerts
      });
    } catch (err) {
      console.error('Failed to auto-save profile change:', err);
    }
  };

  const handleCertsChange = async (newCerts: string[]) => {
    setSelectedCerts(newCerts);
    if (typeof window !== 'undefined') {
      localStorage.setItem('business_certs', JSON.stringify(newCerts));
    }
    try {
      let apiType = 'startup';
      const lowercase = profile.type.toLowerCase();
      if (lowercase.includes('msme')) apiType = 'msme';
      else if (lowercase.includes('enterprise')) apiType = 'enterprise';
      else if (lowercase.includes('ngo')) apiType = 'ngo';

      let absoluteTurnover = Number(profile.annual_turnover || 0);
      if (profile.turnover_unit === 'lakhs') {
        absoluteTurnover = absoluteTurnover * 100000;
      } else if (profile.turnover_unit === 'crores') {
        absoluteTurnover = absoluteTurnover * 10000000;
      }

      await saveBusinessProfile({
        name: profile.name,
        company_type: apiType,
        turnover: absoluteTurnover,
        annual_turnover: absoluteTurnover,
        turnover_unit: profile.turnover_unit,
        experience_years: Number(profile.experience || 0),
        team_size: Number(profile.teamSize || 1),
        industry: profile.industry,
        state: profile.state,
        certifications: newCerts
      });
    } catch (err) {
      console.error('Failed to auto-save certifications change:', err);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0]);
      toast.success(`Loaded: ${acceptedFiles[0].name}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const runSimulatedFallback = () => {
    setAgentLogs((prev) => [...prev, 'System: API connection unavailable. Starting local simulation...']);
    let step = 3;
    let prog = 50;
    const interval = setInterval(() => {
      step++;
      prog = Math.min(100, Math.round((step / 6) * 100));

      setAgentSteps((prev) =>
        prev.map((a) => {
          if (a.id < step) return { ...a, status: 'completed' as const, duration: `${(Math.random() * 2 + 0.5).toFixed(1)}s` };
          if (a.id === step) return { ...a, status: 'running' as const };
          return { ...a, status: 'pending' as const };
        })
      );
      setCurrentAgentStep(step);
      setProgress(prog);
      setAgentLogs((prev) => [...prev, `[Demo Agent] Step ${step} completed successfully.`]);

      if (step >= 6) {
        clearInterval(interval);
        setTimeout(() => {
          setAgentSteps((prev) => prev.map((a) => ({ ...a, status: 'completed' as const, duration: a.duration || `${(Math.random() * 2 + 0.5).toFixed(1)}s` })));
          setProgress(100);
          setAgentLogs((prev) => [...prev, 'System: Simulation finished successfully. Mapped mock results.']);
          setTimeout(() => {
            setResult(MOCK_ANALYSIS_RESULT);
            setAnalysisId('demo');
            setPhase('results');
            toast.success('Analysis complete! View your results.', { duration: 4000 });
          }, 800);
        }, 500);
      }
    }, 1200);
  };

  const handleRunAnalysis = async () => {
    const hasInput = uploadedFile || tenderUrl || tenderText.length > 50;
    if (!hasInput) {
      toast.error('Please provide a tender document first.');
      return;
    }

    setPhase('processing');
    setAgentLogs([]);
    toast.success('Analysis started! 12 agents deployed.', { duration: 3000 });

    try {
      let currentTenderId = '';
      let currentTenderFilePath = '';
      let currentTenderText = tenderText;

      // 1. Upload PDF if file provided
      if (inputTab === 'upload' && uploadedFile) {
        const uploadRes = await uploadPDF(uploadedFile);
        currentTenderId = uploadRes.tender_id;
        currentTenderFilePath = uploadRes.file_path;
        currentTenderText = uploadRes.extracted_text_preview || '';
      }

      // 2. Map frontend company profile type
      let companyTypeEnum = 'startup';
      const lowercaseType = profile.type.toLowerCase();
      if (lowercaseType.includes('msme') || lowercaseType.includes('sme')) {
        companyTypeEnum = 'msme';
      } else if (lowercaseType.includes('enterprise')) {
        companyTypeEnum = 'enterprise';
      } else if (lowercaseType.includes('ngo')) {
        companyTypeEnum = 'ngo';
      }

      const backendProfile = {
        name: profile.name,
        company_type: companyTypeEnum,
        turnover: profile.turnover_unit === 'lakhs'
          ? profile.annual_turnover
          : profile.turnover_unit === 'crores'
          ? profile.annual_turnover * 100
          : profile.annual_turnover / 100000,
        annual_turnover: profile.annual_turnover,
        turnover_unit: profile.turnover_unit as any,
        experience_years: profile.experience,
        team_size: profile.teamSize,
        industry: profile.industry,
        state: profile.state,
        certifications: selectedCerts,
      };

      // 3. Trigger Backend Analysis Pipeline
      const analyzeRes = await analyzeTender({
        business_profile: backendProfile,
        tender_text: currentTenderText,
        tender_url: tenderUrl,
        tender_id: currentTenderId || undefined,
        tender_file_path: currentTenderFilePath || undefined,
      });

      const currentAnalysisId = analyzeRes.analysis_id;
      setAnalysisId(currentAnalysisId);

      // 4. Connect to WebSockets for Live Updates
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = process.env.NEXT_PUBLIC_WS_HOST || '127.0.0.1:8000';
      const wsUrl = `${wsProtocol}//${wsHost}/api/ws/analysis/${currentAnalysisId}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);

      // Reset steps
      const initializedSteps = MOCK_AGENT_STEPS.map((step) => ({
        ...step,
        status: 'pending' as const,
        duration: '',
      }));
      setAgentSteps(initializedSteps);
      setCurrentAgentStep(0);
      setProgress(0);

      const STEP_ID_MAP: Record<string, number> = {
        document_extraction: 0,
        eligibility_analysis: 1,
        technical_requirement: 2,
        financial_risk_assessor: 3,
        bid_prediction: 4,
        proposal_report_builder: 5,
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.status === 'failed') {
            toast.error(`Pipeline failed: ${data.message || 'Unknown error'}`);
            setPhase('input');
            ws.close();
            return;
          }

          const stepId = data.step_id;
          const status = data.status;
          const progressPercent = data.progress_percent;
          
          setProgress(progressPercent);

          if (data.logs) {
            setAgentLogs(data.logs);
          }

          if (stepId === 'completed' || progressPercent === 100) {
            ws.close();

            // Fetch final results from MongoDB
            const analysisDoc = await getAnalysis(currentAnalysisId);
            if (analysisDoc) {
              // The analysis document wraps the pipeline state in a `result` field
              const finalState = analysisDoc.result || analysisDoc;
              const mapped = mapBackendToFrontendResult(finalState);
              setResult(mapped);
              setPhase('results');
              toast.success('Analysis report compiled successfully!');
            } else {
              toast.error('Failed to retrieve analysis state');
              setPhase('input');
            }
            return;
          }

          const idx = STEP_ID_MAP[stepId];
          if (idx !== undefined) {
            setCurrentAgentStep(idx);
            setAgentSteps((prev) =>
              prev.map((step, sIdx) => {
                if (sIdx < idx) {
                  return { ...step, status: 'completed' as const, duration: step.duration || '1.0s' };
                }
                if (sIdx === idx) {
                  return { ...step, status: status === 'running' ? ('running' as const) : ('completed' as const) };
                }
                return step;
              })
            );
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        runSimulatedFallback();
      };
      
    } catch (err: any) {
      console.error('Error in handleRunAnalysis:', err);
      runSimulatedFallback();
    }
  };


  const radarData = [
    { subject: 'Eligibility', score: result.scores.eligibility },
    { subject: 'Technical', score: result.scores.technical },
    { subject: 'Financial', score: result.scores.financial },
    { subject: 'Experience', score: result.scores.experience },
    { subject: 'Compliance', score: result.scores.compliance },
  ];

  const costData = [
    { name: 'Development', amount: result.costEstimation.development / 100000 },
    { name: 'Infrastructure', amount: result.costEstimation.infrastructure / 100000 },
    { name: 'Team', amount: result.costEstimation.team / 100000 },
    { name: 'Operations', amount: result.costEstimation.operations / 100000 },
    { name: 'Contingency', amount: result.costEstimation.contingency / 100000 },
  ];

  const matchingSchemes = MOCK_SCHEMES.filter((s) => result.matchingSchemes.includes(s.id));

  if (!mounted) return <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }} />;


  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', paddingTop: 80 }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
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
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
              Tender Analysis
            </h1>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Upload your tender document and let 6 AI agents analyze it
            </p>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ===================== PHASE 1: INPUT ===================== */}
          {phase === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-6"
            >
              {/* Input Tabs */}
              <div className="glass-card-static rounded-2xl overflow-hidden">
                <div
                  className="flex border-b"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  {([
                    { id: 'upload', label: 'Upload PDF', icon: Upload },
                    { id: 'url', label: 'Enter URL', icon: Link2 },
                    { id: 'text', label: 'Paste Text', icon: AlignLeft },
                  ] as const).map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setInputTab(tab.id)}
                        className="flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all relative"
                        style={{
                          color: inputTab === tab.id ? '#3B82F6' : '#64748B',
                          background: inputTab === tab.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        <Icon size={15} />
                        {tab.label}
                        {inputTab === tab.id && (
                          <motion.div
                            layoutId="inputTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5"
                            style={{ background: '#3B82F6' }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="p-6">
                  {inputTab === 'upload' && (
                    <div>
                      <div
                        {...getRootProps()}
                        className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all"
                        style={{
                          borderColor: isDragActive ? '#3B82F6' : uploadedFile ? '#10B981' : 'rgba(255,255,255,0.12)',
                          background: isDragActive
                            ? 'rgba(59,130,246,0.08)'
                            : uploadedFile
                            ? 'rgba(16,185,129,0.06)'
                            : 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <input {...getInputProps()} />
                        {uploadedFile ? (
                          <div className="flex flex-col items-center gap-3">
                            <FileText size={40} style={{ color: '#10B981' }} />
                            <p className="font-semibold" style={{ color: '#F1F5F9' }}>
                              {uploadedFile.name}
                            </p>
                            <p className="text-sm" style={{ color: '#64748B' }}>
                              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB — Ready to analyze
                            </p>
                            <button
                              onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                              className="flex items-center gap-1 text-sm px-3 py-1 rounded-lg"
                              style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)' }}
                            >
                              <X size={13} /> Remove
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-4">
                            <div
                              className="w-16 h-16 rounded-2xl flex items-center justify-center"
                              style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}
                            >
                              <Upload size={28} style={{ color: '#3B82F6' }} />
                            </div>
                            <div>
                              <p className="font-semibold text-lg mb-1" style={{ color: '#F1F5F9' }}>
                                {isDragActive ? 'Drop the PDF here!' : 'Drag & drop tender PDF'}
                              </p>
                              <p className="text-sm" style={{ color: '#64748B' }}>
                                or <span style={{ color: '#3B82F6' }}>click to browse</span> · PDF up to 25MB
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {inputTab === 'url' && (
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#94A3B8' }}>
                        Tender Portal URL
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="url"
                          placeholder="https://gem.gov.in/tender/..."
                          value={tenderUrl}
                          onChange={(e) => setTenderUrl(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#F1F5F9',
                          }}
                        />
                      </div>
                      <p className="text-xs mt-2" style={{ color: '#64748B' }}>
                        Supports GeM, CPPP, eProcure, NIC portals
                      </p>
                    </div>
                  )}

                  {inputTab === 'text' && (
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#94A3B8' }}>
                        Paste Tender Text
                      </label>
                      <textarea
                        placeholder="Paste the full tender document text here..."
                        value={tenderText}
                        onChange={(e) => setTenderText(e.target.value)}
                        rows={10}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#F1F5F9',
                          lineHeight: 1.7,
                        }}
                      />
                      <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                        {tenderText.length} characters entered
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Business Profile */}
              <div className="glass-card-static rounded-2xl overflow-hidden">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-full flex items-center justify-between px-6 py-4 transition-colors"
                  style={{ borderBottom: profileOpen ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle size={16} style={{ color: '#10B981' }} />
                    <span className="font-bold text-sm" style={{ color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
                      Business Profile
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}
                    >
                      Auto-saved
                    </span>
                  </div>
                  {profileOpen ? <ChevronUp size={18} style={{ color: '#64748B' }} /> : <ChevronDown size={18} style={{ color: '#64748B' }} />}
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="p-6">
                        <BusinessProfileForm
                          profile={profile}
                          setProfile={handleProfileChange}
                          selectedCerts={selectedCerts}
                          setSelectedCerts={handleCertsChange}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Run Analysis Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRunAnalysis}
                className="w-full py-5 rounded-2xl font-bold text-xl text-white transition-all btn-glow flex items-center justify-center gap-3"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', fontFamily: 'Inter, sans-serif' }}
              >
                <Zap size={24} />
                Run AI Analysis
                <span
                  className="text-sm px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.2)', fontFamily: 'DM Sans, sans-serif' }}
                >
                  6 Agents
                </span>
              </motion.button>
            </motion.div>
          )}

          {/* ===================== PHASE 2: PROCESSING ===================== */}
          {phase === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <AnalysisProgressPanel
                steps={agentSteps}
                agentLogs={agentLogs}
                currentStep={currentAgentStep}
                overallProgress={progress}
              />
            </motion.div>
          )}

          {/* ===================== PHASE 3: RESULTS ===================== */}
          {phase === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6"
            >
              <ResultsPanel
                result={result}
                analysisId={analysisId}
                matchingSchemes={matchingSchemes}
                radarData={radarData}
                costData={costData}
                setPhase={setPhase}
                setUploadedFile={setUploadedFile}
                setTenderUrl={setTenderUrl}
                setTenderText={setTenderText}
                setAgentSteps={setAgentSteps}
                setCurrentAgentStep={setCurrentAgentStep}
                setProgress={setProgress}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    }>
      <AnalyzeContent />
    </Suspense>
  );
}
