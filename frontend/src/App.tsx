import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { TutorPage } from './pages/TutorPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { ResultsPage } from './pages/ResultsPage';
import { KnowledgeMapPage } from './pages/KnowledgeMapPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { AssessmentResult } from './types';
import { api } from './services/api';

const MainAppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [lastQuizResult, setLastQuizResult] = useState<AssessmentResult | null>(null);
  const [aiModeBadge, setAiModeBadge] = useState<string>('Local Extractive RAG / Gemini');

  // Once authenticated, default to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      if (currentView === 'landing' || currentView === 'login' || currentView === 'register') {
        setCurrentView('dashboard');
      }
      // Fetch AI provider status
      api.analytics.getDashboard().then((d) => {
        if (d && d.ai_status) {
          setAiModeBadge(d.ai_status.mode_badge);
        }
      }).catch(() => {});
    } else {
      if (currentView !== 'login' && currentView !== 'register') {
        setCurrentView('landing');
      }
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-semibold text-slate-500">
        Initializing EduAdapt AI workspace...
      </div>
    );
  }

  // Non-authenticated views
  if (!isAuthenticated) {
    if (currentView === 'login') {
      return (
        <LoginPage
          onSwitchToRegister={() => setCurrentView('register')}
          onBackToHome={() => setCurrentView('landing')}
        />
      );
    }
    if (currentView === 'register') {
      return (
        <RegisterPage
          onSwitchToLogin={() => setCurrentView('login')}
          onBackToHome={() => setCurrentView('landing')}
        />
      );
    }
    return (
      <LandingPage
        onStartLearning={() => setCurrentView('login')}
        onExploreFeatures={() => setCurrentView('login')}
      />
    );
  }

  // Authenticated Dashboard Layout
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        aiModeBadge={aiModeBadge}
      />

      <div className="flex flex-1">
        <Sidebar
          currentTab={currentView}
          onSelectTab={(tab) => setCurrentView(tab)}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'dashboard' && <DashboardPage onNavigate={(tab) => setCurrentView(tab)} />}
          {currentView === 'materials' && <MaterialsPage />}
          {currentView === 'tutor' && <TutorPage />}
          {currentView === 'assessment' && (
            <AssessmentPage
              onCompleteQuiz={(result) => {
                setLastQuizResult(result);
                setCurrentView('results');
              }}
            />
          )}
          {currentView === 'results' && lastQuizResult && (
            <ResultsPage
              result={lastQuizResult}
              onRetake={() => setCurrentView('assessment')}
              onGoToDashboard={() => setCurrentView('dashboard')}
            />
          )}
          {currentView === 'knowledge-map' && (
            <KnowledgeMapPage
              onStartQuizForTopic={(t) => {
                setCurrentView('assessment');
              }}
            />
          )}
          {currentView === 'evaluation' && <EvaluationPage />}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
