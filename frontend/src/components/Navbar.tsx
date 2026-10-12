import React from 'react';
import { Sparkles, LogOut, User as UserIcon, Activity, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  aiModeBadge?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, aiModeBadge }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Left: Mobile Toggle & Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileMenu}
            className="p-2 text-slate-500 rounded-lg lg:hidden hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-navy-950 font-sans">
                EduAdapt<span className="text-brand-600">.ai</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                Hackathon 2026
              </span>
            </div>
          </div>
        </div>

        {/* Center: AI Provider Mode Badge */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-700">
          <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>Active AI Engine:</span>
          <span className="font-semibold text-brand-700">
            {aiModeBadge || 'Gemini 3.8 Flash / Local Extractive RAG'}
          </span>
        </div>

        {/* Right: User Profile & Logout */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-navy-900">{user.full_name || 'Student'}</span>
                <span className="text-[11px] text-slate-500">{user.email}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-800 flex items-center justify-center font-bold text-xs border border-navy-200">
                {user.full_name ? user.full_name[0].toUpperCase() : 'S'}
              </div>
              <button
                onClick={logout}
                title="Log Out"
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-slate-500">Not authenticated</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
