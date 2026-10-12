import React from 'react';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Brain,
  Video,
  FileText,
  Presentation,
  ShieldCheck,
  TrendingUp,
  Compass,
  Layers
} from 'lucide-react';

interface LandingPageProps {
  onStartLearning: () => void;
  onExploreFeatures: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartLearning, onExploreFeatures }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-navy-950 flex flex-col font-sans">
      {/* Top Banner Navigation */}
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-navy-950">
              EduAdapt<span className="text-brand-600">.ai</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onExploreFeatures}
              className="text-sm font-semibold text-slate-600 hover:text-navy-900 transition-colors hidden sm:inline-block"
            >
              Explore Features
            </button>
            <button
              onClick={onStartLearning}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all"
            >
              <span>Start Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-700 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Multimodal AI Hackathon 2026 • Track D: Adaptive Learning</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-navy-950 tracking-tight max-w-4xl mx-auto leading-tight">
            Learn Smarter. Understand Deeper.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent-600">
              Improve Every Day.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Unify textbooks, lecture slides, and video recordings into a source-cited, hallucination-resistant knowledge base. Master topics with mathematically proven Bayesian Knowledge Tracing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onStartLearning}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 text-base font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-lg shadow-brand-600/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>Start Learning Now</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onExploreFeatures}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 shadow-sm transition-all"
            >
              <Compass className="w-5 h-5 text-slate-500" />
              <span>Explore Features</span>
            </button>
          </div>

          {/* Interactive Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto text-left">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <FileText className="w-5 h-5 text-red-500 mb-2" />
              <div className="font-bold text-sm text-navy-900">PDF Textbooks</div>
              <div className="text-xs text-slate-500">Page-accurate extraction</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <Presentation className="w-5 h-5 text-orange-500 mb-2" />
              <div className="font-bold text-sm text-navy-900">Lecture Slides</div>
              <div className="text-xs text-slate-500">Slide & note grounding</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <Video className="w-5 h-5 text-indigo-500 mb-2" />
              <div className="font-bold text-sm text-navy-900">Lecture Videos</div>
              <div className="text-xs text-slate-500">Time-stamped transcripts</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <Brain className="w-5 h-5 text-emerald-500 mb-2" />
              <div className="font-bold text-sm text-navy-900">Bayesian Tracing</div>
              <div className="text-xs text-slate-500">True mastery math</div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Dashboard Preview Section */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-navy-950 tracking-tight">
              An End-to-End Multimodal Study Companion
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Built on verified Retrieval-Augmented Generation, strict refusal thresholds, and adaptive assessment generation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-navy-900">Source-Cited AI Tutoring</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every factual claim is directly linked to an uploaded textbook page, slide number, or video timestamp. If evidence is absent, the tutor refuses rather than hallucinating.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-navy-900">Adaptive BKT Quizzes</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Calculates true posterior knowledge estimates using Corbett & Anderson Bayesian Knowledge Tracing. Targets weak concepts and adapts question difficulty dynamically.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-navy-900">Concept Prerequisite DAG</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Visualizes topic dependencies, knowledge readiness, and prerequisite paths extracted directly from your course curriculum structure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-navy-950 tracking-tight">
              How EduAdapt AI Works
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              From raw course documents to verified mastery in 4 simple steps.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2 relative">
              <span className="text-3xl font-black text-brand-200">01</span>
              <h4 className="font-bold text-base text-navy-900">Upload Course Media</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload PDF chapters, slide presentations, or video transcripts. The ingestion pipeline segments and tags concepts.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2 relative">
              <span className="text-3xl font-black text-brand-200">02</span>
              <h4 className="font-bold text-base text-navy-900">Grounded Interaction</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ask challenging technical questions. The tutor verifies claims against retrieved chunks and provides clickable citations.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2 relative">
              <span className="text-3xl font-black text-brand-200">03</span>
              <h4 className="font-bold text-base text-navy-900">Adaptive Quizzing</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Take quizzes generated from course material. Questions are fingerprinted to prevent duplicate repetition.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2 relative">
              <span className="text-3xl font-black text-brand-200">04</span>
              <h4 className="font-bold text-base text-navy-900">BKT Mastery Growth</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                The learner model updates your topic mastery probabilities, recommends targeted revision, and tracks growth.
              </p>
            </div>
          </div>

          <div className="text-center pt-8">
            <button
              onClick={onStartLearning}
              className="inline-flex items-center space-x-2 px-8 py-4 text-base font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-lg transition-all"
            >
              <span>Launch Student Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p>
          EduAdapt AI • Multimodal AI Hackathon 2026 • Track D: Personalized Tutoring & Adaptive Learning
        </p>
      </footer>
    </div>
  );
};
