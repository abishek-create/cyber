import React from 'react';
import { Shield, Radio, User, LogOut, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useWebSocket } from '../context/WebSocketContext.tsx';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenEmergency: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenEmergency }) => {
  const { user, signInWithGoogle, signInAsDemo, signOut } = useAuth();
  const { systemStatus, isConnected } = useWebSocket();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#0B1F3A] flex items-center justify-center text-white shadow-sm border border-[#1769AA]/30 group-hover:bg-[#123B66] transition-colors">
              <Shield className="w-5 h-5 text-sky-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0B1F3A] font-sans">
              CyberShield
            </span>
          </button>

          {/* Quiet connection status dot */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-200 text-xs text-slate-500 font-mono">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-amber-400'}`} />
            <span>{systemStatus?.database === 'connected' ? 'DB Connected' : 'Syncing'}</span>
          </div>
        </div>

        {/* Zone 2: Clean 4-6 text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setCurrentTab('home')}
            className={`transition-colors py-1 ${currentTab === 'home' ? 'text-[#0B1F3A] font-semibold border-b-2 border-[#1769AA]' : 'hover:text-slate-900'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setCurrentTab('threat-checker')}
            className={`transition-colors py-1 ${currentTab === 'threat-checker' ? 'text-[#0B1F3A] font-semibold border-b-2 border-[#1769AA]' : 'hover:text-slate-900'}`}
          >
            Threat Checker
          </button>
          <button
            onClick={() => setCurrentTab('threats')}
            className={`transition-colors py-1 ${currentTab === 'threats' ? 'text-[#0B1F3A] font-semibold border-b-2 border-[#1769AA]' : 'hover:text-slate-900'}`}
          >
            Threat Library
          </button>
          <button
            onClick={() => setCurrentTab('complaints')}
            className={`transition-colors py-1 ${currentTab === 'complaints' ? 'text-[#0B1F3A] font-semibold border-b-2 border-[#1769AA]' : 'hover:text-slate-900'}`}
          >
            Complaints Portal
          </button>
          <button
            onClick={() => setCurrentTab('awareness')}
            className={`transition-colors py-1 ${currentTab === 'awareness' ? 'text-[#0B1F3A] font-semibold border-b-2 border-[#1769AA]' : 'hover:text-slate-900'}`}
          >
            Awareness
          </button>
          <button
            onClick={() => setCurrentTab('admin')}
            className={`transition-colors py-1 flex items-center gap-1 ${currentTab === 'admin' ? 'text-[#1769AA] font-semibold border-b-2 border-[#1769AA]' : 'hover:text-[#1769AA]'}`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admin SOC</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions & User Auth */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenEmergency}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors whitespace-nowrap"
            title="Immediate cyber fraud helpline"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Emergency 1930</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              >
                <User className="w-3.5 h-3.5 text-[#1769AA]" />
                <span className="truncate max-w-[120px]">{user.fullName || user.email.split('@')[0]}</span>
                {user.role === 'admin' && (
                  <span className="text-[10px] text-sky-700 font-semibold px-1 bg-sky-100 rounded">SOC</span>
                )}
              </button>
              <button
                onClick={() => signOut()}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => signInWithGoogle().catch(() => signInAsDemo('user'))}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#0B1F3A] hover:bg-[#123B66] rounded-lg transition-colors shadow-sm whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                onClick={() => signInAsDemo('user')}
                className="hidden lg:inline-flex px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
                title="Try instant demo account"
              >
                Demo
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
