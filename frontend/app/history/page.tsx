'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Trash2, RefreshCw, Loader2, ArrowRight, Eye, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAnalyses, deleteAnalysis, downloadReport, downloadReportDocx, emailReport } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function HistoryPage() {
  const [mounted, setMounted] = useState(false);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const data = await getAnalyses();
      setAnalyses(data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth';
        return;
      }
    }
    setMounted(true);
    fetchHistory();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return;
    try {
      await deleteAnalysis(id);
      toast.success('Analysis deleted');
      setAnalyses(analyses.filter((a) => (a.analysis_id || a.id) !== id));
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const handleDownloadPDF = async (id: string, title: string) => {
    try {
      toast.loading('Preparing PDF report...');
      const blob = await downloadReport(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tender_Report_${title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.dismiss();
      toast.success('PDF report downloaded!');
    } catch (e) {
      toast.dismiss();
      toast.error('Download failed');
    }
  };

  const handleDownloadDocx = async (id: string, title: string) => {
    try {
      toast.loading('Preparing Word proposal...');
      const blob = await downloadReportDocx(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Proposal_${title.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.dismiss();
      toast.success('Word proposal downloaded!');
    } catch (e) {
      toast.dismiss();
      toast.error('Download failed');
    }
  };

  const handleEmailReport = async (id: string) => {
    try {
      toast.loading('Queueing email...');
      await emailReport(id);
      toast.dismiss();
      toast.success('PDF Report dispatched to your email!');
    } catch (e) {
      toast.dismiss();
      toast.error('Failed to send email');
    }
  };

  if (!mounted) return <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }} />;


  return (
    <div className="min-h-screen pb-12" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Analysis History</h1>
            <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
              View and download your completed tender evaluations.
            </p>
          </div>
          <button
            onClick={fetchHistory}
            className="flex items-center gap-2 text-xs bg-white/5 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-slate-300 transition-all"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={36} className="animate-spin text-blue-500" />
            <p className="text-sm text-slate-400">Retrieving records...</p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="glass-card text-center py-16 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <FileText size={48} className="mx-auto text-slate-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-300">No analyses completed yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-6">
              Go to the Analyze section to upload a PDF or enter a tender description.
            </p>
            <a
              href="/analyze"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-semibold"
            >
              Start Analysis <ArrowRight size={14} />
            </a>
          </div>
        ) : (
          <div className="glass-card rounded-2xl border overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.08)', background: 'rgba(0, 0, 0, 0.1)' }}>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Tender Title</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Date Checked</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Eligibility Score</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Win Probability</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {analyses.map((item, idx) => {
                    const id = item.analysis_id || item.id;
                    const res = item.result || {};
                    const elig = res.eligibility_result || {};
                    const bid = res.bid_prediction || {};
                    
                    const score = elig.overall_score !== undefined 
                      ? Math.round(elig.overall_score * 100) 
                      : (item.eligibility || 75);
                      
                    const prob = bid.win_probability !== undefined 
                      ? Math.round(bid.win_probability * 100) 
                      : (item.winProbability || 70);

                    return (
                      <tr key={id} className="hover:bg-white/[0.01] transition-all">
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-200 block max-w-md truncate">
                            {item.tenderName || item.tender_title || 'Tender Analysis'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {item.date || (item.created_at ? item.created_at.slice(0, 10) : 'Recent')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                            score >= 70 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {score}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-blue-400">{prob}%</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/analyze?analysis_id=${id}`}
                              className="p-2 bg-blue-600/10 hover:bg-blue-600/20 rounded-lg text-blue-400 border border-blue-500/10 hover:border-blue-500/20 transition-all"
                              title="Open Analysis"
                            >
                              <Eye size={14} />
                            </Link>
                              <button
                                onClick={() => handleDownloadPDF(id, item.tenderName || item.tender_title || 'Report')}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 border border-white/5 hover:border-white/10 transition-all"
                                title="Download PDF"
                              >
                                <Download size={14} />
                              </button>
                              <button
                                onClick={() => handleEmailReport(id)}
                                className="p-2 bg-purple-600/10 hover:bg-purple-600/20 rounded-lg text-purple-400 border border-purple-500/10 hover:border-purple-500/20 transition-all"
                                title="Email PDF Report"
                              >
                                <Mail size={14} />
                              </button>
                              <button
                                onClick={() => handleDownloadDocx(id, item.tenderName || item.tender_title || 'Report')}
                              className="p-2 bg-blue-600/10 hover:bg-blue-600/20 rounded-lg text-blue-400 border border-blue-500/10 hover:border-blue-500/20 transition-all"
                              title="Download Word Proposal"
                            >
                              <FileText size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(id)}
                              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-400 border border-rose-500/10 hover:border-rose-500/20 transition-all"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
