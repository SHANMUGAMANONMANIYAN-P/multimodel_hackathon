import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Brain,
  ShieldCheck,
  RefreshCw,
  Clock,
  Layers
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { EvaluationRun } from '../types';
import { api } from '../services/api';

export const EvaluationPage: React.FC = () => {
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [activeRun, setActiveRun] = useState<EvaluationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const fetchRuns = async () => {
    try {
      const data = await api.evaluation.getRuns();
      setStatusMessage(data.status);
      setRuns(data.runs);
      if (data.runs.length > 0) {
        setActiveRun(data.runs[0]);
      }
    } catch (err) {
      console.error('Failed to load evaluation runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleRunBenchmark = async () => {
    setEvaluating(true);
    try {
      const newRun = await api.evaluation.runBenchmark('Multimodal AI Hackathon 2026 Test Suite');
      await fetchRuns();
      setActiveRun(newRun);
    } catch (err: any) {
      alert(`Benchmark execution failed: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  // Prepare chart data for synthetic learner simulations
  const learnerData = [];
  if (activeRun && activeRun.learner_simulations) {
    const sims = activeRun.learner_simulations;
    const beginnerTraj = sims.Beginner?.trajectory || [];
    const intermediateTraj = sims.Intermediate?.trajectory || [];
    const advancedTraj = sims.Advanced?.trajectory || [];

    for (let i = 0; i < 9; i++) {
      learnerData.push({
        session: `Round ${i}`,
        Beginner: beginnerTraj[i] ? Math.round(beginnerTraj[i].mastery * 100) : null,
        Intermediate: intermediateTraj[i] ? Math.round(intermediateTraj[i].mastery * 100) : null,
        Advanced: advancedTraj[i] ? Math.round(advancedTraj[i].mastery * 100) : null,
      });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight">
            Evaluation & Benchmarking Module
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Measures RAG retrieval precision, citation accuracy, unsupported refusal rate, and BKT learner convergence.
          </p>
        </div>

        <button
          onClick={handleRunBenchmark}
          disabled={evaluating}
          className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          {evaluating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Executing Benchmark Pipeline...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Run Live Benchmark</span>
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
          <span>Loading evaluation records...</span>
        </div>
      ) : runs.length === 0 ? (
        /* Not Evaluated Yet State */
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-navy-950">Not evaluated yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No evaluation benchmark has been executed for this deployment. Click the button below to test RAG faithfulness, refusal rates, and BKT simulation.
            </p>
          </div>
          <button
            onClick={handleRunBenchmark}
            disabled={evaluating}
            className="inline-flex items-center space-x-2 px-6 py-3 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all"
          >
            <Play className="w-4 h-4" />
            <span>Run Benchmark Now</span>
          </button>
        </div>
      ) : (
        /* Evaluated Dashboard View */
        <div className="space-y-8">
          {/* Metrics Grid */}
          {activeRun && activeRun.metrics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Faithfulness
                </span>
                <span className="text-3xl font-black font-mono text-emerald-600">
                  {Math.round((activeRun.metrics.faithfulness || 0) * 100)}%
                </span>
                <p className="text-[11px] text-slate-400">Zero unsupported claims</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Citation Accuracy
                </span>
                <span className="text-3xl font-black font-mono text-brand-600">
                  {Math.round((activeRun.metrics.citation_accuracy || 0) * 100)}%
                </span>
                <p className="text-[11px] text-slate-400">Verified document references</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Refusal Rate
                </span>
                <span className="text-3xl font-black font-mono text-indigo-600">
                  {Math.round((activeRun.metrics.unsupported_refusal_rate || 0) * 100)}%
                </span>
                <p className="text-[11px] text-slate-400">On unanswerable queries</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Duplication Rate
                </span>
                <span className="text-3xl font-black font-mono text-teal-600">
                  {Math.round((activeRun.metrics.question_repetition_rate || 0) * 100)}%
                </span>
                <p className="text-[11px] text-slate-400">Fingerprinted uniqueness</p>
              </div>
            </div>
          )}

          {/* Secondary Metric Details */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-navy-900">
              Retrieval & Grounding Benchmark Metrics
            </h3>
            <div className="grid sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-semibold block">Context Precision</span>
                <span className="text-xl font-bold font-mono text-navy-950">
                  {Math.round((activeRun?.metrics.context_precision || 0) * 100)}%
                </span>
                <p className="text-[11px] text-slate-400">Relevance of retrieved chunks</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-semibold block">Context Recall</span>
                <span className="text-xl font-bold font-mono text-navy-950">
                  {Math.round((activeRun?.metrics.context_recall || 0) * 100)}%
                </span>
                <p className="text-[11px] text-slate-400">Coverage of gold evidence</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-semibold block">Answer Key Verification</span>
                <span className="text-xl font-bold font-mono text-navy-950">
                  {Math.round((activeRun?.metrics.question_verification_rate || 0) * 100)}%
                </span>
                <p className="text-[11px] text-slate-400">Programmatic formula checking</p>
              </div>
            </div>
          </div>

          {/* Synthetic Learner Simulation Chart */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-navy-950">
                  Synthetic Learner Mastery Convergence Simulation (BKT)
                </h3>
                <p className="text-xs text-slate-500">
                  Simulated knowledge tracing over 8 rounds for Beginner, Intermediate, and Advanced student profiles.
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={learnerData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="session" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-3 bg-navy-950 text-white rounded-xl text-xs space-y-1 shadow-lg">
                            <p className="font-bold">{label}</p>
                            {payload.map((p: any) => (
                              <p key={p.name} style={{ color: p.color }}>
                                {p.name}: <span className="font-mono font-bold">{p.value}%</span>
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="Beginner"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    name="Beginner (Initial P(L0)=15%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="Intermediate"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    name="Intermediate (Initial P(L0)=40%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="Advanced"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    name="Advanced (Initial P(L0)=70%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
