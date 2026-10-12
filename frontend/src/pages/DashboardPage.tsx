import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FolderPlus,
  Play
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { DashboardStats } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const data = await api.analytics.getDashboard();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getMasteryColor = (prob: number) => {
    if (prob >= 0.85) return '#10b981'; // emerald
    if (prob >= 0.70) return '#6366f1'; // indigo
    if (prob >= 0.40) return '#f59e0b'; // amber
    return '#ef4444'; // rose/red
  };

  const chartData = stats?.topic_masteries.map((tm) => ({
    name: tm.topic_name.length > 22 ? tm.topic_name.slice(0, 20) + '...' : tm.topic_name,
    fullName: tm.topic_name,
    masteryPercent: Math.round(tm.current_mastery * 100),
    masteryProb: tm.current_mastery,
    state: tm.mastery_state,
  })) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome & Recommendation Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-brand-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-200 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bayesian Knowledge Tracing Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.full_name || 'Student'}!
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {stats?.recommended_next_activity || 'Loading pedagogical study recommendations...'}
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('assessment')}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-xl text-xs font-bold text-white shadow-sm transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Launch Adaptive Quiz</span>
            </button>
            <button
              onClick={() => onNavigate('tutor')}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-white transition-all backdrop-blur-sm"
            >
              <span>Ask AI Tutor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mastery Index</span>
            <TrendingUp className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-navy-950">
            {stats ? `${Math.round(stats.overall_mastery * 100)}%` : '--'}
          </div>
          <div className="text-xs text-slate-500 font-medium flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            <span>BKT Bayesian Posterior</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Materials Ingested</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-navy-950">
            {stats?.total_materials ?? '--'}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            PDFs, Slides & Video transcripts
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Quizzes Completed</span>
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-navy-950">
            {stats?.quizzes_completed ?? '--'}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Adaptive scored assessments
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Estimated Study Time</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-navy-950">
            {stats ? `${stats.study_time_minutes}m` : '--'}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Active verified study session
          </div>
        </div>
      </div>

      {/* Main Charts & Topic Progress */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Topic Mastery Bar Chart */}
        <div className="lg:col-span-2 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-navy-950">Topic Mastery Estimates (BKT)</h2>
              <p className="text-xs text-slate-500">Calculated posterior probability of concept knowledge</p>
            </div>
            <button
              onClick={() => onNavigate('knowledge-map')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
            >
              <span>View Concept DAG</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full pt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-navy-950 text-white rounded-xl text-xs shadow-lg space-y-1">
                            <p className="font-bold">{data.fullName}</p>
                            <p className="text-slate-300">
                              Estimated Mastery: <span className="font-mono text-emerald-400 font-bold">{data.masteryPercent}%</span>
                            </p>
                            <p className="text-[11px] text-slate-400">State: {data.state}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="masteryPercent" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getMasteryColor(entry.masteryProb)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No topic mastery records recorded yet. Complete an adaptive quiz to populate.
              </div>
            )}
          </div>
        </div>

        {/* Priority Revision Panel */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-rose-700">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h2 className="text-base font-bold text-navy-950">Weak Topics Needing Revision</h2>
            </div>
            <p className="text-xs text-slate-500">
              Identified by BKT as having mastery estimates below 65%.
            </p>

            <div className="space-y-2.5">
              {stats?.weak_topics && stats.weak_topics.length > 0 ? (
                stats.weak_topics.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl border border-rose-100 bg-rose-50/50 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-navy-900">{t.topic_name}</div>
                      <div className="text-[11px] text-slate-500">
                        Practiced {t.total_practices} times ({t.correct_practices} correct)
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                      {Math.round(t.current_mastery * 100)}%
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 text-emerald-800 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>All practiced concepts are currently above threshold!</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('assessment')}
            className="w-full mt-4 py-2.5 px-4 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-sm"
          >
            Practice Weak Concepts Now
          </button>
        </div>
      </div>

      {/* Recent Learning Activities */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-navy-950">Recent Learning Activities</h2>
        <div className="divide-y divide-slate-100">
          {stats?.recent_activities && stats.recent_activities.length > 0 ? (
            stats.recent_activities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 rounded-full bg-brand-500" />
                  <span className="font-semibold text-slate-800">{act.title}</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              No recent activity recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
