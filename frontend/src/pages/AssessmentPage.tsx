import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';
import { Assessment, Material, AssessmentResult } from '../types';
import { api } from '../services/api';

interface AssessmentPageProps {
  onCompleteQuiz: (result: AssessmentResult) => void;
}

export const AssessmentPage: React.FC<AssessmentPageProps> = ({ onCompleteQuiz }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('Gradient Descent Optimization');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Adaptive');
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeQuiz, setActiveQuiz] = useState<Assessment | null>(null);

  // Active quiz state
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const mats = await api.materials.list();
        setMaterials(mats);
      } catch (err) {
        console.error('Failed to load materials for quiz generator:', err);
      }
    };
    fetchMaterials();
  }, []);

  useEffect(() => {
    let interval: any;
    if (timerActive) {
      interval = setInterval(() => {
        setTimeSpentSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const quiz = await api.assessments.generate({
        topic_name: selectedTopic,
        difficulty: selectedDifficulty,
        question_count: questionCount,
        time_limit_minutes: 15,
      });
      setActiveQuiz(quiz);
      setCurrentQIndex(0);
      setAnswers({});
      setTimeSpentSeconds(0);
      setTimerActive(true);
    } catch (err: any) {
      alert(`Quiz generation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    setTimerActive(false);

    try {
      const formattedAnswers = activeQuiz.questions.map((q) => ({
        question_id: q.id,
        student_response: answers[q.id] || '',
      }));

      const result = await api.assessments.submit(
        activeQuiz.id,
        formattedAnswers,
        timeSpentSeconds
      );

      onCompleteQuiz(result);
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
      setTimerActive(true);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. ASSESSMENT BUILDER VIEW
  if (!activeQuiz) {
    const availableTopics = [
      'Gradient Descent Optimization',
      'Linear Algebra & Eigenvalues',
      'Neural Network Architectures',
      'Backpropagation & Chain Rule',
      'Transformers & Attention',
    ];

    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight">
            Adaptive Assessment Generator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configures verifiable problem sets tuned to your Bayesian Knowledge Tracing mastery profile.
          </p>
        </div>

        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-4">
            {/* Topic Selection */}
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-2">Target Concept / Topic</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {availableTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Setting */}
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-2">Difficulty Level</label>
              <div className="grid grid-cols-4 gap-2.5">
                {['Adaptive', 'Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      selectedDifficulty === diff
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                {selectedDifficulty === 'Adaptive'
                  ? 'Adaptive mode automatically calibrates problem difficulty based on your current BKT mastery probability.'
                  : `Static ${selectedDifficulty} problem formulation.`}
              </p>
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-2">Number of Questions</label>
              <div className="grid grid-cols-3 gap-3">
                {[3, 5, 8].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      questionCount === cnt
                        ? 'bg-navy-900 text-white border-navy-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full inline-flex items-center justify-center space-x-2 py-3.5 px-6 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Adaptive Questions...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start Adaptive Assessment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE QUIZ TAKING VIEW
  const currentQ = activeQuiz.questions[currentQIndex];
  const progressPercent = Math.round(((currentQIndex + 1) / activeQuiz.questions.length) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Quiz Header Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
            {activeQuiz.difficulty} Quiz
          </span>
          <h2 className="text-base font-bold text-navy-950 mt-1">{activeQuiz.title}</h2>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-brand-600" />
          <span>{formatTimer(timeSpentSeconds)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500 font-semibold">
          <span>
            Question {currentQIndex + 1} of {activeQuiz.questions.length}
          </span>
          <span>{progressPercent}% Complete</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-brand-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Active Question Card */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
              {currentQ.question_type.toUpperCase()}
            </span>
            <span className="text-xs text-slate-400">• Fingerprint: {currentQ.fingerprint}</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-navy-950 leading-relaxed">
            {currentQ.question_text}
          </h3>
        </div>

        {/* Input Format Based on Question Type */}
        {currentQ.question_type === 'mcq' && (
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              const isSelected = answers[currentQ.id] === opt;
              return (
                <div
                  key={idx}
                  onClick={() => handleAnswerChange(currentQ.id, opt)}
                  className={`p-4 rounded-xl border text-sm font-medium transition-all cursor-pointer flex items-center space-x-3 ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/60 text-brand-950 shadow-sm'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white text-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-brand-600 bg-brand-600'
                        : 'border-slate-400 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span>{opt}</span>
                </div>
              );
            })}
          </div>
        )}

        {currentQ.question_type === 'numerical' && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Enter Numeric Answer:</label>
            <input
              type="number"
              step="any"
              value={answers[currentQ.id] || ''}
              onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
              placeholder="e.g. 6 or 0.25"
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>
        )}

        {currentQ.question_type === 'short_answer' && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Your Explanation / Derivation:</label>
            <textarea
              rows={3}
              value={answers[currentQ.id] || ''}
              onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
              placeholder="State the core mathematical or conceptual mechanism..."
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQIndex === 0}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-40"
          >
            ← Previous
          </button>

          {currentQIndex < activeQuiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQIndex((prev) => prev + 1)}
              className="px-5 py-2.5 text-xs font-bold text-white bg-navy-950 hover:bg-navy-900 rounded-xl transition-all shadow-sm flex items-center space-x-1.5"
            >
              <span>Next Question</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md flex items-center space-x-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Grading Answers & Updating BKT...</span>
                </>
              ) : (
                <span>Submit & View Results</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
