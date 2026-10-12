import React from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  MessageSquare,
  GraduationCap,
  Network,
  BarChart3,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'materials', label: 'Materials Library', icon: FolderOpen },
    { id: 'tutor', label: 'AI Tutor Chat', icon: MessageSquare },
    { id: 'assessment', label: 'Adaptive Quizzes', icon: GraduationCap },
    { id: 'knowledge-map', label: 'Concept Map', icon: Network },
    { id: 'evaluation', label: 'Benchmark & Evaluation', icon: BarChart3 },
  ];

  const handleSelect = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div className="p-4 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-200'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-brand-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer info widget */}
        <div className="p-4 m-3 rounded-xl bg-gradient-to-br from-slate-50 to-brand-50/40 border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center space-x-2 text-brand-800 font-bold">
            <BookOpen className="w-3.5 h-3.5 text-brand-600" />
            <span>Bayesian Tracing</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Real-time Corbett & Anderson (BKT) learner mastery estimation active.
          </p>
        </div>
      </aside>
    </>
  );
};
