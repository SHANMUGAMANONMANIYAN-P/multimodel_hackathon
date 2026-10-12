import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  LayoutDashboard,
  FileText,
  Presentation,
  Video,
  ShieldCheck,
  Brain
} from 'lucide-react';
import { AssessmentResult, CitationItem } from '../types';
import { SourceViewerModal } from '../components/SourceViewerModal';

interface ResultsPageProps {
  result: AssessmentResult;
  onRetake: () => void;
  onGoToDashboard: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  result,
  onRetake,
  onGoToDashboard,
}) => {
  const [selectedCitation, setSelectedCitation] = useState<CitationItem | null>(null);

  const getScoreColor = () => {
    if (result.percentage >= 80) return 'text-emerald-600';
    if (result.percentage >= 60) return 'text-brand-600';
    return 'text-rose-600';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Score Overview Card */}
      <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
            Assessment Completed
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950">
            Performance & Diagnostic Report
          </h1>
          <p className="text-xs text-slate-500">
            Time spent: {Math.floor(result.time_spent_seconds / 60)}m {result.time_spent_seconds % 60}s
          </p>
        </div>

        <div className="flex items-center space-x-6 text-center">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-500 block">Raw Score</span>
            <span className="text-2xl font-black text-navy-950 font-mono">
              {result.score} / {result.max_score}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-500 block">Percentage</span>
            <span className={`text-3xl font-black font-mono ${getScoreColor()}`}>
              {result.percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* BKT Knowledge Tracing Updates Panel */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-brand-700">
          <Brain className="w-5 h-5 flex-shrink-0" />
          <h2 className="text-base font-bold text-navy-950">
            Bayesian Knowledge Tracing (BKT) Posterior Updates
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Real-time probability updates based on your practice observations and difficulty weighting.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          {result.mastery_updates.map((update, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-navy-900">{update.topic_name}</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    update.delta >= 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {update.delta >= 0 ? '+' : ''}
                  {Math.round(update.delta * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Prior: {Math.round(update.prior_mastery * 100)}%</span>
                <span className="font-bold text-navy-950 font-mono">
                  Updated: {Math.round(update.updated_mastery * 100)}% ({update.mastery_state})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {update.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Misconceptions Inferred (If any) */}
      {result.inferred_misconceptions && result.inferred_misconceptions.length > 0 && (
        <div className="p-6 bg-amber-50 rounded-3xl border border-amber-200 space-y-3">
          <div className="flex items-center space-x-2 text-amber-900">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <h3 className="text-sm font-bold">Inferred Conceptual Misconceptions</h3>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-amber-800">
            {result.inferred_misconceptions.map((misc, i) => (
              <li key={i}>{misc}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Answer-by-Answer Detailed Review */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-navy-950">
          Question-by-Question Review & Source Evidence
        </h2>

        {result.answers.map((ans, idx) => (
          <div
            key={idx}
            className={`p-6 bg-white rounded-3xl border shadow-sm space-y-4 ${
              ans.is_correct ? 'border-emerald-200' : 'border-rose-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {ans.is_correct ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Question #{idx + 1} • {ans.question_type.toUpperCase()}
                </span>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  ans.is_correct
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {ans.is_correct ? 'Correct (+1.0)' : 'Incorrect (0.0)'}
              </span>
            </div>

            <h3 className="text-sm font-bold text-navy-950">{ans.question_text}</h3>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-500 block mb-0.5">Your Response:</span>
                <span className="text-navy-900 font-medium">{ans.student_response || '(No answer provided)'}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="font-bold text-emerald-700 block mb-0.5">Answer Key / Ground Truth:</span>
                <span className="text-emerald-900 font-medium">{ans.answer_key}</span>
              </div>
            </div>

            {/* Explanation with Source Citations */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 text-xs text-slate-700 space-y-2">
              <p className="font-semibold text-navy-950">Pedagogical Explanation:</p>
              <p className="leading-relaxed">{ans.explanation}</p>

              {ans.source_references && ans.source_references.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="text-[11px] font-bold text-slate-500">Source Citations:</span>
                  {ans.source_references.map((cit, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => setSelectedCitation(cit)}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 shadow-sm transition-colors"
                    >
                      {cit.source_type === 'pdf' && <FileText className="w-3 h-3 text-red-500" />}
                      {cit.source_type === 'pptx' && <Presentation className="w-3 h-3 text-orange-500" />}
                      {cit.source_type === 'video' && <Video className="w-3 h-3 text-indigo-500" />}
                      <span>
                        {cit.material_title.slice(0, 16)}... [
                        {cit.source_type === 'pdf' ? `p.${cit.page_number}` : cit.source_type === 'pptx' ? `s.${cit.slide_number}` : `t.${cit.video_timestamp}`}
                        ]
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-slate-200">
        <button
          onClick={onRetake}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Take Another Quiz</span>
        </button>

        <button
          onClick={onGoToDashboard}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>

      {/* Citation Inspector Modal */}
      {selectedCitation && (
        <SourceViewerModal
          citation={selectedCitation}
          onClose={() => setSelectedCitation(null)}
        />
      )}
    </div>
  );
};
