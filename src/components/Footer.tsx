import React from 'react';
import { Shield } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
  onOpenEmergency: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenEmergency }) => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 py-12 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0B1F3A] flex items-center justify-center text-white">
                <Shield className="w-4 h-4 text-sky-400" />
              </div>
              <span className="text-base font-bold text-[#0B1F3A]">CyberShield</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Real-time cyber safety, threat detection, and incident complaint management platform. Empowering citizens and security operations centers with automated threat intelligence.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">
              Platform Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-slate-900 transition-colors">
                  System Overview
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('threat-checker')} className="hover:text-slate-900 transition-colors">
                  Real-Time Threat Checker
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('threats')} className="hover:text-slate-900 transition-colors">
                  Cyber Threat Dossiers
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('complaints')} className="hover:text-slate-900 transition-colors">
                  Complaint Submission Portal
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">
              Resources & Security
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('awareness')} className="hover:text-slate-900 transition-colors">
                  Cyber Awareness Guides
                </button>
              </li>
              <li>
                <button onClick={onOpenEmergency} className="text-rose-600 hover:text-rose-700 font-medium">
                  Emergency 1930 Helpline
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin')} className="hover:text-slate-900 transition-colors">
                  Security Operations Center (SOC)
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">
              Official Helplines
            </h4>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-[11px]">
              <div className="text-slate-900 font-bold">National Cyber Fraud: 1930</div>
              <div className="text-slate-500">Citizen Financial Portal: cybercrime.gov.in</div>
              <div className="text-slate-400 text-[10px] font-sans">
                Operating under Citizen Financial Cyber Fraud Reporting System guidelines.
              </div>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} CyberShield Operations. Designed for enterprise cyber resilience and incident triage.
          </div>
          <div className="flex items-center gap-4">
            <span>Non-Invasive Analysis Protocol</span>
            <span>·</span>
            <span>PostgreSQL Persistence</span>
            <span>·</span>
            <span>Encrypted Incident Handling</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
